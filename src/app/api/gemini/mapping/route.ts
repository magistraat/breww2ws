import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const workbookText =
    typeof body?.workbookText === "string" ? body.workbookText : "";

  if (!workbookText) {
    return NextResponse.json(
      { error: "Missing workbookText." },
      { status: 400 }
    );
  }

  const settings = await getSettings();
  if (!settings?.gemini_api_key) {
    return NextResponse.json(
      { error: "Gemini settings not configured." },
      { status: 400 }
    );
  }
  const apiKey = settings.gemini_api_key;
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

  const prompt = [
    "Je bent een tool die Excel templates mapt voor groothandels.",
    "Analyseer de tabbladen en geef alleen JSON terug met velden en cellen.",
    "Gebruik deze keys waar mogelijk:",
    "artikelnaam, ean, sku, abv, volume, merknaam, verpakking, inhoud, herkomst, allergenen, marketing_omschrijving",
    "Voorbeeld: {\"artikelnaam\":\"Sheet1!B12\",\"ean\":\"Sheet1!D9\"}",
    "Geef uitsluitend het JSON object terug, zonder extra tekst.",
    `Template inhoud:\n${workbookText}`,
  ].join("\n");

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      {
        error: "Gemini request failed.",
        status: response.status,
        details: text,
      },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
