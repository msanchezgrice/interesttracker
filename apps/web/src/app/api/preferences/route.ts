import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = "local-test"; // TODO: Get from auth
    
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { focusThemes: true, updatedAt: true }
    });
    
    return NextResponse.json({ 
      focusThemes: preferences?.focusThemes || [],
      updatedAt: preferences?.updatedAt || null
    });
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = "local-test"; // TODO: Get from auth
    const { focusThemes } = await req.json();
    
    if (!Array.isArray(focusThemes)) {
      return NextResponse.json({ error: "focusThemes must be an array" }, { status: 400 });
    }
    
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: { focusThemes },
      create: { userId, focusThemes }
    });
    
    return NextResponse.json({ 
      focusThemes: preferences.focusThemes,
      updatedAt: preferences.updatedAt
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
