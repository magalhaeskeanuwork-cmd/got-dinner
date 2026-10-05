import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.1-flash-lite";

function extractFirstJsonObject(text: string) {
  const start = text.indexOf("{");

  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth++;
    }

    if (char === "}") {
      depth--;

      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const inventory = Array.isArray(body?.inventory)
      ? body.inventory
      : [];

    const filters = body?.filters || {};

    if (!inventory.length) {
      return NextResponse.json(
        {
          error: "No kitchen ingredients were provided.",
        },
        { status: 400 }
      );
    }

    const timeLimit = filters.time || "30";
    const foodStyles = Array.isArray(filters.foodStyle)
      ? filters.foodStyle
      : [];
    const appliances = Array.isArray(filters.appliance)
      ? filters.appliance
      : [];
    const temperature = filters.temperature || "hot";
    const cuisines = Array.isArray(filters.cuisines)
      ? filters.cuisines
      : [];

    const inventoryText = inventory
      .map((item: any) => {
        const name = item?.name || "Unknown ingredient";
        const quantity = item?.quantity
          ? ` (${item.quantity})`
          : "";
        const location = item?.location
          ? ` [${item.location}]`
          : "";

        return `${name}${quantity}${location}`;
      })
      .join("\n");

    const prompt = `
You are the AI dinner generator for GOT DINNER?

Your job is to create exactly 6 realistic recipes using the user's actual kitchen inventory.

KITCHEN INVENTORY:
${inventoryText}

USER PREFERENCES:

Maximum cooking time:
${timeLimit} minutes

Food styles:
${foodStyles.length ? foodStyles.join(", ") : "No specific preference"}

Appliances available:
${appliances.length ? appliances.join(", ") : "Normal home kitchen"}

Temperature:
${temperature}

Preferred cuisines:
${cuisines.length ? cuisines.join(", ") : "No specific cuisine preference"}

IMPORTANT RULES:

1. Prioritize ingredients that are actually in the kitchen.

2. Never pretend that an ingredient is owned if it is not listed in the kitchen inventory.

3. Basic assumptions are allowed:
salt, pepper, water and cooking oil.

4. Clearly identify every ingredient that is missing.

5. Respect the maximum cooking time.

6. Respect the selected food styles.

7. Respect the available appliances.

8. Respect hot or cold preference.

9. Respect the selected cuisines.

10. Multiple cuisines can be combined when appropriate.

11. Respect dietary restrictions.

12. Vegan means no meat, fish, seafood, eggs or dairy.

13. Vegetarian means no meat or fish.

14. Low carb and keto should minimize carbohydrates.

15. Low calorie should favor lighter meals.

16. High protein should contain a meaningful protein source.

17. Comfort food should feel satisfying and familiar.

18. Prefer recipes that use several ingredients already available.

19. Minimize missing ingredients.

20. Prioritize ingredients that are perishable.

21. Recipes must be realistic for a normal home kitchen.

22. Do not require specialist equipment.

23. Do not create duplicate recipes.

24. Put the strongest recipes first.

25. The match percentage should reflect both kitchen inventory and the user's preferences.

26. Give clear sequential cooking instructions.

27. Do not use vague instructions.

28. If the selected temperature is "cold", recipes should be things such as salads, bowls, sandwiches, wraps, tartares or chilled dishes.

29. If the selected temperature is "hot", recipes should involve a warm cooked meal.

30. If "No Cooking" is selected, do not require cooking.

Return ONLY valid JSON.

Do not include markdown.

Do not include explanations before or after the JSON.

Return exactly this structure:

{
  "recipes": [
    {
      "name": "Recipe name",
      "description": "Short appealing description",
      "match_percentage": 95,
      "total_time_minutes": 20,
      "difficulty": "easy",
      "servings": 2,
      "ingredients": [
        {
          "name": "Ingredient",
          "amount": "amount",
          "from_kitchen": true
        }
      ],
      "missing_ingredients": [
        {
          "name": "Ingredient",
          "amount": "amount",
          "essential": false
        }
      ],
      "steps": [
        "Step 1",
        "Step 2",
        "Step 3"
      ],
      "tags": [
        "quick",
        "high protein",
        "Mediterranean"
      ]
    }
  ]
}

The recipes array MUST contain exactly 6 recipes.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() || "";

    let parsed: any;

    try {
      parsed = JSON.parse(text);
    } catch {
      console.error(
        "Gemini returned non-clean JSON. Attempting extraction."
      );

      const extracted = extractFirstJsonObject(text);

      if (!extracted) {
        console.error("Invalid Gemini response:", text);

        throw new Error(
          "Gemini returned invalid recipe data."
        );
      }

      try {
        parsed = JSON.parse(extracted);
      } catch {
        console.error(
          "Invalid extracted Gemini JSON:",
          extracted
        );

        throw new Error(
          "Gemini returned invalid recipe data."
        );
      }
    }

    if (
      !parsed ||
      !Array.isArray(parsed.recipes) ||
      parsed.recipes.length === 0
    ) {
      console.error(
        "Gemini response missing recipes:",
        parsed
      );

      throw new Error(
        "Gemini returned invalid recipe data."
      );
    }

    const recipes = parsed.recipes
      .slice(0, 6)
      .map((recipe: any, index: number) => ({
        id:
          recipe.id ||
          `${recipe.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "recipe"}-${index}`,
        name: recipe.name || "Untitled recipe",
        description: recipe.description || "",
        match_percentage:
          typeof recipe.match_percentage === "number"
            ? recipe.match_percentage
            : 0,
        total_time_minutes:
          typeof recipe.total_time_minutes === "number"
            ? recipe.total_time_minutes
            : 0,
        difficulty: recipe.difficulty || "easy",
        servings:
          typeof recipe.servings === "number"
            ? recipe.servings
            : 2,
        ingredients: Array.isArray(recipe.ingredients)
          ? recipe.ingredients
          : [],
        missing_ingredients: Array.isArray(
          recipe.missing_ingredients
        )
          ? recipe.missing_ingredients
          : [],
        steps: Array.isArray(recipe.steps)
          ? recipe.steps
          : [],
        tags: Array.isArray(recipe.tags)
          ? recipe.tags
          : [],
      }));

    return NextResponse.json({
      recipes,
    });
  } catch (error) {
    console.error("Dinner API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Dinner generation failed.",
      },
      { status: 500 }
    );
  }
}