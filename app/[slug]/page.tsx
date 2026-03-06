"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";

type StartupDetail = {
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
  revenue: { last30Days: number; mrr: number; total: number };
  customers: number;
  activeSubscriptions: number;
  askingPrice: number | null;
  profitMarginLast30Days: number | null;
  growth30d: number | null;
  multiple: number | null;
  onSale: boolean;
  xHandle: string | null;
  xFollowerCount: number | null;
  isMerchantOfRecord: boolean;
  techStack: { slug: string; category: string }[];
  cofounders: { xHandle: string; xName: string | null }[];
};

type ShopItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  bg: string;
};

type CartItem = ShopItem & { qty: number };

const SHOP_ITEMS: ShopItem[] = [
  // Row 1 — cheap
  { id: "starbucks", name: "Starbucks Coffee", price: 7, image: "/images/starbucks.jpeg", bg: "#f0fdf4" },
  { id: "waymo", name: "Waymo Ride", price: 25, image: "/images/waymo.jpeg", bg: "#eff6ff" },
  { id: "uber-eats", name: "Uber Eats Order", price: 35, image: "/images/uber-eats.jpeg", bg: "#fefce8" },
  { id: "supabase", name: "Supabase Pro", price: 25, image: "/images/supabase.svg", bg: "#f0fdf4" },
  { id: "ai-domain", name: ".ai Domain", price: 70, image: "/images/ai-domain.jpeg", bg: "#eff6ff" },
  // Row 2 — mid
  { id: "keyboard", name: "Mech Keyboard", price: 175, image: "/images/keyboard.webp", bg: "#f4f4f5" },
  { id: "claude", name: "Claude Max", price: 200, image: "/images/claude-max.png", bg: "#fff7ed" },
  { id: "airpods", name: "AirPods Pro", price: 249, image: "/images/airpods.jpeg", bg: "#f8fafc" },
  { id: "mac-mini", name: "Mac Mini", price: 599, image: "/images/mac_mini.jpg", bg: "#f4f4f5" },
  { id: "dual-monitors", name: "Dual Monitor Setup", price: 800, image: "/images/dual-monitor.webp", bg: "#f8fafc" },
  // Row 3 — expensive
  { id: "iphone", name: "iPhone 16 Pro", price: 1199, image: "/images/iphone-17.jpeg", bg: "#faf5ff" },
  { id: "macbook", name: "MacBook Pro", price: 2499, image: "/images/macbook.png", bg: "#f4f4f5" },
  { id: "tesla", name: "Tesla Model 3", price: 35000, image: "/images/tesla.jpeg", bg: "#fef2f2" },
  { id: "h100", name: "NVIDIA H100", price: 30000, image: "/images/h100.jpeg", bg: "#f0fdf4" },
  { id: "rolex", name: "Rolex Submariner", price: 10000, image: "/images/rolex.webp", bg: "#fefce8" },
];

function formatUSD(val: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

function formatUSDShort(val: number): string {
  if (val >= 1000) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: val >= 10000 ? 0 : 1, notation: "compact" }).format(val);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
}

function formatUSDFull(val: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
}

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
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startRef.current + (target - startRef.current) * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [target, duration]);
  return display;
}

// Pad a string to fill width with dots
function padLine(left: string, right: string, width = 36): string {
  const dotsNeeded = width - left.length - right.length;
  if (dotsNeeded <= 0) return left + " " + right;
  return left + " " + ".".repeat(dotsNeeded) + " " + right;
}

