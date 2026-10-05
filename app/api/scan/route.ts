import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("photos") as File[];

    if (!files.length) {
      return NextResponse.json(
        { error: "No photos were provided." },
        { status: 400 }
      );
    }

    const imageParts = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());

        return {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: file.type,
          },
        };
      })
    );

    const prompt = `
You are the kitchen vision system for GOT DINNER?.

Analyze the uploaded kitchen photos.

Identify only food and cooking ingredients that are actually visible.

For every identified item return:
name
quantity
location
category
confidence

Location must be:
fridge
freezer
pantry
unknown

Category must be:
protein
vegetable
fruit
dairy
grain
pasta
sauce
seasoning
snack
frozen
other

Do not invent ingredients.
If you are uncertain, use a lower confidence score.
Avoid duplicate items across different photos.

Return ONLY valid JSON:

{
  "items": [
    {
      "name": "chicken breast",
      "quantity": "2 pieces",
      "location": "fridge",
      "category": "protein",
      "confidence": 0.96
    }
  ],
  "uncertain_items": [
    {
      "possible_name": "yogurt",
      "reason": "Container label is partially visible",
      "location": "fridge",
      "confidence": 0.48
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...imageParts,
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    console.log("GEMINI RESPONSE:", response);

    const text = response?.text;

    if (!text) {
      return NextResponse.json(
        {
          error: "Gemini returned no text.",
          response: response ?? null,
        },
        { status: 500 }
      );
    }

    let inventory;

    try {
      inventory = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error: "Gemini returned invalid JSON.",
          raw: text,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Kitchen scan error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to analyze kitchen photos.",
      },
      { status: 500 }
    );
  }
}