import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const productIdValue =
    typeof body?.productId === "string" || typeof body?.productId === "number"
      ? String(body.productId)
      : "";

  if (!productIdValue) {
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
  const candidates = [
    `${baseUrl}/products/${productIdValue}/stock-items/`,
    `${baseUrl}/stock_items/?product_id=${productIdValue}`,
    `${baseUrl}/stock-items/?product_id=${productIdValue}`,
  ];

  const tryRequest = async (targetUrl: string, authHeader: string) =>
    fetch(targetUrl, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

  let lastError: { status: number; details: string } | null = null;
  for (const targetUrl of candidates) {
    let response = await tryRequest(targetUrl, `Bearer ${settings.breww_api_key}`);
    if (response.status === 401 || response.status === 403) {
      response = await tryRequest(targetUrl, `Token ${settings.breww_api_key}`);
    }
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
    const text = await response.text();
    lastError = { status: response.status, details: text };
  }

  return NextResponse.json(
    {
      error: "Breww request failed.",
      status: lastError?.status ?? 404,
      details: lastError?.details ?? "No endpoint matched.",
    },
    { status: lastError?.status ?? 404 }
  );
}
