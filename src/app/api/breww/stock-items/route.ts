import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const productId = typeof body?.productId === "string" ? body.productId : "";

  if (!productId) {
    return NextResponse.json(
      { error: "Missing productId." },
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
  const url = `${baseUrl}/products/${productId}/stock-items`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${settings.breww_api_key}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: "Breww request failed.", status: response.status, details: text },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
