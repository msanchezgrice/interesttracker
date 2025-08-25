import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // TODO: Replace with proper auth when Clerk is configured
    const userId = "local-test";

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[Resume Upload] Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    // Convert file to base64 for vision API
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type;

    console.log('[Resume Upload] Analyzing file with GPT-4o vision API');

    // Use GPT-4o vision API to analyze the PDF/image directly
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // GPT-4o supports vision and document analysis
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this resume document and extract:
1. The full text content from the document
2. 10-15 specific skills, technologies, and areas of expertise

Return the response as a JSON object in this exact format:
{
  "text": "full extracted text from the resume...",
  "expertise": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8", "skill9", "skill10"]
}

Focus on technical skills, programming languages, frameworks, tools, domain expertise, and professional competencies. Be specific and avoid generic terms.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!analysisResponse.ok) {
      const error = await analysisResponse.text();
      console.error('[Resume Upload] Analysis error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await analysisResponse.json();
    const content = data.choices[0].message.content;
    
    console.log('[Resume Upload] Raw response:', content);

    // Parse the JSON response
    let extractedText = '';
    let expertise: string[] = [];
    
    try {
      const parsed = JSON.parse(content);
      extractedText = parsed.text || '';
      expertise = parsed.expertise || [];
    } catch (parseError) {
      console.error('[Resume Upload] Failed to parse JSON response:', parseError);
      // If JSON parsing fails, treat the entire response as extracted text
      extractedText = content;
      expertise = [];
    }

    // Save expertise to database
    if (expertise && expertise.length > 0) {
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
    }
    
    console.log(`[Resume Upload] Successfully extracted ${expertise.length} skills:`, expertise);
    
    return NextResponse.json({
      text: extractedText,
      expertise: expertise || [],
      message: expertise?.length ? `Successfully extracted ${expertise.length} skills from your resume` : 'Extracted text but no specific skills found'
    });

  } catch (error) {
    console.error('[Resume Upload] Error processing file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    );
  }
}