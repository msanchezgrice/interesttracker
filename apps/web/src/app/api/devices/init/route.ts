import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Use test user until Clerk is configured
  const userId = "local-test";

  const { label } = await req.json().catch(() => ({ label: null }));
  const apiKey = await cryptoRandom(48);

  // Ensure User record exists
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email: `${userId}@placeholder.local` },
    update: {},
  });

  const device = await prisma.device.create({
    data: { userId, label, apiKey },
  });

  const origin = process.env.NEXT_PUBLIC_BASE_URL || req.headers.get("origin") || "";
  const ingestUrl = `${origin}/api/ingest`;
  return NextResponse.json({ deviceKey: device.apiKey, ingestUrl });
}

async function cryptoRandom(length: number) {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    // Node.js
    const nodeCrypto = await import("crypto");
    nodeCrypto.randomFillSync(bytes);
  }
  return Buffer.from(bytes).toString("base64url");
}


