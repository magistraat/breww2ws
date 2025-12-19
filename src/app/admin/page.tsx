"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

type SettingsForm = {
  id?: string;
  breww_subdomain: string;
  breww_api_key: string;
  cors_proxy: string;
  gemini_api_key: string;
};

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState("");
  const [form, setForm] = useState<SettingsForm>({
    breww_subdomain: "",
    breww_api_key: "",
    cors_proxy: "",
    gemini_api_key: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  useEffect(() => {
    let mounted = true;
    const storedToken = window.localStorage.getItem("adminToken") ?? "";
    setAdminToken(storedToken);

    const load = async () => {
      if (!storedToken) return;
      const response = await fetch("/api/settings", {
        headers: { "x-admin-token": storedToken },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!mounted || !data) return;
      setForm({
        id: data.id,
        breww_subdomain: data.breww_subdomain ?? "",
        breww_api_key: data.breww_api_key ?? "",
        cors_proxy: data.cors_proxy ?? "",
        gemini_api_key: data.gemini_api_key ?? "",
      });
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange =
    (field: keyof SettingsForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSave = async () => {
    if (!adminToken) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    const data = await response.json();
    setForm((prev) => ({ ...prev, id: data.id }));
    setStatus("saved");
    window.setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <div className="min-h-screen px-6 py-10 text-[15px] text-foreground md:px-12">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-8 py-7 shadow-[0_12px_40px_rgba(31,35,40,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          Beheer
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin dashboard
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[#fefbf7] px-4 py-2 text-xs font-semibold text-[var(--muted)]">
            <ShieldCheck className="h-4 w-4" />
            Configuratie opgeslagen in Supabase
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[0_10px_30px_rgba(31,35,40,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              API beheer
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Breww, Gemini en proxy instellingen
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Sla credentials veilig op zodat de server-side routes via Vercel
              kunnen werken.
            </p>
          </div>
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5 text-sm">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Admin token
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="Stel een admin token in .env"
                value={adminToken}
                onChange={(event) => {
                  const value = event.target.value;
                  setAdminToken(value);
                  window.localStorage.setItem("adminToken", value);
                }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Breww subdomein
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="jouwbrouwerij"
                value={form.breww_subdomain}
                onChange={handleChange("breww_subdomain")}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Breww API-key
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="b3... (versleuteld)"
                value={form.breww_api_key}
                onChange={handleChange("breww_api_key")}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                CORS proxy
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="https://corsproxy.io/..."
                value={form.cors_proxy}
                onChange={handleChange("cors_proxy")}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Gemini API-key
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="AIza... (alleen server-side)"
                value={form.gemini_api_key}
                onChange={handleChange("gemini_api_key")}
              />
            </div>
            <button
              className="w-full rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white"
              onClick={handleSave}
              disabled={status === "saving"}
            >
              {status === "saving" ? "Opslaan..." : "Opslaan en testen"}
            </button>
            {status === "saved" && (
              <p className="text-xs font-semibold text-[var(--accent)]">
                Instellingen opgeslagen.
              </p>
            )}
            {status === "error" && (
              <p className="text-xs font-semibold text-red-600">
                Opslaan mislukt. Controleer admin token of Supabase permissies.
              </p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[0_10px_30px_rgba(31,35,40,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              Groothandels
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Beheer templates en mappings
            </h2>
          </div>
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5 text-sm">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Nieuwe groothandel
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="Bijv. De Monnik"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="Slug (monnik)"
              />
              <input
                className="rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="Hoofdkleur (#)"
              />
            </div>
            <button className="w-full rounded-full border border-[var(--border)] bg-[#fdf8f2] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
              Groothandel toevoegen
            </button>
          </div>
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[#fbf8f4] px-5 py-6 text-sm text-[var(--muted)]">
            Nog geen groothandels toegevoegd.
          </div>
        </section>

        <section className="lg:col-span-2 flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[0_10px_30px_rgba(31,35,40,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                Template editor
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Upload master Excel en genereer mapping
              </h2>
            </div>
            <button className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
              Smart Mapping (Gemini)
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Excel template
              </p>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[var(--border)] bg-[#fbf8f4] px-4 py-5">
                <span className="text-[var(--muted)]">
                  Sleep bestand of klik om te uploaden.
                </span>
                <button className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold">
                  Upload
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Mapping preview
              </p>
              <div className="mt-3 space-y-2 rounded-xl border border-[var(--border)] bg-[#fefbf7] px-3 py-3 text-xs text-[var(--muted)]">
                <p>Artikelnaam → Blad1!B12</p>
                <p>EAN → Blad1!D9</p>
                <p>Alcoholpercentage → Blad1!C22</p>
                <p>Inhoud → Blad2!F14</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
