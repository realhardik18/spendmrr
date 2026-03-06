"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Warp } from "@paper-design/shaders-react";
import { MagnifyingGlass, X, CaretRight } from "@phosphor-icons/react";

type Startup = {
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  category: string | null;
  revenue: { last30Days: number; mrr: number; total: number };
  growth30d: number | null;
  xHandle: string | null;
};

function centsToUSDShort(cents: number): string {
  const val = cents / 100;
  if (val >= 1000) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: val >= 10000 ? 0 : 1, notation: "compact" }).format(val);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function StartupCard({ s, onClick }: { s: Startup; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-72 shrink-0 items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/90 backdrop-blur-sm p-4 text-left transition hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-50/50 dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:border-emerald-800 sm:w-80"
    >
      {s.icon ? (
        <img src={s.icon} alt="" className="h-11 w-11 rounded-xl" />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-sm font-bold text-zinc-400 dark:bg-zinc-800">
          {s.name.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.name}</div>
        {s.category && <div className="truncate text-xs text-zinc-400">{s.category}</div>}
      </div>
      <div className="shrink-0 text-right">
        <div className="font-[family-name:var(--font-space-grotesk)] text-base font-bold text-emerald-600">{centsToUSDShort(s.revenue.mrr)}</div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">/mo</div>
      </div>
    </button>
  );
}

export default function Home() {
  const router = useRouter();
  const [allResults, setAllResults] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Startup[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchStartups = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch multiple pages to get more startups
      const pages = await Promise.all(
        [1, 2, 3, 4, 5].map((page) =>
          fetch(`/api/search?sort=revenue-desc&limit=50&page=${page}`).then((r) => r.json())
        )
      );
      const all = pages.flatMap((p) => p.data || []);
      // Deduplicate by slug
      const seen = new Set<string>();
      const unique = all.filter((s: Startup) => {
        if (seen.has(s.slug)) return false;
        seen.add(s.slug);
        return true;
      });
      setAllResults(unique);
      setTotal(pages[0]?.meta?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStartups(); }, []);

  useEffect(() => {
    if (!query.trim()) { setFiltered([]); return; }
    const q = query.toLowerCase();
    setFiltered(allResults.filter((s) =>
      s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q) ||
      (s.xHandle && s.xHandle.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q))
    ));
  }, [query, allResults]);

  const goToStartup = (slug: string) => router.push(`/${slug}`);
  const isSearching = query.trim().length > 0;
  const searchResults = filtered.slice(0, 4);

  // Split into 3 rows evenly
  const perRow = Math.ceil(allResults.length / 3);
  const rows = Array.from({ length: 3 }, (_, i) => {
    const slice = allResults.slice(i * perRow, (i + 1) * perRow);
    return slice.length > 2 ? slice : allResults.slice(0, perRow).reverse();
  });

  return (
    <div className="relative min-h-screen bg-zinc-50 font-[family-name:var(--font-geist-sans)] dark:bg-zinc-950">
      {/* Hero with Warp shader */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900">
        {/* Shader background */}
        <div className="absolute inset-0">
          <Warp
            style={{ width: "100%", height: "100%" }}
            colors={["#aeff00", "#55a04b", "#091316"]}
            proportion={0.52}
            softness={0}
            distortion={0}
            swirl={0.2}
            swirlIterations={4}
            shape="stripes"
            shapeScale={1}
            speed={12}
            scale={1.1}
            rotation={50}
          />
        </div>
        {/* Darker overlay for text readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content over shader */}
        <div className="relative z-10 pt-16 pb-6 sm:pt-24 sm:pb-8">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h1 className="font-[family-name:var(--font-instrument-serif)] text-5xl tracking-tight text-white sm:text-7xl drop-shadow-lg">
              SpendMRR
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg text-white/90 drop-shadow">
              Pick any startup. Spend their entire monthly revenue on stuff. Share the receipt.
            </p>
            {total > 0 && (
              <p className="mt-4 text-sm text-white/70">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />
                {formatNumber(total)} startups with verified revenue
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search bar — outside hero so it's never clipped */}
      <div className="relative z-50 -mt-7 mb-4">
        <div ref={searchRef} className="relative mx-auto max-w-md px-4">
          <MagnifyingGlass className="pointer-events-none absolute left-8 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" weight="bold" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a startup..."
            className="w-full rounded-2xl border border-zinc-200 bg-white py-4 pl-12 pr-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          {isSearching && (
            <button onClick={() => setQuery("")} className="absolute right-7 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:text-zinc-600">
              <X className="h-4 w-4" weight="bold" />
            </button>
          )}

          {/* Search dropdown */}
          {isSearching && (
            <div className="absolute left-4 right-4 top-full mt-2 rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden dark:border-zinc-700 dark:bg-zinc-900">
              {searchResults.length > 0 ? (
                searchResults.map((s, i) => (
                  <button
                    key={s.slug}
                    onClick={() => goToStartup(s.slug)}
                    className={`group flex w-full items-center gap-4 p-4 text-left transition hover:bg-emerald-50 dark:hover:bg-emerald-950 ${i < searchResults.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""}`}
                  >
                    {s.icon ? (
                      <img src={s.icon} alt="" className="h-10 w-10 rounded-xl" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-400 dark:bg-zinc-800">{s.name.charAt(0)}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{s.name}</div>
                      {s.category && <span className="text-xs text-zinc-400">{s.category}</span>}
                    </div>
                    <div className="text-right">
                      <div className="font-[family-name:var(--font-space-grotesk)] text-base font-bold text-emerald-600">{centsToUSDShort(s.revenue.mrr)}</div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">/mo</div>
                    </div>
                    <CaretRight className="h-4 w-4 shrink-0 text-zinc-300 transition group-hover:text-emerald-500" weight="bold" />
                  </button>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-zinc-400">No startups matching &ldquo;{query}&rdquo;</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-screen blur overlay when searching (behind search, above carousels) */}
      {isSearching && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 transition-opacity" onClick={() => setQuery("")} />
      )}

      {/* 5 rows of startup carousels */}
      {!loading && allResults.length > 0 && (
        <div className="relative space-y-3 overflow-hidden bg-white pb-10 dark:bg-zinc-900">
          {/* Left fade */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-r from-white to-transparent dark:from-zinc-900 sm:w-40" />
          {/* Right fade */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-l from-white to-transparent dark:from-zinc-900 sm:w-40" />

          {rows.map((row, rowIdx) => {
            const doubled = [...row, ...row];
            return (
              <div key={rowIdx} className="marquee-row">
                <div
                  className={rowIdx === 1 ? "animate-marquee-reverse" : "animate-marquee"}
                  style={{
                    display: "flex",
                    gap: 12,
                    width: "max-content",
                    ["--duration" as string]: rowIdx === 1 ? "300s" : "250s",
                  }}
                >
                  {doubled.map((s, i) => (
                    <StartupCard key={`${s.slug}-${i}`} s={s} onClick={() => goToStartup(s.slug)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="bg-white py-24 text-center dark:bg-zinc-900">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600" />
          <p className="mt-3 text-sm text-zinc-400">Loading startups...</p>
        </div>
      )}

      {error && (
        <div className="bg-white px-4 py-12 dark:bg-zinc-900">
          <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
        <div>
          Revenue data verified by{" "}
          <a href="https://trustmrr.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600">TrustMRR</a>
        </div>
        <div className="mt-1">
          made with ❤️ by{" "}
          <a href="https://hrdk.life" target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-300">hrdk.life</a>
        </div>
      </div>
    </div>
  );
}
