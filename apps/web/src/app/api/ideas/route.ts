import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ideas = await prisma.idea.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        topic: true,
        sourceUrls: true,
        score: true,
        scoreBreakdown: true,
        status: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({ ideas });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
