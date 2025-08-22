import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY;
  
  let userId: string;
  if (hasClerkKeys) {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    userId = clerkUserId;
  } else {
    // Fallback when Clerk isn't configured - use a test user
    userId = "local-test";
  }

  const { label } = await req.json().catch(() => ({ label: null }));
  const apiKey = cryptoRandom(48);

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

function cryptoRandom(length: number) {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    // Node.js
    const nodeCrypto = require("crypto");
    nodeCrypto.randomFillSync(bytes);
  }
  return Buffer.from(bytes).toString("base64url");
}


