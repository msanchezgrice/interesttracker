import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        url: true,
        title: true,
        domain: true,
        ms: true,
        scroll: true,
        tsStart: true,
        tsEnd: true,
        createdAt: true,
        userId: true
      }
    });
    
    const total = await prisma.event.count();
    
    return NextResponse.json({ 
      events: events.map(e => ({
        ...e,
        minutes: Math.round(e.ms / 60000 * 10) / 10, // round to 1 decimal
        scrollPercent: e.scroll ? Math.round(e.scroll * 100) : null
      })), 
      total,
      hasMore: offset + limit < total
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
