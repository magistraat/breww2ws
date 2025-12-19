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

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("wholesalers")
    .select("id, name, slug, brand_color")
    .order("name");

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
  const payload = {
    name: typeof body?.name === "string" ? body.name : null,
    slug: typeof body?.slug === "string" ? body.slug : null,
    brand_color:
      typeof body?.brand_color === "string" ? body.brand_color : null,
  };

  if (!payload.name || !payload.slug) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("wholesalers")
    .insert(payload)
    .select("id, name, slug, brand_color")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
