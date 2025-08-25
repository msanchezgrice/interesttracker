import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { openaiProvider } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

Format: ["skill1", "skill2", "skill3"]
Limit to 10-15 most relevant skills.

Return ONLY the JSON array, no markdown, no explanations.`;

    try {
      const response = await openaiProvider.completeJSON<string[]>(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });

      const expertise = Array.isArray(response) ? response : [];
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
