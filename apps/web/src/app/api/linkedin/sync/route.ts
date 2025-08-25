import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// LinkedIn scraping function using Puppeteer or simple fetch
async function scrapeLinkedInProfile(url: string): Promise<string[]> {
  try {
    // For now, we'll use a simple approach with fetch
    // In production, you might want to use Puppeteer or Playwright
    
    // Extract username from LinkedIn URL
    const match = url.match(/linkedin\.com\/in\/([^\/]+)/);
    if (!match) {
      throw new Error("Invalid LinkedIn URL");
    }
    
    // Since LinkedIn requires authentication for full profile access,
    // we'll return a placeholder implementation
    // In production, you'd implement proper scraping or use LinkedIn API
    
    // For demonstration, extract some expertise from the URL itself
    // const username = match[1];
    
    // You could enhance this by:
    // 1. Using Puppeteer/Playwright for actual scraping
    // 2. Using LinkedIn API with OAuth
    // 3. Using a third-party service like ScrapingBee
    
    // Placeholder expertise based on common patterns
    const placeholderExpertise = [
      "Software Development",
      "Product Management", 
      "Technical Leadership"
    ];
    
    return placeholderExpertise;
  } catch (error) {
    console.error("LinkedIn scraping error:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = "local-test"; // TODO: Get from auth
    const { linkedinUrl } = await req.json();
    
    if (!linkedinUrl || !linkedinUrl.includes('linkedin.com')) {
      return NextResponse.json({ error: "Invalid LinkedIn URL" }, { status: 400 });
    }
    
    // Scrape LinkedIn profile
    const expertise = await scrapeLinkedInProfile(linkedinUrl);
    
    // Update user preferences
    await prisma.userPreferences.upsert({
      where: { userId },
      update: { 
        linkedinUrl,
        extractedExpertise: expertise,
        lastExpertiseSync: new Date()
      },
      create: { 
        userId,
        linkedinUrl,
        extractedExpertise: expertise,
        lastExpertiseSync: new Date(),
        weeklyThemes: [],
        generalInterests: []
      }
    });
    
    return NextResponse.json({ 
      expertise,
      message: "LinkedIn profile synced successfully"
    });
  } catch (error) {
    console.error("Failed to sync LinkedIn:", error);
    return NextResponse.json({ 
      error: "Failed to sync LinkedIn profile. You can add expertise manually instead." 
    }, { status: 500 });
  }
}
