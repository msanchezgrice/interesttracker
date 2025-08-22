import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  console.log('[Ingest API] Received ingest request');
  
  // Support both route handler request headers and edge runtime compat
  const deviceKey = req.headers.get("x-device-key") ?? (await headers()).get("x-device-key");
  console.log('[Ingest API] Device key from header:', deviceKey?.substring(0, 10) + '...');
  
  if (!deviceKey) {
    console.error('[Ingest API] No device key provided');
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const device = await prisma.device.findUnique({ where: { apiKey: deviceKey } });
  if (!device) {
    console.error('[Ingest API] Invalid device key');
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  
  console.log('[Ingest API] Device found for user:', device.userId);

  const { events } = await req.json();
  console.log('[Ingest API] Events received:', events?.length || 0);
  
  if (!Array.isArray(events)) {
    console.error('[Ingest API] Events is not an array');
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const rows = events.map((e: { url: string; title?: string; ms: number; scrollDepth?: number; tsStart: number; tsEnd: number }) => {
    const u = new URL(e.url);
    const row = {
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
    
    console.log('[Ingest API] Processing event:', {
      url: e.url,
      ms: row.ms,
      scroll: row.scroll,
      sessionLength: Math.round(row.ms / 1000) + 's'
    });
    
    return row;
  });

  console.log('[Ingest API] Saving', rows.length, 'events to database');
  await prisma.event.createMany({ data: rows });
  console.log('[Ingest API] Events saved successfully');
  
  return NextResponse.json({ saved: rows.length });
}


