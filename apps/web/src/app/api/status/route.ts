import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      database: true,
      message: "All systems operational"
    });
  } catch (error) {
    console.error("Status check failed:", error);
    return NextResponse.json({
      database: false,
      message: "Database connection failed"
    }, { status: 503 });
  }
}
