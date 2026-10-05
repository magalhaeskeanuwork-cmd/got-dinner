import { NextResponse } from "next/server";

type GoogleImageItem = {
  link?: string;
  image?: {
    thumbnailLink?: string;
    contextLink?: string;
  };
  title?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const queries = Array.isArray(body?.queries)
      ? body.queries
      : [];

    if (!queries.length) {
      return NextResponse.json({ images: {} });
    }

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      return NextResponse.json({
        images: {},
        configured: false,
      });
    }

    const uniqueQueries = [
      ...new Set(
        queries
          .map((query: unknown) =>
            typeof query === "string" ? query.trim() : ""
          )
          .filter(Boolean)
      ),
    ].slice(0, 8);

    const results = await Promise.all(
      uniqueQueries.map(async (query) => {
        const params = new URLSearchParams({
          key: apiKey,
          cx: searchEngineId,
          q: `${query} recipe`,
          searchType: "image",
          num: "1",
          safe: "active",
          imgType: "photo",
          imgSize: "large",
        });

        const response = await fetch(
          `https://www.googleapis.com/customsearch/v1?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return {
            query,
            image: null,
          };
        }

        const data = await response.json();

        const item = data?.items?.[0] as GoogleImageItem | undefined;

        if (!item) {
          return {
            query,
            image: null,
          };
        }

        return {
          query,
          image: {
            url: item.link || null,
            thumbnail: item.image?.thumbnailLink || null,
            source: item.image?.contextLink || null,
            title: item.title || query,
          },
        };
      })
    );

    const images: Record<string, unknown> = {};

    results.forEach((result) => {
      images[result.query] = result.image;
    });

    return NextResponse.json({
      images,
      configured: true,
    });
  } catch (error) {
    console.error("IMAGE SEARCH ERROR:", error);

    return NextResponse.json(
      {
        error: "Image search failed.",
        images: {},
      },
      { status: 500 }
    );
  }
}