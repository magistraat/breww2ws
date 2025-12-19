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
  const payload = {
    wholesaler_id:
      typeof body?.wholesaler_id === "string" ? body.wholesaler_id : null,
    name: typeof body?.name === "string" ? body.name : null,
    workbook_base64:
      typeof body?.workbook_base64 === "string" ? body.workbook_base64 : null,
    mapping_json: typeof body?.mapping_json === "object" ? body.mapping_json : {},
  };

  if (!payload.wholesaler_id || !payload.name || !payload.workbook_base64) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("templates")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}

export async function GET(request: Request) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const wholesalerId = searchParams.get("wholesaler_id");

  const supabase = getServerSupabase();
  let query = supabase
    .from("templates")
    .select("id, name, wholesaler_id, mapping_json, created_at")
    .order("created_at", { ascending: false });

  if (wholesalerId) {
    query = query.eq("wholesaler_id", wholesalerId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function PATCH(request: Request) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : "";
  const mapping_json =
    typeof body?.mapping_json === "object" ? body.mapping_json : null;

  if (!id || !mapping_json) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("templates")
    .update({ mapping_json })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
