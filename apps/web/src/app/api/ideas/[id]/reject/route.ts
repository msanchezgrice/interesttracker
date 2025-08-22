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
      data: { status: 'REJECTED' }
    });

    return NextResponse.json({ success: true, idea });
  } catch (error) {
    console.error("Failed to reject idea:", error);
    return NextResponse.json(
      { error: "Failed to reject idea" },
      { status: 500 }
    );
  }
}
