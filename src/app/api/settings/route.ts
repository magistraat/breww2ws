import { NextResponse } from "next/server";
import { getSettings, upsertSettings } from "@/lib/settings";
import { requireEnv } from "@/lib/env";

function assertAdmin(request: Request) {
  const token = request.headers.get("x-admin-token");
  const expected = requireEnv("ADMIN_TOKEN");
  if (!token || token !== expected) {
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  return NextResponse.json(settings ?? {});
}

export async function POST(request: Request) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const payload = {
    id: typeof body?.id === "string" ? body.id : undefined,
    breww_subdomain:
      typeof body?.breww_subdomain === "string" ? body.breww_subdomain : null,
    breww_api_key:
      typeof body?.breww_api_key === "string" ? body.breww_api_key : null,
    cors_proxy: typeof body?.cors_proxy === "string" ? body.cors_proxy : null,
    gemini_api_key:
      typeof body?.gemini_api_key === "string" ? body.gemini_api_key : null,
  };

  const data = await upsertSettings(payload);
  return NextResponse.json(data);
}
