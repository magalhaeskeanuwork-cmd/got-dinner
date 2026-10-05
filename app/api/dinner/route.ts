import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.1-flash-lite";

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");

  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function cleanString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function cleanNumber(
  value: unknown,
  fallback = 0
): number {
  const number =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function cleanBoolean(
  value: unknown,
  fallback = false
): boolean {
  return typeof value === "boolean"
    ? value
    : fallback;
}

function cleanStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanString(item))
    .filter(Boolean);
}

function normalizeStep(
  step: unknown,
  index: number
) {
  const item =
    typeof step === "object" &&
    step !== null
      ? step as Record<string, unknown>
      : {};

  return {
    step:
      cleanNumber(item.step, index + 1),
    title:
      cleanString(item.title) ||
      `Step ${index + 1}`,
    instruction:
      cleanString(item.instruction),
    time_minutes:
      cleanNumber(item.time_minutes, 0),
    heat:
      item.heat === null ||
      item.heat === undefined
        ? null
        : cleanString(item.heat),
    temperature_celsius:
      item.temperature_celsius === null ||
      item.temperature_celsius === undefined
        ? null
        : cleanNumber(
            item.temperature_celsius,
            0
          ),
    what_to_look_for:
      cleanString(item.what_to_look_for),
  };
}

function normalizeMistake(
  mistake: unknown
) {
  const item =
    typeof mistake === "object" &&
    mistake !== null
      ? mistake as Record<string, unknown>
      : {};

  return {
    mistake:
      cleanString(item.mistake),
    how_to_avoid:
      cleanString(item.how_to_avoid),
  };
}

function normalizeSubstitution(
  substitution: unknown
) {
  const item =
    typeof substitution === "object" &&
    substitution !== null
      ? substitution as Record<string, unknown>
      : {};

  return {
    ingredient:
      cleanString(item.ingredient),
    replacement:
      cleanString(item.replacement),
    instructions:
      cleanString(item.instructions),
  };
}

function normalizeIngredient(
  ingredient: unknown
) {
  const item =
    typeof ingredient === "object" &&
    ingredient !== null
      ? ingredient as Record<string, unknown>
      : {};

  return {
    name:
      cleanString(item.name),
    amount:
      cleanString(item.amount),
    from_kitchen:
      cleanBoolean(
        item.from_kitchen,
        false
      ),
    preparation:
      cleanString(item.preparation),
  };
}

function normalizeMissingIngredient(
  ingredient: unknown
) {
  const item =
    typeof ingredient === "object" &&
    ingredient !== null
      ? ingredient as Record<string, unknown>
      : {};

  return {
    name:
      cleanString(item.name),
    amount:
      cleanString(item.amount),
    essential:
      cleanBoolean(
        item.essential,
        false
      ),
  };
}

function normalizeStorage(
  storage: unknown
) {
  const item =
    typeof storage === "object" &&
    storage !== null
      ? storage as Record<string, unknown>
      : {};

  return {
    refrigerator:
      cleanString(item.refrigerator),
    reheating:
      cleanString(item.reheating),
    freezer:
      cleanString(item.freezer),
  };
}

