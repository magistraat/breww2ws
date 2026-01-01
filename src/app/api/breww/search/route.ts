import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body?.query === "string" ? body.query : "";

  if (!query) {
    return NextResponse.json(
      { error: "Missing search query." },
      { status: 400 }
    );
  }

  let settings;
  try {
    settings = await getSettings();
  } catch (error) {
    return NextResponse.json(
      {
        error: "Breww settings load failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }

  if (!settings?.breww_subdomain || !settings?.breww_api_key) {
    return NextResponse.json(
      { error: "Breww settings not configured." },
      { status: 400 }
    );
  }

  const baseUrlRaw = settings.breww_subdomain.trim();
  if (!baseUrlRaw) {
    return NextResponse.json(
      { error: "Breww base URL is invalid." },
      { status: 400 }
    );
  }
  const baseUrl = baseUrlRaw.endsWith("/")
    ? baseUrlRaw.slice(0, -1)
    : baseUrlRaw;
  const url = new URL(`${baseUrl}/products/`);
  url.searchParams.set("name__contains", query);
  url.searchParams.set("code__contains", query);
  url.searchParams.set("page_size", "200");

  const tryRequest = async (targetUrl: string, authHeader: string) =>
    fetch(targetUrl, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

  let response = await tryRequest(url.toString(), `Bearer ${settings.breww_api_key}`);
  if (response.status === 401 || response.status === 403) {
    response = await tryRequest(url.toString(), `Token ${settings.breww_api_key}`);
  }

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: "Breww request failed.", status: response.status, details: text },
      { status: response.status }
    );
  }

  const data = await response.json();
  const items = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  const filterItems = (list: Record<string, unknown>[]) => {
    const lowered = query.toLowerCase();
    return list.filter((item) => {
      const fields = [
        item.name,
        item.code,
        item.sku,
        item.barcode_number,
      ].filter(Boolean);
      return fields.some((field) =>
        String(field).toLowerCase().includes(lowered)
      );
    });
  };

  if (Array.isArray(items) && items.length > 0) {
    return NextResponse.json(filterItems(items));
  }

  // Fallback: paginate unfiltered list and filter client-side
  const maxPages = 5;
  let pageCount = 0;
  let nextUrl: string | null = `${baseUrl}/products/?page_size=200`;
  while (nextUrl && pageCount < maxPages) {
    pageCount += 1;
    let fallbackResponse = await tryRequest(
      nextUrl,
      `Bearer ${settings.breww_api_key}`
    );
    if (fallbackResponse.status === 401 || fallbackResponse.status === 403) {
      fallbackResponse = await tryRequest(
        nextUrl,
        `Token ${settings.breww_api_key}`
      );
    }
    if (!fallbackResponse.ok) {
      const text = await fallbackResponse.text();
      return NextResponse.json(
        {
          error: "Breww request failed.",
          status: fallbackResponse.status,
          details: text,
        },
        { status: fallbackResponse.status }
      );
    }
    const fallbackData = await fallbackResponse.json();
    const fallbackItems = Array.isArray(fallbackData?.results)
      ? fallbackData.results
      : Array.isArray(fallbackData?.data)
      ? fallbackData.data
      : Array.isArray(fallbackData)
      ? fallbackData
      : [];
    const filtered = filterItems(fallbackItems);
    if (filtered.length > 0) {
      return NextResponse.json(filtered);
    }
    nextUrl = typeof fallbackData?.next === "string" ? fallbackData.next : null;
  }

  return NextResponse.json([]);
}
