import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wholesalerId = searchParams.get("wholesaler_id");
  if (!wholesalerId) {
    return NextResponse.json(
      { error: "Missing wholesaler_id." },
      { status: 400 }
    );
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("templates")
    .select("id, name, wholesaler_id")
    .eq("wholesaler_id", wholesalerId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
