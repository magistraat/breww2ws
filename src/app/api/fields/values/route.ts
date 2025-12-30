import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";
import { requireEnv } from "@/lib/env";

function assertAdmin(request: Request) {
  const token = request.headers.get("x-admin-token");
  const expected = requireEnv("ADMIN_TOKEN");
  return Boolean(token && token === expected);
}

export async function GET(request: Request) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "wholesaler";
  const wholesalerId = searchParams.get("wholesaler_id");

  const supabase = getServerSupabase();
  let query = supabase
    .from("field_definitions")
    .select("id, key, label, scope, wholesaler_id, source, field_values(value)")
    .eq("scope", scope)
    .order("key");

  if (scope === "wholesaler") {
    if (!wholesalerId) {
      return NextResponse.json(
        { error: "Missing wholesaler_id." },
        { status: 400 }
      );
    }
    query = query.eq("wholesaler_id", wholesalerId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const supabase = getServerSupabase();
  const records = items.map((item) => ({
    field_definition_id: item.field_definition_id,
    value: typeof item.value === "string" ? item.value : "",
  }));

  const { error } = await supabase
    .from("field_values")
    .upsert(records, { onConflict: "field_definition_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
