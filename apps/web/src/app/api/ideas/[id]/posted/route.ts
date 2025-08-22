import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idea = await prisma.idea.update({
      where: { id },
      data: { status: 'POSTED' }
    });

    return NextResponse.json({ success: true, idea });
  } catch (error) {
    console.error("Failed to mark idea as posted:", error);
    return NextResponse.json(
      { error: "Failed to mark idea as posted" },
      { status: 500 }
    );
  }
}
