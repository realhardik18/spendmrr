import { NextRequest, NextResponse } from "next/server";

const TRUSTMRR_BASE = "https://trustmrr.com/api/v1";

export async function GET(request: NextRequest) {
  const apiKey = process.env.TRUSTMRR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TRUSTMRR_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const res = await fetch(`${TRUSTMRR_BASE}/startups/${encodeURIComponent(slug)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  }

  // Forward all query params to the list endpoint
  const params = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key !== "slug") params.set(key, value);
  }

  const res = await fetch(`${TRUSTMRR_BASE}/startups?${params.toString()}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json(data);
}
