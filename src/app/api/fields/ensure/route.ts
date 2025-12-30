import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";
import { requireEnv } from "@/lib/env";

function assertAdmin(request: Request) {
  const token = request.headers.get("x-admin-token");
  const expected = requireEnv("ADMIN_TOKEN");
  return Boolean(token && token === expected);
}

export async function POST(request: Request) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const keys: string[] = Array.isArray(body?.keys)
    ? body.keys.filter((item: unknown) => typeof item === "string")
    : [];
  const scope = typeof body?.scope === "string" ? body.scope : "wholesaler";
  const wholesalerId =
    typeof body?.wholesaler_id === "string" ? body.wholesaler_id : null;
  const source = typeof body?.source === "string" ? body.source : "manual";

  if (keys.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const records = keys.map((key: string) => ({
    key,
    label: key.replace(/_/g, " "),
    scope,
    wholesaler_id: scope === "wholesaler" ? wholesalerId : null,
    source,
  }));

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("field_definitions")
    .upsert(records, { onConflict: "key,scope,wholesaler_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
