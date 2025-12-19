"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import * as XLSX from "xlsx";

type SettingsForm = {
  id?: string;
  breww_subdomain: string;
  breww_api_key: string;
  cors_proxy: string;
  gemini_api_key: string;
};

type MappingResult = Record<string, string>;
type Wholesaler = {
  id: string;
  name: string;
  slug: string;
  brand_color?: string | null;
};
type Template = {
  id: string;
  name: string;
  wholesaler_id: string;
  mapping_json: MappingResult;
  created_at: string;
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
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [mapping, setMapping] = useState<MappingResult>({});
  const [mappingStatus, setMappingStatus] = useState<
    "idle" | "reading" | "mapping" | "saving" | "error" | "done"
  >("idle");
  const [mappingError, setMappingError] = useState("");
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [selectedWholesalerId, setSelectedWholesalerId] = useState("");
  const [newWholesaler, setNewWholesaler] = useState({
    name: "",
    slug: "",
    brand_color: "",
  });
  const [wholesalerStatus, setWholesalerStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [wholesalerError, setWholesalerError] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateStatus, setTemplateStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [templateError, setTemplateError] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState("");
  const [editingMapping, setEditingMapping] = useState("");

  const canUseAdmin = useMemo(() => Boolean(adminToken), [adminToken]);

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
    if (storedToken) {
      loadWholesalers(storedToken);
      loadTemplates(storedToken);
    }
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

  const loadWholesalers = async (token: string) => {
    setWholesalerStatus("loading");
    setWholesalerError("");
    try {
      const response = await fetch("/api/wholesalers", {
        headers: { "x-admin-token": token },
      });
      if (!response.ok) {
        throw new Error("Groothandels ophalen mislukt.");
      }
      const data = await response.json();
      setWholesalers(Array.isArray(data) ? data : []);
      setWholesalerStatus("idle");
    } catch (error) {
      setWholesalerStatus("error");
      setWholesalerError(
        error instanceof Error ? error.message : "Onbekende fout."
      );
    }
  };

  const loadTemplates = async (token: string, wholesalerId?: string) => {
    setTemplateStatus("loading");
    setTemplateError("");
    const params = wholesalerId ? `?wholesaler_id=${wholesalerId}` : "";
    try {
      const response = await fetch(`/api/templates${params}`, {
        headers: { "x-admin-token": token },
      });
      if (!response.ok) {
        throw new Error("Templates ophalen mislukt.");
      }
      const data = await response.json();
      setTemplates(Array.isArray(data) ? data : []);
      setTemplateStatus("idle");
    } catch (error) {
      setTemplateStatus("error");
      setTemplateError(
        error instanceof Error ? error.message : "Onbekende fout."
      );
    }
  };

  const handleTemplateDelete = async (id: string) => {
    if (!canUseAdmin) {
      setTemplateError("Admin token ontbreekt.");
      setTemplateStatus("error");
      return;
    }
    setTemplateStatus("loading");
    const response = await fetch(`/api/templates?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": adminToken },
    });
    if (!response.ok) {
      setTemplateStatus("error");
      setTemplateError("Template verwijderen mislukt.");
      return;
    }
    await loadTemplates(adminToken, selectedWholesalerId);
  };

  const handleTemplateUpdate = async () => {
    if (!editingTemplateId) return;
    if (!canUseAdmin) {
      setTemplateError("Admin token ontbreekt.");
      setTemplateStatus("error");
      return;
    }
    const parsed = safeJsonParse(editingMapping);
    if (!parsed) {
      setTemplateError("Mapping JSON is ongeldig.");
      setTemplateStatus("error");
      return;
    }
    setTemplateStatus("loading");
    const response = await fetch("/api/templates", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({ id: editingTemplateId, mapping_json: parsed }),
    });
    if (!response.ok) {
      setTemplateStatus("error");
      setTemplateError("Mapping opslaan mislukt.");
      return;
    }
    setEditingTemplateId("");
    setEditingMapping("");
    await loadTemplates(adminToken, selectedWholesalerId);
  };

  const handleWholesalerCreate = async () => {
    if (!canUseAdmin) {
      setWholesalerError("Admin token ontbreekt.");
      setWholesalerStatus("error");
      return;
    }
    if (!newWholesaler.name.trim() || !newWholesaler.slug.trim()) {
      setWholesalerError("Naam en slug zijn verplicht.");
      setWholesalerStatus("error");
      return;
    }

    setWholesalerStatus("loading");
    setWholesalerError("");
    const response = await fetch("/api/wholesalers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify(newWholesaler),
    });
    if (!response.ok) {
      setWholesalerStatus("error");
      setWholesalerError("Groothandel opslaan mislukt.");
      return;
    }
    setNewWholesaler({ name: "", slug: "", brand_color: "" });
    await loadWholesalers(adminToken);
    setWholesalerStatus("idle");
  };

  const readWorkbookText = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const output: string[] = [];
    workbook.SheetNames.forEach((name) => {
      const sheet = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      output.push(`Sheet: ${name}`);
      rows.slice(0, 200).forEach((row: unknown) => {
        const line = Array.isArray(row)
          ? row.map((cell) => `${cell ?? ""}`).join(" | ")
          : "";
        output.push(line);
      });
    });
    return output.join("\n");
  };

  const handleMapping = async () => {
    if (!templateFile) {
      setMappingError("Upload eerst een template.");
      setMappingStatus("error");
      return;
    }
    if (!adminToken) {
      setMappingError("Admin token ontbreekt.");
      setMappingStatus("error");
      return;
    }

    setMappingStatus("reading");
    setMappingError("");
    try {
      const workbookText = await readWorkbookText(templateFile);
      setMappingStatus("mapping");
      const response = await fetch("/api/gemini/mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workbookText }),
      });
      if (!response.ok) {
        throw new Error("Gemini mapping mislukt.");
      }
      const data = await response.json();
      const rawText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        data?.text ??
        "";
      const parsed = parseMapping(rawText);
      setMapping(parsed.mapping);
      if (parsed.error) {
        setMappingError(parsed.error);
        setMappingStatus("error");
        return;
      }
      setMappingStatus("done");
    } catch (error) {
      setMappingStatus("error");
      setMappingError(
        error instanceof Error ? error.message : "Mapping mislukt."
      );
    }
  };

  const handleTemplateSave = async () => {
    if (!templateFile) {
      setMappingError("Upload eerst een template.");
      setMappingStatus("error");
      return;
    }
    if (!adminToken) {
      setMappingError("Admin token ontbreekt.");
      setMappingStatus("error");
      return;
    }
    if (!templateName.trim()) {
      setMappingError("Geef een template naam op.");
      setMappingStatus("error");
      return;
    }
    if (!selectedWholesalerId) {
      setMappingError("Selecteer eerst een groothandel.");
      setMappingStatus("error");
      return;
    }

    setMappingStatus("saving");
    setMappingError("");
    try {
      const base64 = await fileToBase64(templateFile);
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          wholesaler_id: selectedWholesalerId,
          name: templateName,
          workbook_base64: base64,
          mapping_json: mapping,
        }),
      });
      if (!response.ok) {
        throw new Error("Opslaan template mislukt.");
      }
      await loadTemplates(adminToken, selectedWholesalerId);
      setMappingStatus("done");
    } catch (error) {
      setMappingStatus("error");
      setMappingError(
        error instanceof Error ? error.message : "Opslaan mislukt."
      );
    }
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Bestand lezen mislukt."));
          return;
        }
        const base64 = result.split(",")[1] ?? "";
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Bestand lezen mislukt."));
      reader.readAsDataURL(file);
    });

  const parseMapping = (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) {
      return { mapping: {}, error: "Gemini gaf geen output." };
    }
    const direct = safeJsonParse(trimmed);
    if (direct) return { mapping: normalizeMapping(direct), error: "" };

    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      const embedded = safeJsonParse(match[0]);
      if (embedded) return { mapping: normalizeMapping(embedded), error: "" };
    }

    return {
      mapping: {},
      error: "Kon geen JSON mapping vinden. Pas eventueel de prompt aan.",
    };
  };

  const safeJsonParse = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") return parsed;
      return null;
    } catch {
      return null;
    }
  };

  const normalizeMapping = (input: MappingResult) => {
    const normalized: MappingResult = {};
    Object.entries(input).forEach(([key, value]) => {
      const cleanedKey = key.trim().toLowerCase();
      const mappedKey =
        cleanedKey === "alcoholpercentage" || cleanedKey === "alcohol"
          ? "abv"
          : cleanedKey === "artikelnaam" || cleanedKey === "productnaam"
          ? "artikelnaam"
          : cleanedKey === "inhoud"
          ? "volume"
          : cleanedKey === "merk"
          ? "merknaam"
          : cleanedKey;
      if (typeof value === "string" && value.includes("!")) {
        normalized[mappedKey] = value.trim();
      }
    });
    return normalized;
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
                  if (value) {
                    loadWholesalers(value);
                    loadTemplates(value, selectedWholesalerId);
                  }
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
                value={newWholesaler.name}
                onChange={(event) =>
                  setNewWholesaler((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="Slug (monnik)"
                value={newWholesaler.slug}
                onChange={(event) =>
                  setNewWholesaler((prev) => ({
                    ...prev,
                    slug: event.target.value,
                  }))
                }
              />
              <input
                className="rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="Hoofdkleur (#)"
                value={newWholesaler.brand_color}
                onChange={(event) =>
                  setNewWholesaler((prev) => ({
                    ...prev,
                    brand_color: event.target.value,
                  }))
                }
              />
            </div>
            <button
              className="w-full rounded-full border border-[var(--border)] bg-[#fdf8f2] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
              onClick={handleWholesalerCreate}
            >
              {wholesalerStatus === "loading"
                ? "Opslaan..."
                : "Groothandel toevoegen"}
            </button>
            {wholesalerStatus === "error" && (
              <p className="text-xs font-semibold text-red-600">
                {wholesalerError}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[#fbf8f4] px-5 py-6 text-sm text-[var(--muted)]">
            {wholesalers.length === 0
              ? "Nog geen groothandels toegevoegd."
              : "Selecteer een groothandel in de template editor."}
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
            <button
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              onClick={handleMapping}
            >
              Smart Mapping (Gemini)
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Excel template
              </p>
              <div className="mt-3 flex flex-col gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[#fbf8f4] px-4 py-4">
                <select
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={selectedWholesalerId}
                  onChange={(event) =>
                    setSelectedWholesalerId(event.target.value)
                  }
                >
                  <option value="">Kies groothandel</option>
                  {wholesalers.map((wholesaler) => (
                    <option key={wholesaler.id} value={wholesaler.id}>
                      {wholesaler.name}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold"
                  onClick={() => loadTemplates(adminToken, selectedWholesalerId)}
                >
                  Templates laden
                </button>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setTemplateFile(file);
                    setMapping({});
                  }}
                />
                <input
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  placeholder="Template naam (bijv. De Monnik standaard)"
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                />
                <button
                  className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold"
                  onClick={handleTemplateSave}
                >
                  Template opslaan
                </button>
                {mappingStatus === "error" && (
                  <p className="text-xs font-semibold text-red-600">
                    {mappingError}
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Mapping preview
              </p>
              <div className="mt-3 space-y-2 rounded-xl border border-[var(--border)] bg-[#fefbf7] px-3 py-3 text-xs text-[var(--muted)]">
                {Object.keys(mapping).length === 0 && (
                  <p>Nog geen mapping gedetecteerd.</p>
                )}
                {Object.entries(mapping).map(([key, value]) => (
                  <p key={key}>
                    {key} → {value}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Templates
              </p>
              {templateStatus === "loading" && (
                <span className="text-xs text-[var(--muted)]">Laden...</span>
              )}
            </div>
            {templateStatus === "error" && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {templateError}
              </p>
            )}
            <div className="mt-3 space-y-3">
              {templates.length === 0 && (
                <p className="text-xs text-[var(--muted)]">
                  Nog geen templates geladen.
                </p>
              )}
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-xl border border-[var(--border)] bg-[#fdf9f4] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{template.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {template.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold"
                        onClick={() => {
                          setEditingTemplateId(template.id);
                          setEditingMapping(
                            JSON.stringify(template.mapping_json, null, 2)
                          );
                        }}
                      >
                        Bewerken
                      </button>
                      <button
                        className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600"
                        onClick={() => handleTemplateDelete(template.id)}
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {editingTemplateId && (
              <div className="mt-4 space-y-3">
                <textarea
                  className="min-h-[160px] w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs"
                  value={editingMapping}
                  onChange={(event) => setEditingMapping(event.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-white"
                    onClick={handleTemplateUpdate}
                  >
                    Mapping opslaan
                  </button>
                  <button
                    className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold"
                    onClick={() => {
                      setEditingTemplateId("");
                      setEditingMapping("");
                    }}
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
