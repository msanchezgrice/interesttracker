import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.device.count();
    const devices = await prisma.device.findMany({
      select: {
        id: true,
        userId: true,
        label: true,
        apiKey: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({ count, devices });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
