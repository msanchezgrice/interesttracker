import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = "local-test"; // TODO: Get from auth
    
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { weeklyThemes: true, generalInterests: true, updatedAt: true }
    });
    
    return NextResponse.json({ 
      weeklyThemes: preferences?.weeklyThemes || [],
      generalInterests: preferences?.generalInterests || [],
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
    const { weeklyThemes, generalInterests } = await req.json();
    
    if (!Array.isArray(weeklyThemes) || !Array.isArray(generalInterests)) {
      return NextResponse.json({ error: "weeklyThemes and generalInterests must be arrays" }, { status: 400 });
    }
    
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: { weeklyThemes, generalInterests },
      create: { userId, weeklyThemes, generalInterests }
    });
    
    return NextResponse.json({ 
      weeklyThemes: preferences.weeklyThemes,
      generalInterests: preferences.generalInterests,
      updatedAt: preferences.updatedAt
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
