import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { openaiProvider } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    // TODO: Replace with proper auth when Clerk is configured
    const userId = "local-test";

    const { resumeText } = await req.json();
    
    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim() === '') {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    console.log('[Resume Extract] Processing resume text for user:', userId);

    // Use OpenAI to extract skills and expertise
    const prompt = `Extract professional expertise from this resume/experience text:

${resumeText}

Return a JSON array of specific skills, technologies, and areas of expertise.
Focus on:
- Technical skills (programming languages, frameworks, tools)
- Domain expertise (industries, methodologies)
- Professional competencies
- Notable achievements or specializations

Return ONLY a JSON array in this exact format: ["skill1", "skill2", "skill3"]
Do NOT wrap it in an object like {skills: [...]}, just return the array directly.
Limit to 10-15 most relevant skills.`;

    try {
      if (!openaiProvider) {
        return NextResponse.json(
          { error: 'AI service not configured' },
          { status: 503 }
        );
      }

      const response = await openaiProvider.completeJSON<string[] | { skills: string[] }>(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });

      // Handle both array format and object with skills property
      let expertise: string[] = [];
      if (Array.isArray(response)) {
        expertise = response;
      } else if (response && typeof response === 'object' && 'skills' in response && Array.isArray(response.skills)) {
        expertise = response.skills;
      }
      
      console.log(`[Resume Extract] Extracted ${expertise.length} skills:`, expertise);

      // Save the extracted expertise
      await prisma.userPreferences.upsert({
        where: { userId },
        update: {
          extractedExpertise: expertise,
          lastExpertiseSync: new Date()
        },
        create: {
          userId,
          extractedExpertise: expertise,
          lastExpertiseSync: new Date(),
          weeklyThemes: [],
          generalInterests: []
        }
      });

      return NextResponse.json({
        expertise,
        message: `Successfully extracted ${expertise.length} skills from your resume`
      });

    } catch (error) {
      console.error('[Resume Extract] Error extracting skills:', error);
      return NextResponse.json(
        { error: 'Failed to extract skills from resume' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Resume Extract] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
