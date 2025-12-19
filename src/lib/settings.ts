import { getServerSupabase } from "@/lib/supabase-server";

export type Settings = {
  id?: string;
  breww_subdomain: string | null;
  breww_api_key: string | null;
  cors_proxy: string | null;
  gemini_api_key: string | null;
};

export async function getSettings() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("settings")
    .select("id, breww_subdomain, breww_api_key, cors_proxy, gemini_api_key")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function upsertSettings(payload: Settings) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("settings")
    .upsert(payload)
    .select("id, breww_subdomain, breww_api_key, cors_proxy, gemini_api_key")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
