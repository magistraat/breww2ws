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

  const tryRequest = async (authHeader: string) =>
    fetch(url, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

  let response = await tryRequest(`Bearer ${settings.breww_api_key}`);
  if (response.status === 401 || response.status === 403) {
    response = await tryRequest(`Token ${settings.breww_api_key}`);
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

  if (Array.isArray(items)) {
    const lowered = query.toLowerCase();
    const filtered = items.filter((item: Record<string, unknown>) => {
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
    return NextResponse.json(filtered);
  }

  return NextResponse.json([]);
}
