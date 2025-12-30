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
  const baseUrl = "https://generativelanguage.googleapis.com";
  const apiVersions = ["v1beta", "v1"];

  const listModels = async (version: string) => {
    const response = await fetch(
      `${baseUrl}/${version}/models?key=${apiKey}`
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `ListModels failed (${version}): ${response.status} ${text}`
      );
    }
    const data = await response.json();
    const models = Array.isArray(data?.models) ? data.models : [];
    return models.map((model: { name?: string; supportedGenerationMethods?: string[] }) => ({
      name: model.name,
      methods: model.supportedGenerationMethods ?? [],
      version,
    }));
  };

  let selectedModel: { name: string; version: string } | null = null;
  let listErrors: string[] = [];
  for (const version of apiVersions) {
    try {
      const models = await listModels(version);
      const supported = models.filter((model) =>
        model.methods.includes("generateContent")
      );
      const flashModel = supported.find((model) =>
        /gemini.*flash/i.test(model.name ?? "")
      );
      const fallback = supported[0];
      const pick = flashModel ?? fallback;
      if (pick?.name) {
        selectedModel = { name: pick.name, version };
        break;
      }
    } catch (error) {
      listErrors.push(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  if (!selectedModel) {
    return NextResponse.json(
      {
        error: "No compatible Gemini models found.",
        details: listErrors,
      },
      { status: 400 }
    );
  }

  const endpoint = `${baseUrl}/${selectedModel.version}/${selectedModel.name}:generateContent`;

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
        model: selectedModel,
        status: response.status,
        details: text,
      },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
