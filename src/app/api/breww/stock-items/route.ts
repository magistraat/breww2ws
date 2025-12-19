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

  const settings = await getSettings();
  if (!settings?.breww_subdomain || !settings?.breww_api_key) {
    return NextResponse.json(
      { error: "Breww settings not configured." },
      { status: 400 }
    );
  }

  const url = `https://${settings.breww_subdomain}.breww.com/api/products/${productId}/stock-items`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${settings.breww_api_key}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Breww request failed." },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
