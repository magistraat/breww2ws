"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, FileSpreadsheet, Package, Search } from "lucide-react";

type BrewwProduct = {
  id: string;
  name: string;
  sku?: string;
  abv?: number;
};

type BrewwStockItem = {
  id: string;
  name: string;
  sku?: string;
  ean?: string;
  volume?: string;
};

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
};

type FieldDefinition = {
  id: string;
  key: string;
  field_values?: { value: string | null }[];
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<BrewwProduct[]>([]);
  const [stockItems, setStockItems] = useState<BrewwStockItem[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<BrewwProduct | null>(null);
  const [selectedStock, setSelectedStock] =
    useState<BrewwStockItem | null>(null);
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedWholesaler, setSelectedWholesaler] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [enrichment, setEnrichment] = useState({
    description: "",
    origin: "",
    serving: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [exportStatus, setExportStatus] = useState<
    "idle" | "exporting" | "error"
  >("idle");
  const [exportError, setExportError] = useState("");
  const [globalFields, setGlobalFields] = useState<FieldDefinition[]>([]);
  const [wholesalerFields, setWholesalerFields] = useState<FieldDefinition[]>(
    []
  );

  const canGenerate = useMemo(
    () => Boolean(selectedProduct && selectedStock && selectedTemplate),
    [selectedProduct, selectedStock, selectedTemplate]
  );

  useEffect(() => {
    const loadWholesalers = async () => {
      const response = await fetch("/api/catalog/wholesalers");
      if (!response.ok) return;
      const data = await response.json();
      setWholesalers(Array.isArray(data) ? data : []);
    };
    loadWholesalers();
  }, []);

  useEffect(() => {
    const loadTemplates = async () => {
      if (!selectedWholesaler) {
        setTemplates([]);
        setSelectedTemplate("");
        return;
      }
      const response = await fetch(
        `/api/catalog/templates?wholesaler_id=${selectedWholesaler}`
      );
      if (!response.ok) return;
      const data = await response.json();
      setTemplates(Array.isArray(data) ? data : []);
    };
    loadTemplates();
  }, [selectedWholesaler]);

  useEffect(() => {
    const loadGlobalFields = async () => {
      const response = await fetch("/api/fields/values?scope=global", {
        headers: {
          "x-admin-token": window.localStorage.getItem("adminToken") ?? "",
        },
      });
      if (!response.ok) return;
      const data = await response.json();
      setGlobalFields(Array.isArray(data) ? data : []);
    };
    loadGlobalFields();
  }, []);

  useEffect(() => {
    const loadWholesalerFields = async () => {
      if (!selectedWholesaler) {
        setWholesalerFields([]);
        return;
      }
      const response = await fetch(
        `/api/fields/values?scope=wholesaler&wholesaler_id=${selectedWholesaler}`,
        {
          headers: {
            "x-admin-token": window.localStorage.getItem("adminToken") ?? "",
          },
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      setWholesalerFields(Array.isArray(data) ? data : []);
    };
    loadWholesalerFields();
  }, [selectedWholesaler]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    try {
      const response = await fetch("/api/breww/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text ? `Breww zoekopdracht mislukt: ${text}` : "Breww zoekopdracht mislukt."
        );
      }
      const data = await response.json();
      const items = Array.isArray(data?.data) ? data.data : data;
      setProducts(items ?? []);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Onbekende fout."
      );
    }
  };

  const loadStockItems = async (product: BrewwProduct) => {
    setSelectedProduct(product);
    setSelectedStock(null);
    setStockItems([]);
    setStatus("loading");
    setErrorMessage("");
    try {
      const response = await fetch("/api/breww/stock-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text ? `Stock items ophalen mislukt: ${text}` : "Stock items ophalen mislukt."
        );
      }
      const data = await response.json();
      const items = Array.isArray(data?.data) ? data.data : data;
      setStockItems(items ?? []);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Onbekende fout."
      );
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !selectedProduct || !selectedStock) return;
    setExportStatus("exporting");
    setExportError("");

    const fieldValues = [...globalFields, ...wholesalerFields].reduce(
      (acc, field) => {
        acc[field.key] = field.field_values?.[0]?.value ?? "";
        return acc;
      },
      {} as Record<string, string>
    );

    const fields = {
      artikelnaam: selectedProduct.name,
      sku: selectedStock.sku ?? "",
      ean: selectedStock.ean ?? "",
      abv: selectedProduct.abv ?? "",
      volume: selectedStock.volume ?? "",
      marketing_omschrijving: enrichment.description,
      herkomst: enrichment.origin,
      serveertip: enrichment.serving,
      ...fieldValues,
    };

    try {
      const response = await fetch("/api/excel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate,
          fields,
        }),
      });
      if (!response.ok) {
        throw new Error("Excel generatie mislukt.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+?)"/);
      const filename = match?.[1] ?? "export.xlsx";
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportStatus("idle");
    } catch (error) {
      setExportStatus("error");
      setExportError(
        error instanceof Error ? error.message : "Export mislukt."
      );
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 text-[15px] text-foreground md:px-12">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-8 py-8 shadow-[0_16px_50px_rgba(31,35,40,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              Breww to Wholesale
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Van Breww naar groothandel in een gecontroleerde flow.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Zoek het product, kies de verpakking, verrijk de template en
              genereer meteen het juiste Excel-bestand met behoud van stijl.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[#fdf9f4] px-5 py-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold">Actieve sessie</p>
              <Link
                className="text-xs font-semibold text-[var(--accent)]"
                href="/admin"
              >
                Admin
              </Link>
            </div>
            <p className="mt-1 text-[var(--muted)]">
              {selectedProduct ? selectedProduct.name : "Geen product geselecteerd"}
            </p>
            <p className="mt-3 text-xs font-semibold text-[var(--accent)]">
              Stap 1 van 4
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2">
            <Search className="h-3.5 w-3.5" />
            1. Product
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2">
            <Package className="h-3.5 w-3.5" />
            2. Verpakking
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2">
            <Building2 className="h-3.5 w-3.5" />
            3. Groothandel
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            4. Verrijking
          </span>
        </div>
      </header>

      <main className="mx-auto mt-10 grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[0_10px_30px_rgba(31,35,40,0.06)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                Productselectie
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Zoek het bier in Breww
              </h2>
            </div>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              Live via server
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Product zoeken
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Zoek op naam, SKU of stijl..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <button
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
                  onClick={handleSearch}
                >
                  {status === "loading" ? "Zoeken..." : "Zoeken"}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Resultaat
              </label>
              <div className="mt-2 rounded-2xl border border-dashed border-[var(--border)] bg-[#fbf8f4] px-4 py-5 text-sm text-[var(--muted)]">
                {status === "error" && errorMessage}
                {status !== "error" && products.length === 0
                  ? "Geen resultaten geladen."
                  : null}
                {products.length > 0 && (
                  <div className="space-y-2">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => loadStockItems(product)}
                        className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-left text-sm"
                      >
                        <span className="font-semibold">{product.name}</span>
                        <span className="text-xs text-[var(--muted)]">
                          {product.sku ?? product.id}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Verpakking (Stock Item)
              </p>
              <div className="mt-3 space-y-2 text-sm">
                {stockItems.length === 0 && (
                  <p className="text-xs text-[var(--muted)]">
                    Selecteer eerst een product.
                  </p>
                )}
                {stockItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedStock(item)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${
                      selectedStock?.id === item.id
                        ? "border-[var(--accent)] bg-[#fef3e7]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-[var(--muted)]">
                      {item.sku ?? item.ean ?? item.id}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Groothandel
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <select
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={selectedWholesaler}
                  onChange={(event) => setSelectedWholesaler(event.target.value)}
                >
                  <option value="">Selecteer groothandel</option>
                  {wholesalers.map((wholesaler) => (
                    <option key={wholesaler.id} value={wholesaler.id}>
                      {wholesaler.name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={selectedTemplate}
                  onChange={(event) => setSelectedTemplate(event.target.value)}
                  disabled={!selectedWholesaler}
                >
                  <option value="">Selecteer template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[#fefbf7] px-5 py-4">
            <div>
              <p className="text-sm font-semibold">
                Data verrijkt? Klaar voor generatie.
              </p>
              <p className="text-xs text-[var(--muted)]">
                Template wordt gevuld met SKU, EAN, ABV en volumes.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                className="rounded-full bg-[var(--foreground)] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canGenerate || exportStatus === "exporting"}
                onClick={handleGenerate}
              >
                {exportStatus === "exporting"
                  ? "Bezig met exporteren..."
                  : "Genereer Excel"}
              </button>
              {exportStatus === "error" && (
                <p className="text-xs text-red-600">{exportError}</p>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[0_10px_30px_rgba(31,35,40,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              Dataverrijking
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Vul de ontbrekende velden aan
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Velden die niet beschikbaar zijn in Breww kun je hier handmatig
              invullen per tabblad.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            <button className="rounded-full border border-[var(--border)] bg-white px-4 py-2">
              Algemeen
            </button>
            <button className="rounded-full border border-[var(--border)] bg-white px-4 py-2">
              Marketing
            </button>
            <button className="rounded-full border border-[var(--border)] bg-white px-4 py-2">
              Logistiek
            </button>
            <button className="rounded-full border border-[var(--border)] bg-white px-4 py-2">
              Allergenen
            </button>
          </div>
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5 text-sm">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Korte omschrijving
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="Bier met citrus, tropisch fruit en zachte bitterheid."
                value={enrichment.description}
                onChange={(event) =>
                  setEnrichment((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Herkomst
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="Nederland, Rotterdam"
                value={enrichment.origin}
                onChange={(event) =>
                  setEnrichment((prev) => ({
                    ...prev,
                    origin: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Serveertip
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="Goed gekoeld, 6-8°C."
                value={enrichment.serving}
                onChange={(event) =>
                  setEnrichment((prev) => ({
                    ...prev,
                    serving: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[#fbf6f0] px-5 py-4 text-xs text-[var(--muted)]">
            <p className="font-semibold text-[var(--foreground)]">
              Klaar voor export
            </p>
            <p className="mt-1">
              De Excel template blijft intact en wordt gevuld in de juiste
              cellen.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
