import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.event.count();
    const recent = await prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        url: true,
        title: true,
        ms: true,
        domain: true,
        createdAt: true,
        userId: true
      }
    });
    
    return NextResponse.json({ count, recent });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
