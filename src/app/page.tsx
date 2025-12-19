import Link from "next/link";
import { Building2, FileSpreadsheet, Package, Search } from "lucide-react";

export default function Home() {
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
              Geen product geselecteerd
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
                />
                <button className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white">
                  Zoeken
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Resultaat
              </label>
              <div className="mt-2 rounded-2xl border border-dashed border-[var(--border)] bg-[#fbf8f4] px-4 py-5 text-sm text-[var(--muted)]">
                Geen resultaten geladen.
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Verpakking (Stock Item)
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <label className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                  <span>24x33cl doos</span>
                  <span className="text-xs text-[var(--muted)]">SKU 11024</span>
                </label>
                <label className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                  <span>20L fust</span>
                  <span className="text-xs text-[var(--muted)]">SKU 22005</span>
                </label>
                <label className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                  <span>6x75cl doos</span>
                  <span className="text-xs text-[var(--muted)]">SKU 11077</span>
                </label>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Groothandel
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <label className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                  <span>De Monnik Dranken</span>
                  <span className="text-xs text-[var(--muted)]">MON</span>
                </label>
                <label className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                  <span>Mitra Nederland</span>
                  <span className="text-xs text-[var(--muted)]">MIT</span>
                </label>
                <label className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                  <span>Jumbo Horeca</span>
                  <span className="text-xs text-[var(--muted)]">JUM</span>
                </label>
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
            <button className="rounded-full bg-[var(--foreground)] px-5 py-2 text-sm font-semibold text-white">
              Genereer Excel
            </button>
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
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Herkomst
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="Nederland, Rotterdam"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Serveertip
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2"
                placeholder="Goed gekoeld, 6-8°C."
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
