import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// LinkedIn scraping function - returns empty array if can't scrape
async function scrapeLinkedInProfile(url: string): Promise<string[]> {
  try {
    // Extract username from LinkedIn URL
    const match = url.match(/linkedin\.com\/in\/([^\/]+)/);
    if (!match) {
      throw new Error("Invalid LinkedIn URL");
    }
    
    // LinkedIn requires authentication for profile access
    // Without proper scraping setup, we return empty array
    // User can manually add expertise instead
    
    // TODO: Implement one of these approaches:
    // 1. Google's URL context API when available
    // 2. Puppeteer/Playwright for browser automation
    // 3. LinkedIn API with OAuth
    // 4. Third-party service (ScrapingBee, Apify, etc.)
    
    console.log(`Would scrape LinkedIn profile: ${url}`);
    return [];
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
      message: expertise.length > 0 
        ? "LinkedIn profile synced successfully" 
        : "LinkedIn URL saved. Please add your expertise manually below."
    });
  } catch (error) {
    console.error("Failed to sync LinkedIn:", error);
    return NextResponse.json({ 
      error: "Failed to sync LinkedIn profile. You can add expertise manually instead." 
    }, { status: 500 });
  }
}