function normalizeRecipe(
  recipe: unknown
) {
  const item =
    typeof recipe === "object" &&
    recipe !== null
      ? recipe as Record<string, unknown>
      : {};

  const steps = Array.isArray(item.steps)
    ? item.steps.map(normalizeStep)
    : [];

  return {
    id:
      cleanString(item.id),

    name:
      cleanString(item.name),

    description:
      cleanString(item.description),

    match_percentage:
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            cleanNumber(
              item.match_percentage,
              0
            )
          )
        )
      ),

    total_time_minutes:
      cleanNumber(
        item.total_time_minutes,
        0
      ),

    prep_time_minutes:
      cleanNumber(
        item.prep_time_minutes,
        0
      ),

    cook_time_minutes:
      cleanNumber(
        item.cook_time_minutes,
        0
      ),

    difficulty:
      cleanString(item.difficulty)
        .toLowerCase() || "easy",

    servings:
      cleanNumber(
        item.servings,
        2
      ),

    equipment:
      cleanStringArray(
        item.equipment
      ),

    ingredients:
      Array.isArray(item.ingredients)
        ? item.ingredients.map(
            normalizeIngredient
          )
        : [],

    missing_ingredients:
      Array.isArray(
        item.missing_ingredients
      )
        ? item.missing_ingredients.map(
            normalizeMissingIngredient
          )
        : [],

    prep_before_starting:
      cleanStringArray(
        item.prep_before_starting
      ),

    steps,

    common_mistakes:
      Array.isArray(
        item.common_mistakes
      )
        ? item.common_mistakes.map(
            normalizeMistake
          )
        : [],

    substitutions:
      Array.isArray(
        item.substitutions
      )
        ? item.substitutions.map(
            normalizeSubstitution
          )
        : [],

    optional_upgrades:
      cleanStringArray(
        item.optional_upgrades
      ),

    serving_instructions:
      cleanStringArray(
        item.serving_instructions
      ),

    storage:
      normalizeStorage(
        item.storage
      ),

    chef_tip:
      cleanString(item.chef_tip),

    tags:
      cleanStringArray(item.tags),
  };
}