export default function SpendPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [startup, setStartup] = useState<StartupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [printing, setPrinting] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/search?slug=${encodeURIComponent(slug)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Startup not found");
        setStartup(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const budget = startup?.revenue.mrr ?? 0;
  const remaining = budget - cartTotal;
  const animatedRemaining = useAnimatedNumber(remaining);

  const addToCart = (item: ShopItem) => {
    if (item.price > remaining) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const startPrinting = () => {
    setPrinting(true);
    setTimeout(() => {
      setPrinting(false);
      setShowReceipt(true);
    }, 2000);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (!existing) return prev;
      if (existing.qty <= 1) return prev.filter((c) => c.id !== id);
      return prev.map((c) => (c.id === id ? { ...c, qty: c.qty - 1 } : c));
    });
  };

  const downloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const url = await toPng(receiptRef.current, { backgroundColor: "#fafaf5", pixelRatio: 2 });
      const a = document.createElement("a");
      a.download = `spendmrr-${slug}.png`;
      a.href = url;
      a.click();
    } catch (e) { console.error(e); }
  };

  const shareReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const url = await toPng(receiptRef.current, { backgroundColor: "#fafaf5", pixelRatio: 2 });
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "spendmrr-receipt.png", { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "SpendMRR", text: `How I'd spend ${startup?.name}'s ${formatUSDFull(budget)} MRR` });
      } else { downloadReceipt(); }
    } catch { downloadReceipt(); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600" />
      </div>
    );
  }

  if (error || !startup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Startup not found</p>
        <p className="text-sm text-zinc-500">{error}</p>
        <button onClick={() => router.push("/")} className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900">Pick a startup</button>
      </div>
    );
  }

  const itemCount = cart.reduce((s, c) => s + c.qty, 0);
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  const timeStr = today.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const orderNum = Math.floor(Math.random() * 9000 + 1000);

  // ─── Receipt ───
  if (showReceipt) {
    return (
      <div className="min-h-screen bg-zinc-200 font-[family-name:var(--font-geist-sans)] dark:bg-zinc-950">
        <div className="mx-auto max-w-sm px-4 py-8 sm:px-6">
          <button
            onClick={() => setShowReceipt(false)}
            className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Keep shopping
          </button>

          {/* Thermal receipt */}
          <div
            ref={receiptRef}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              background: "#fafaf5",
              color: "#1a1a1a",
              padding: "36px 32px",
              fontSize: 14,
              lineHeight: 1.7,
              maxWidth: 380,
              margin: "0 auto",
              boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
              position: "relative",
            }}
          >
            {/* Torn top edge */}
            <div style={{ position: "absolute", top: -6, left: 0, right: 0, height: 6, background: "linear-gradient(135deg, transparent 33.33%, #fafaf5 33.33%, #fafaf5 66.67%, transparent 66.67%)", backgroundSize: "12px 6px" }} />

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 4 }}>SPENDMRR</div>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#666", marginTop: 2 }}>MONTHLY REVENUE SHOPPING</div>
            </div>

            {/* Dashed line */}
            <div style={{ borderTop: "2px dashed #ccc", margin: "12px 0" }} />

            {/* Store info */}
            <div style={{ textAlign: "center", fontSize: 13, color: "#555" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>{startup.name}</div>
              {startup.category && <div style={{ fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 1, color: "#888" }}>{startup.category}</div>}
              <div style={{ marginTop: 4 }}>MRR: {formatUSDFull(budget)}</div>
              {startup.customers > 0 && <div>{startup.customers.toLocaleString()} customers</div>}
              <div style={{ marginTop: 4, fontSize: 12 }}>
                {dateStr} {timeStr}
              </div>
              <div style={{ fontSize: 12 }}>Order #{orderNum}</div>
            </div>

            <div style={{ borderTop: "2px dashed #ccc", margin: "12px 0" }} />

            {/* Column headers */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" as const }}>
              <span>Item</span>
              <span>Amount</span>
            </div>
            <div style={{ borderTop: "1px solid #ddd", marginBottom: 8 }} />

            {/* Line items */}
            {cart.map((item) => (
              <div key={item.id} style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{item.name}</span>
                  <span style={{ fontWeight: 700 }}>{formatUSD(item.price * item.qty)}</span>
                </div>
                {item.qty > 1 && (
                  <div style={{ fontSize: 11, color: "#888", paddingLeft: 8 }}>
                    {item.qty} x {formatUSD(item.price)}
                  </div>
                )}
              </div>
            ))}

            <div style={{ borderTop: "1px solid #ddd", margin: "10px 0" }} />

            {/* Subtotal */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span>SUBTOTAL</span>
              <span>{formatUSD(cartTotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888" }}>
              <span>TAX</span>
              <span>$0.00</span>
            </div>

            <div style={{ borderTop: "2px dashed #ccc", margin: "10px 0" }} />

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 700 }}>
              <span>TOTAL</span>
              <span>{formatUSD(cartTotal)}</span>
            </div>

            <div style={{ borderTop: "2px dashed #ccc", margin: "10px 0" }} />

            {/* Payment info */}
            <div style={{ fontSize: 13, color: "#555" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>PAYMENT</span>
                <span>MRR</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>CHARGED</span>
                <span>{formatUSD(cartTotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>REMAINING</span>
                <span>{formatUSD(remaining)}</span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #ddd", margin: "10px 0" }} />

            {/* Stats */}
            <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>
              <div>{itemCount} item{itemCount !== 1 ? "s" : ""} purchased</div>
              <div>{((cartTotal / budget) * 100).toFixed(1)}% of monthly revenue spent</div>
            </div>

            <div style={{ borderTop: "2px dashed #ccc", margin: "12px 0" }} />

            {/* Footer */}
            <div style={{ textAlign: "center", fontSize: 12, color: "#999" }}>
              <div style={{ fontWeight: 700, color: "#444", fontSize: 13, marginBottom: 6 }}>THANK YOU FOR SHOPPING!</div>
              <div style={{ marginTop: 12, borderTop: "1px dashed #ccc", paddingTop: 12 }}>
                <div style={{ fontWeight: 700, color: "#444", fontSize: 12, letterSpacing: 1 }}>spendmrr.vercel.app</div>
                <div style={{ fontSize: 11, marginTop: 4, color: "#aaa" }}>made with ❤️ by{" "}
                  <span style={{ color: "#666", fontWeight: 600 }}>hrdk.life</span>
                </div>
              </div>
              <div style={{ marginTop: 10, letterSpacing: 2, color: "#ccc" }}>* * * * * * * * * * * *</div>
            </div>

            {/* Torn bottom edge */}
            <div style={{ position: "absolute", bottom: -6, left: 0, right: 0, height: 6, background: "linear-gradient(225deg, transparent 33.33%, #fafaf5 33.33%, #fafaf5 66.67%, transparent 66.67%)", backgroundSize: "12px 6px" }} />
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-2">
            <button onClick={downloadReceipt} className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              Download PNG
            </button>
            <button onClick={shareReceipt} className="flex-1 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
              Share
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Shopping ───
  return (
    <div className="min-h-screen bg-zinc-50 font-[family-name:var(--font-geist-sans)] dark:bg-zinc-950">
      {/* Budget bar */}
      <div className="sticky top-0 z-10 bg-emerald-600">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button onClick={() => router.push("/")} className="flex items-center gap-1.5 text-sm font-medium text-emerald-100 hover:text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="text-center">
            <div className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl">
              {formatUSDFull(animatedRemaining)}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {startup.icon && <img src={startup.icon} alt="" className="h-8 w-8 rounded-xl" />}
            <div className="hidden text-right text-sm sm:block">
              <div className="font-semibold text-white">{startup.name}</div>
              <div className="text-xs text-emerald-200">{formatUSDFull(budget)} MRR</div>
            </div>
          </div>
        </div>
        <div className="h-1 bg-emerald-700">
          <div className="h-full bg-white/30 transition-all duration-300 ease-out" style={{ width: `${Math.min((cartTotal / budget) * 100, 100)}%` }} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {SHOP_ITEMS.map((item) => {
            const inCart = cart.find((c) => c.id === item.id);
            const canAfford = item.price <= remaining;
            return (
              <div key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <div className="h-32 overflow-hidden sm:h-40" style={{ background: item.bg }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-3 text-center">
                  <div className="text-xs font-semibold leading-tight text-zinc-900 sm:text-sm dark:text-zinc-100">{item.name}</div>
                  <div className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-emerald-600">{formatUSDShort(item.price)}</div>
                  <div className="mt-auto flex items-center gap-1 pt-3">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      disabled={!inCart}
                      className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${inCart ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300" : "bg-zinc-50 text-zinc-300 cursor-not-allowed dark:bg-zinc-800/50 dark:text-zinc-600"}`}
                    >
                      Sell
                    </button>
                    <div className="flex w-10 items-center justify-center rounded-lg border border-zinc-200 py-2 font-[family-name:var(--font-space-grotesk)] text-sm font-bold tabular-nums text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                      {inCart?.qty ?? 0}
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!canAfford}
                      className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${canAfford ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-zinc-100 text-zinc-300 cursor-not-allowed dark:bg-zinc-800/50 dark:text-zinc-600"}`}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkout */}
        {cart.length > 0 && (
          <div className="sticky bottom-4 mt-6 flex gap-2">
            <button onClick={() => setCart([])} className="rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              Reset
            </button>
            <button
              onClick={startPrinting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white shadow-xl transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </button>
          </div>
        )}
      </div>

      {/* Printing overlay */}
      {printing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
        </div>
      )}
    </div>
  );
}
