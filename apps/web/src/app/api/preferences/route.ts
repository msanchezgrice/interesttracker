import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = "local-test"; // TODO: Get from auth
    
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { 
        weeklyThemes: true, 
        generalInterests: true, 
        linkedinUrl: true,
        extractedExpertise: true,
        lastExpertiseSync: true,
        updatedAt: true 
      }
    });
    
    return NextResponse.json({ 
      weeklyThemes: preferences?.weeklyThemes || [],
      generalInterests: preferences?.generalInterests || [],
      linkedinUrl: preferences?.linkedinUrl || '',
      extractedExpertise: preferences?.extractedExpertise || [],
      lastExpertiseSync: preferences?.lastExpertiseSync || null,
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
    const { weeklyThemes, generalInterests, linkedinUrl, extractedExpertise } = await req.json();
    
    if (!Array.isArray(weeklyThemes) || !Array.isArray(generalInterests)) {
      return NextResponse.json({ error: "weeklyThemes and generalInterests must be arrays" }, { status: 400 });
    }
    
    const updateData: any = { weeklyThemes, generalInterests };
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (extractedExpertise !== undefined) updateData.extractedExpertise = extractedExpertise;
    
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: updateData,
      create: { userId, ...updateData }
    });
    
    return NextResponse.json({ 
      weeklyThemes: preferences.weeklyThemes,
      generalInterests: preferences.generalInterests,
      linkedinUrl: preferences.linkedinUrl,
      extractedExpertise: preferences.extractedExpertise,
      updatedAt: preferences.updatedAt
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