export async function POST(
  request: Request
) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      await request.json();

    const inventory =
      Array.isArray(body?.inventory)
        ? body.inventory
        : [];

    const filters =
      body?.filters || {};

    if (!inventory.length) {
      return NextResponse.json(
        {
          error:
            "No kitchen inventory was provided.",
        },
        {
          status: 400,
        }
      );
    }

    const inventoryText =
      JSON.stringify(
        inventory,
        null,
        2
      );

    const timeLimit =
      filters?.time || "30";

    const foodStyles =
      Array.isArray(
        filters?.foodStyle
      )
        ? filters.foodStyle
        : [];

    const appliances =
      Array.isArray(
        filters?.appliance
      )
        ? filters.appliance
        : [];

    const temperature =
      filters?.temperature ||
      "hot";

    const cuisines =
      Array.isArray(
        filters?.cuisines
      )
        ? filters.cuisines
        : [];

    const prompt = `
You are the cooking intelligence behind GOT DINNER?, an AI kitchen assistant.

Your job is to turn the user's actual kitchen inventory and preferences into realistic recipes that they can successfully cook at home.

The most important objective is not simply to suggest recipes.

Your objective is to give the user recipes they can ACTUALLY FOLLOW.

The person using this app may be a complete beginner.

Write every recipe as if you are personally standing beside the user in their kitchen and calmly guiding them through the entire meal.

Do not assume cooking knowledge.

Do not assume the user knows what cooking terminology means.

Do not make the user guess.

The user should never have to guess:

• how much of an ingredient to use
• how to prepare an ingredient
• when to add an ingredient
• which pan or pot to use
• which appliance to use
• how high the heat should be
• what temperature to use
• how long to cook something
• when to stir
• when to flip
• when to cover
• when to uncover
• when to reduce heat
• whether the food is ready
• what the food should look like
• what the food should smell like
• what texture the food should have

==================================================
USER KITCHEN
==================================================

Here is the user's current kitchen inventory:

${inventoryText}

Only consider ingredients in this inventory to be available.

Never claim that the user owns an ingredient unless it appears in the inventory.

You may assume only:

• salt
• black pepper
• basic cooking oil
• water

unless the inventory explicitly contains something else.

==================================================
USER PREFERENCES
==================================================

Maximum time:
${timeLimit} minutes

Food styles:
${
  foodStyles.length
    ? foodStyles.join(", ")
    : "No specific food style"
}

Available appliances:
${
  appliances.length
    ? appliances.join(", ")
    : "Normal home kitchen"
}

Temperature:
${temperature}

Preferred cuisines:
${
  cuisines.length
    ? cuisines.join(", ")
    : "No specific cuisine"
}

==================================================
RECIPE PRIORITIES
==================================================

Prioritize:

1. Ingredients already available.
2. Recipes that genuinely fit the selected preferences.
3. Recipes that can be completed within the selected time.
4. Recipes requiring minimal missing ingredients.
5. Perishable ingredients where practical.
6. Simple home cooking techniques.
7. Recipes that are genuinely enjoyable and coherent.

Do not sacrifice culinary quality simply to increase the match percentage.

Never invent an ingredient just to make a recipe work.

Clearly identify every missing ingredient.

Do not recommend specialist ingredients or specialist equipment unless absolutely necessary.

Do not recommend specialist cooking techniques simply to make a recipe sound sophisticated.

==================================================
DIETARY RULES
==================================================

If Vegan is selected:

Absolutely no:

• meat
• poultry
• fish
• seafood
• eggs
• dairy

If Vegetarian is selected:

No meat, poultry or fish.

If Low Carb is selected:

Meaningfully minimize carbohydrates.

If Keto is selected:

Keep carbohydrates very low and use keto appropriate ingredients.

If Low Calorie is selected:

Favor lighter preparations and reasonable portions.

If High Protein is selected:

Include a meaningful protein source.

If Comfort Food is selected:

The dish should feel satisfying, familiar and comforting.

==================================================
TEMPERATURE RULES
==================================================

If temperature is "cold":

Do not recommend recipes that require cooking.

Suitable examples include:

• salads
• bowls
• sandwiches
• wraps
• chilled pasta salads
• cold noodle dishes
• tartares
• chilled soups
• yogurt based bowls

If temperature is "hot":

Recipes should be served warm or hot.

If No Cooking is selected:

Absolutely no stove, oven, microwave, air fryer or other cooking.

==================================================
TIME RULES
==================================================

Respect the selected maximum time.

Total time includes preparation and cooking.

Do not say a recipe takes 20 minutes if the actual instructions require 35 minutes.

Make individual step timings realistic.

==================================================
BEGINNER COOKING STANDARD
==================================================

Every recipe must be understandable to someone who has never made it before.

Do not use vague instructions such as:

"Cook until done."

"Cook until ready."

"Season to taste."

"Add some oil."

"Cook as usual."

"Prepare normally."

"Heat until ready."

Instead, explain exactly what the user should do.

For example:

Bad:

"Cook the chicken until done."

Good:

"Heat a large frying pan over medium heat for about 1 minute. Add 1 tablespoon of oil. Wait about 20 seconds until the oil looks slightly shimmery but is not smoking. Place the chicken pieces in a single layer. Cook without moving them for 3 to 4 minutes until the underside is golden brown. Turn each piece and cook for another 3 to 4 minutes. The chicken should be completely opaque in the center. If using a thermometer, the thickest piece should reach 74°C."

Give this level of practical detail throughout the recipe.

==================================================
PREPARATION
==================================================

Every recipe must include a PREP BEFORE STARTING section.

Explain exactly what to prepare before cooking.

For example:

• Wash vegetables.
• Dry them properly.
• Peel ingredients if necessary.
• Remove stems or seeds where appropriate.
• Chop ingredients to a specific size.
• Slice ingredients to a specific thickness.
• Grate cheese.
• Measure sauces.
• Measure spices.
• Thaw frozen ingredients safely when necessary.
• Preheat the oven or appliance when necessary.

Tell the user to measure ingredients before beginning when this would make the recipe easier.

==================================================
INGREDIENTS
==================================================

Every ingredient must have a practical quantity.

Prefer:

• grams
• millilitres
• tablespoons
• teaspoons
• cups when appropriate
• number of items

Avoid vague quantities such as:

• some
• a little
• enough
• a handful

unless the ingredient genuinely cannot be measured.

For each ingredient provide:

• name
• amount
• whether it is already in the kitchen
• preparation instructions

==================================================
EQUIPMENT
==================================================

List the equipment needed.

Use normal home kitchen equipment.

Examples:

• frying pan
• saucepan
• baking tray
• mixing bowl
• knife
• chopping board
• wooden spoon
• spatula
• tongs
• measuring spoon

Do not require specialist equipment unless absolutely necessary.

==================================================
COOKING STEPS
==================================================

This is the most important section.

Give extremely detailed sequential cooking steps.

Every step should explain:

• what to do
• which ingredient to use
• how much to use
• which equipment to use
• heat level
• temperature when appropriate
• approximate duration
• what to watch for
• what the food should look like
• what texture it should have
• how the user knows the step is complete

Break complicated actions into separate steps.

Do not combine too many actions into one step.

Each important stage should have its own step.

Use realistic times.

Include heat guidance such as:

• low
• medium-low
• medium
• medium-high
• high

If useful, explain what the heat should feel like.

==================================================
DONENESS
==================================================

Always provide practical doneness indicators.

For meat:

• color
• texture
• internal temperature when appropriate
• juices where relevant

For pasta:

• texture
• bite
• approximate cooking time

For vegetables:

• color
• tenderness
• texture

For eggs:

• appearance of whites
• appearance of yolks

For sauces:

• thickness
• coating consistency
• appearance

For baked dishes:

• color
• firmness
• internal signs where appropriate

Do not rely only on time.

==================================================
COOKING TERMINOLOGY
==================================================

Do not assume the user understands terms such as:

• sauté
• sear
• simmer
• reduce
• deglaze
• fold
• blanch
• emulsify
• julienne

Prefer plain language.

If a technical term is genuinely useful, explain it immediately.

For example:

"Simmer, meaning small gentle bubbles rather than vigorous boiling."

==================================================
COMMON MISTAKES
==================================================

Every recipe must include 2 to 5 recipe specific beginner mistakes.

For each mistake explain how to avoid it.

Examples:

• overcrowding the pan
• burning garlic
• using heat that is too high
• cutting ingredients unevenly
• adding ingredients in the wrong order
• overcooking pasta
• not allowing meat to rest

Do not use generic mistakes unrelated to the recipe.

==================================================
SUBSTITUTIONS
==================================================

Provide realistic substitutions when useful.

Explain how the substitution affects:

• quantity
• cooking time
• texture
• flavor

Do not suggest substitutions that would fundamentally break the recipe.

==================================================
OPTIONAL UPGRADES
==================================================

Provide optional additions that can make the recipe better.

These must never be necessary.

The recipe must work without them.

==================================================
SERVING
==================================================

Explain how to serve the finished meal.

Include:

• whether to serve immediately
• whether to rest first
• how to plate it
• optional garnish
• optional finishing ingredients

==================================================
STORAGE
==================================================

When relevant, explain:

• refrigerator storage
• approximate safe storage period
• reheating
• freezer suitability

If freezing is not recommended, say so.

==================================================
CHEF TIP
==================================================

Finish each recipe with one useful chef tip specific to that recipe.

==================================================
RECIPE VARIETY
==================================================

Return exactly 6 different recipes.

Do not return six minor variations of the same dish.

Aim for meaningful variety while respecting the user's inventory and preferences.

The strongest recipe should appear first.

==================================================
MATCH PERCENTAGE
==================================================

The match percentage should reflect:

• available ingredients
• missing ingredients
• selected food style
• selected cuisine
• selected appliance
• selected temperature
• selected time
• dietary requirements

Do not inflate the percentage.

A recipe requiring many missing ingredients should not receive a very high match.

==================================================
OUTPUT FORMAT
==================================================

Return valid JSON only.

Do not include Markdown.

Do not include commentary outside the JSON.

Use exactly this structure:

{
  "recipes": [
    {
      "id": "recipe-1",
      "name": "Recipe name",
      "description": "Clear description of the finished dish and what the user should expect.",

      "match_percentage": 94,

      "total_time_minutes": 28,
      "prep_time_minutes": 8,
      "cook_time_minutes": 20,

      "difficulty": "easy",

      "servings": 2,

      "equipment": [
        "Large frying pan",
        "Sharp knife",
        "Cutting board",
        "Wooden spoon"
      ],

      "ingredients": [
        {
          "name": "Chicken breast",
          "amount": "300 g",
          "from_kitchen": true,
          "preparation": "Cut into pieces approximately 2 cm wide."
        }
      ],

      "missing_ingredients": [
        {
          "name": "Fresh parsley",
          "amount": "10 g",
          "essential": false
        }
      ],

      "prep_before_starting": [
        "Wash and dry the vegetables.",
        "Cut the chicken into approximately 2 cm pieces.",
        "Measure the remaining ingredients before turning on the stove."
      ],

      "steps": [
        {
          "step": 1,
          "title": "Prepare the chicken",
          "instruction": "Pat the chicken dry with paper towel and cut it into approximately 2 cm pieces.",
          "time_minutes": 3,
          "heat": null,
          "temperature_celsius": null,
          "what_to_look_for": "The chicken should be cut into similarly sized pieces so they cook evenly."
        },
        {
          "step": 2,
          "title": "Heat the pan",
          "instruction": "Place a large frying pan over medium heat for approximately 1 minute. Add 1 tablespoon of cooking oil and wait about 20 seconds. The oil should look slightly shimmery but should not be smoking.",
          "time_minutes": 2,
          "heat": "medium",
          "temperature_celsius": null,
          "what_to_look_for": "The oil should move easily around the pan when you tilt it slightly."
        }
      ],

      "common_mistakes": [
        {
          "mistake": "Overcrowding the pan with chicken.",
          "how_to_avoid": "Keep the chicken in a single layer with a little space between pieces. If necessary, cook it in two batches."
        }
      ],

      "substitutions": [
        {
          "ingredient": "Chicken breast",
          "replacement": "Chicken thigh",
          "instructions": "Use the same approximate weight. Chicken thigh may require a few additional minutes of cooking."
        }
      ],

      "optional_upgrades": [
        "Finish with freshly chopped parsley just before serving."
      ],

      "serving_instructions": [
        "Serve immediately while hot.",
        "Divide the food evenly between two plates."
      ],

      "storage": {
        "refrigerator": "Store leftovers in a sealed container in the refrigerator.",
        "reheating": "Reheat gently until steaming hot throughout.",
        "freezer": "Freezing is not recommended for this recipe."
      },

      "chef_tip": "Do not move the chicken too early. Giving it time to brown properly creates more flavor."
    }
  ]
}
`;

    const result =
      await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType:
            "application/json",
          temperature: 0.7,
        },
      });

    const rawText =
      typeof result.text === "string"
        ? result.text.trim()
        : "";

    if (!rawText) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    let parsed: unknown;

    try {
      parsed =
        JSON.parse(rawText);
    } catch {
      const extracted =
        extractFirstJsonObject(
          rawText
        );

      if (!extracted) {
        console.error(
          "Could not extract JSON from Gemini response:",
          rawText
        );

        throw new Error(
          "Gemini returned invalid recipe data."
        );
      }

      parsed =
        JSON.parse(extracted);
    }

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(
        (parsed as Record<string, unknown>)
          .recipes
      )
    ) {
      throw new Error(
        "Gemini returned an invalid recipe structure."
      );
    }

    const recipes =
      (
        parsed as {
          recipes: unknown[];
        }
      ).recipes
        .slice(0, 6)
        .map(normalizeRecipe)
        .filter(
          (recipe) =>
            recipe.name &&
            recipe.description &&
            recipe.ingredients.length > 0 &&
            recipe.steps.length > 0
        );

    if (!recipes.length) {
      throw new Error(
        "Gemini did not return usable recipes."
      );
    }

    return NextResponse.json({
      recipes,
    });
  } catch (error) {
    console.error(
      "DINNER API ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown dinner generation error.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}