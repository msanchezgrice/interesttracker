import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  // Support both route handler request headers and edge runtime compat
  const deviceKey = req.headers.get("x-device-key") ?? (await headers()).get("x-device-key");
  if (!deviceKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const device = await prisma.device.findUnique({ where: { apiKey: deviceKey } });
  if (!device) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { events } = await req.json();
  if (!Array.isArray(events)) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const rows = events.map((e: { url: string; title?: string; ms: number; scrollDepth?: number; tsStart: number; tsEnd: number }) => {
    const u = new URL(e.url);
    return {
      userId: device.userId,
      url: e.url,
      urlHash: crypto.createHash("sha256").update(e.url).digest("hex"),
      title: e.title?.slice(0, 512) ?? null,
      domain: u.hostname,
      ms: Math.max(0, Math.min(e.ms | 0, 6 * 60 * 60 * 1000)),
      scroll: typeof e.scrollDepth === "number" ? Math.max(0, Math.min(1, e.scrollDepth)) : null,
      tsStart: new Date(e.tsStart),
      tsEnd: new Date(e.tsEnd),
      source: "chrome" as const,
    };
  });

  await prisma.event.createMany({ data: rows });
  return NextResponse.json({ saved: rows.length });
}


