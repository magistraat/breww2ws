import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export async function GET() {
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
