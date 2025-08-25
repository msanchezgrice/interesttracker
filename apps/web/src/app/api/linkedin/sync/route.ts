import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// LinkedIn scraping using Google's URL Context API
async function scrapeLinkedInProfile(url: string): Promise<string[]> {
  try {
    // Validate LinkedIn URL
    const match = url.match(/linkedin\.com\/in\/([^\/]+)/);
    if (!match) {
      throw new Error("Invalid LinkedIn URL");
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found');
      return [];
    }

    console.log(`[LinkedIn Sync] Extracting expertise from: ${url}`);
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Extract professional expertise from this LinkedIn profile: ${url}
            
            Return a JSON array of specific skills, technologies, and areas of expertise.
            Focus on:
            - Technical skills (programming languages, frameworks, tools)
            - Domain expertise (industries, methodologies)
            - Professional competencies
            - Notable achievements or specializations
            
            Format: ["skill1", "skill2", "skill3"]
            Limit to 10-15 most relevant skills.`
          }]
        }],
        tools: [{
          url_context: {}
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      console.error('API response not ok:', response.status);
      return [];
    }
    
    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const expertise = JSON.parse(data.candidates[0].content.parts[0].text);
      console.log(`[LinkedIn Sync] Extracted ${expertise.length} skills`);
      return Array.isArray(expertise) ? expertise : [];
    }
    
    return [];
  } catch (error) {
    console.error("LinkedIn scraping error:", error);
    // Return empty array on error - user can add manually
    return [];
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
