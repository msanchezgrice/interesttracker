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
    
    const requestBody = {
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
          Limit to 10-15 most relevant skills.
          
          Return ONLY the JSON array, no markdown, no explanations.`
        }]
      }],
      tools: [{
        url_context: {}
      }]
      // Note: Cannot use response_mime_type with tools
    };
    
    console.log('[LinkedIn Sync] Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[LinkedIn Sync] Response status:', response.status);
    console.log('[LinkedIn Sync] Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LinkedIn Sync] API error response:', errorText);
      return [];
    }
    
    const data = await response.json();
    console.log('[LinkedIn Sync] Response data:', JSON.stringify(data, null, 2));
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const textContent = data.candidates[0].content.parts[0].text;
      console.log('[LinkedIn Sync] Raw text content:', textContent);
      
      try {
        // Try to parse JSON, handling potential markdown
        let expertise;
        const jsonMatch = textContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          expertise = JSON.parse(jsonMatch[0]);
        } else {
          expertise = JSON.parse(textContent);
        }
        
        console.log(`[LinkedIn Sync] Successfully extracted ${expertise.length} skills:`, expertise);
        return Array.isArray(expertise) ? expertise : [];
      } catch (error) {
        console.error('[LinkedIn Sync] Failed to parse expertise JSON:', error);
        console.error('[LinkedIn Sync] Content that failed to parse:', textContent);
        return [];
      }
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
