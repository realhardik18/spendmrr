"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toPng } from "html-to-image";

type Startup = {
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  website: string | null;
  country: string | null;
  foundedDate: string | null;
  category: string | null;
  paymentProvider: string;
  targetAudience: string | null;
  revenue: {
    last30Days: number;
    mrr: number;
    total: number;
  };
  customers: number;
  activeSubscriptions: number;
  askingPrice: number | null;
  profitMarginLast30Days: number | null;
  growth30d: number | null;
  multiple: number | null;
  onSale: boolean;
  xHandle: string | null;
};

type StartupDetail = Startup & {
  xFollowerCount: number | null;
  isMerchantOfRecord: boolean;
  techStack: { slug: string; category: string }[];
  cofounders: { xHandle: string; xName: string | null }[];
};

type ShopItem = {
  id: string;
  name: string;
  price: number; // in cents
  emoji: string;
  description: string;
};

type CartItem = ShopItem & { qty: number };

const SHOP_ITEMS: ShopItem[] = [
  { id: "starbucks", name: "Starbucks Coffee", price: 700, emoji: "\u{2615}", description: "Grande Latte" },
  { id: "domain", name: "Domain Name", price: 1200, emoji: "\u{1F310}", description: ".com for a year" },
  { id: "spotify", name: "Spotify Premium", price: 1200, emoji: "\u{1F3B5}", description: "Monthly plan" },
  { id: "github-copilot", name: "GitHub Copilot", price: 1900, emoji: "\u{1F419}", description: "Monthly" },
  { id: "chatgpt-plus", name: "ChatGPT Plus", price: 2000, emoji: "\u{1F916}", description: "Monthly plan" },
  { id: "netflix", name: "Netflix Premium", price: 2300, emoji: "\u{1F3AC}", description: "Monthly plan" },
  { id: "claude-max", name: "Claude Max", price: 20000, emoji: "\u{2728}", description: "Monthly plan" },
  { id: "airpods", name: "AirPods Pro", price: 24900, emoji: "\u{1F3A7}", description: "2nd generation" },
  { id: "mac-mini", name: "Mac Mini", price: 59900, emoji: "\u{1F5A5}\u{FE0F}", description: "M4 with 16GB" },
  { id: "macbook-pro", name: "MacBook Pro", price: 249900, emoji: "\u{1F4BB}", description: "16\" M4 Max" },
];

function centsToUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function centsToUSDShort(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

// Animated counter hook
function useAnimatedNumber(target: number, duration = 400) {
  const [display, setDisplay] = useState(target);
  const animRef = useRef<number | null>(null);
  const startRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = display;
    startTimeRef.current = null;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const animate = (time: number) => {
      if (startTimeRef.current === null) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(
        startRef.current + (target - startRef.current) * eased
      );
      setDisplay(current);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [target, duration]);

  return display;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [allResults, setAllResults] = useState<Startup[]>([]);
  const [filtered, setFiltered] = useState<Startup[]>([]);
  const [selected, setSelected] = useState<StartupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState("revenue-desc");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchStartups = useCallback(
    async (sortBy: string, pageNum: number, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          sort: sortBy,
          limit: "50",
          page: String(pageNum),
        });
        const res = await fetch(`/api/search?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load startups");
        const newData = json.data || [];
        setAllResults((prev) => (append ? [...prev, ...newData] : newData));
        setHasMore(json.meta?.hasMore ?? false);
        setTotal(json.meta?.total ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchStartups(sort, 1);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(allResults);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      allResults.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          (s.xHandle && s.xHandle.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q))
      )
    );
  }, [query, allResults]);

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(1);
    setQuery("");
    fetchStartups(newSort, 1);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchStartups(sort, nextPage, true);
  };

  const selectStartup = async (slug: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?slug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load details");
      setSelected(json.data);
      setCart([]);
      setShowReceipt(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load details");
    } finally {
      setDetailLoading(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const budget = selected ? selected.revenue.mrr : 0;
  const remaining = budget - cartTotal;
  const animatedRemaining = useAnimatedNumber(remaining);

  const addToCart = (item: ShopItem) => {
    if (item.price > remaining) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (!existing) return prev;
      if (existing.qty <= 1) return prev.filter((c) => c.id !== id);
      return prev.map((c) => (c.id === id ? { ...c, qty: c.qty - 1 } : c));
    });
  };

  const clearCart = () => setCart([]);

  const downloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `spendmrr-${selected?.slug || "receipt"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Failed to generate image", e);
    }
  };

  const shareReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `spendmrr-receipt.png`, {
        type: "image/png",
      });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "SpendMRR Receipt",
          text: `How I'd spend ${selected?.name}'s MRR`,
        });
      } else {
        downloadReceipt();
      }
    } catch {
      downloadReceipt();
    }
  };

  const goBack = () => {
    setSelected(null);
    setCart([]);
    setShowReceipt(false);
  };

  // ─── Shopping view ───
  if (selected && !showReceipt) {
    return (
      <div className="min-h-screen bg-zinc-50 font-[family-name:var(--font-geist-sans)] dark:bg-zinc-950">
        {/* Sticky budget header */}
        <div className="sticky top-0 z-10 border-b border-zinc-200 bg-emerald-600 dark:border-zinc-800">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-emerald-100 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="text-center">
              <div className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl">
                {centsToUSDShort(animatedRemaining)}
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-200">
                left to spend
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selected.icon && (
                <img src={selected.icon} alt="" className="h-7 w-7 rounded-lg" />
              )}
              <div className="hidden text-right text-sm sm:block">
                <div className="font-medium text-white">{selected.name}</div>
                <div className="text-xs text-emerald-200">MRR {centsToUSDShort(budget)}</div>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-emerald-700">
            <div
              className="h-full bg-white/40 transition-all duration-300 ease-out"
              style={{ width: `${Math.min((cartTotal / budget) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {/* Item grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {SHOP_ITEMS.map((item) => {
              const inCart = cart.find((c) => c.id === item.id);
              const canAfford = item.price <= remaining;
              return (
                <div
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {/* Emoji area */}
                  <div className="flex h-32 items-center justify-center bg-zinc-50 text-5xl dark:bg-zinc-800/50 sm:h-36 sm:text-6xl">
                    {item.emoji}
                  </div>
                  {/* Info */}
                  <div className="flex flex-1 flex-col p-3 text-center">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </div>
                    <div className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-emerald-600">
                      {centsToUSDShort(item.price)}
                    </div>
                    <div className="mb-3 text-[11px] text-zinc-400">{item.description}</div>
                    {/* Buy/Sell controls */}
                    <div className="mt-auto flex items-center gap-1">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        disabled={!inCart}
                        className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                          inCart
                            ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            : "bg-zinc-50 text-zinc-300 cursor-not-allowed dark:bg-zinc-800/50 dark:text-zinc-600"
                        }`}
                      >
                        Sell
                      </button>
                      <div className="flex w-12 items-center justify-center rounded-lg border border-zinc-200 py-2 font-[family-name:var(--font-space-grotesk)] text-sm font-bold tabular-nums text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {inCart?.qty ?? 0}
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!canAfford}
                        className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                          canAfford
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-zinc-100 text-zinc-300 cursor-not-allowed dark:bg-zinc-800/50 dark:text-zinc-600"
                        }`}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom bar */}
          {cart.length > 0 && (
            <div className="sticky bottom-4 mt-6 flex gap-2">
              <button
                onClick={clearCart}
                className="rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Reset
              </button>
              <button
                onClick={() => setShowReceipt(true)}
                className="flex-1 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Get Receipt ({cart.reduce((s, c) => s + c.qty, 0)} items)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Receipt view ───
  if (selected && showReceipt) {
    return (
      <div className="min-h-screen bg-zinc-100 font-[family-name:var(--font-geist-sans)] dark:bg-zinc-950">
        <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
          <button
            onClick={() => setShowReceipt(false)}
            className="mb-6 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to shopping
          </button>

          {/* Receipt */}
          <div
            ref={receiptRef}
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              background: "#fff",
            }}
            className="overflow-hidden rounded-2xl shadow-xl"
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #059669, #10b981)",
                padding: "28px 24px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: "28px",
                  color: "white",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                }}
              >
                SpendMRR
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.7)",
                  marginTop: "4px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                The art of spending other people&apos;s revenue
              </div>
            </div>

            {/* Startup */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px dashed #e4e4e7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {selected.icon && (
                <img
                  src={selected.icon}
                  alt=""
                  style={{ width: 28, height: 28, borderRadius: 6 }}
                />
              )}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#18181b" }}>
                  {selected.name}
                </div>
                <div style={{ fontSize: 12, color: "#a1a1aa" }}>
                  Monthly Revenue: {centsToUSDShort(budget)}
                </div>
              </div>
            </div>

            {/* Items */}
            <div style={{ padding: "16px 24px" }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px dotted #e4e4e7",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{item.emoji}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#18181b" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#a1a1aa" }}>
                        {centsToUSDShort(item.price)} each
                        {item.qty > 1 ? ` \u00D7 ${item.qty}` : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#18181b" }}>
                    {centsToUSD(item.price * item.qty)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px dashed #e4e4e7",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "#71717a",
                  marginBottom: 6,
                }}
              >
                <span>Total spent</span>
                <span style={{ fontWeight: 600, color: "#18181b" }}>{centsToUSD(cartTotal)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "#71717a",
                  marginBottom: 12,
                }}
              >
                <span>MRR remaining</span>
                <span style={{ fontWeight: 600, color: "#059669" }}>{centsToUSD(remaining)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "2px solid #18181b",
                  paddingTop: 12,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: "#18181b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Damage
                </span>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#18181b" }}>
                  {centsToUSD(cartTotal)}
                </span>
              </div>
              {/* Bar */}
              <div
                style={{
                  marginTop: 12,
                  height: 6,
                  borderRadius: 3,
                  background: "#e4e4e7",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    background: "#059669",
                    width: `${Math.min((cartTotal / budget) * 100, 100)}%`,
                  }}
                />
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontSize: 11,
                  color: "#a1a1aa",
                  marginTop: 4,
                }}
              >
                {((cartTotal / budget) * 100).toFixed(1)}% of MRR obliterated
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "16px 24px 20px",
                borderTop: "1px dashed #e4e4e7",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, color: "#a1a1aa" }}>
                spendmrr.vercel.app
              </div>
              <div style={{ fontSize: 10, color: "#d4d4d8", marginTop: 4 }}>
                No founders were harmed in the making of this receipt.
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={downloadReceipt}
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Download PNG
            </button>
            <button
              onClick={shareReceipt}
              className="flex-1 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-zinc-800 transition dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Startup selection view ───
  return (
    <div className="min-h-screen bg-zinc-50 font-[family-name:var(--font-geist-sans)] dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl tracking-tight text-zinc-900 dark:text-zinc-50">
            SpendMRR
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Pick a startup. Blow their MRR. Share the receipt.
            {total > 0 && (
              <span className="ml-1 text-zinc-400">
                ({formatNumber(total)} startups)
              </span>
            )}
          </p>
        </div>

        {/* Search & Sort */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search startups..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="revenue-desc">Revenue: High to Low</option>
            <option value="revenue-asc">Revenue: Low to High</option>
            <option value="growth-desc">Growth: High to Low</option>
            <option value="growth-asc">Growth: Low to High</option>
            <option value="listed-desc">Recently Listed</option>
            <option value="best-deal">Best Deal</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {detailLoading && (
          <div className="py-8 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((s) => (
              <button
                key={s.slug}
                onClick={() => selectStartup(s.slug)}
                className="flex w-full items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                {s.icon ? (
                  <img src={s.icon} alt={s.name} className="h-10 w-10 rounded-lg" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-sm font-medium text-zinc-500 dark:bg-zinc-800">
                    {s.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {s.name}
                    </span>
                    {s.category && (
                      <span className="text-xs text-zinc-400">{s.category}</span>
                    )}
                  </div>
                  {s.description && (
                    <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                      {s.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {centsToUSDShort(s.revenue.mrr)}/mo
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="py-12 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          </div>
        )}

        {!loading && hasMore && !query.trim() && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMore}
              className="rounded-xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
            >
              Load More
            </button>
          </div>
        )}

        {!loading && query.trim() && filtered.length === 0 && allResults.length > 0 && (
          <p className="py-12 text-center text-zinc-400">
            No matches for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
