import { NextRequest, NextResponse } from 'next/server';
import { openaiProvider } from '@/lib/llm';
import { prisma } from '@/lib/prisma';

// Dynamic import to avoid issues with pdf-parse in edge runtime
const pdfParse = async (buffer: Buffer) => {
  const pdf = await import('pdf-parse');
  return pdf.default(buffer);
};

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

    // Check if OpenAI provider is available
    if (!openaiProvider) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    try {
      let extractedText = '';
      let expertise: string[] = [];

      if (file.type === 'application/pdf') {
        // Handle PDF files by extracting text
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        console.log('[Resume Upload] Extracting text from PDF');
        
        try {
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text;
          console.log('[Resume Upload] Extracted text length:', extractedText.length);
          
          if (!extractedText || extractedText.length < 50) {
            throw new Error('Could not extract meaningful text from PDF');
          }
          
          // Now use the extracted text to get skills
          const prompt = `Extract professional expertise from this resume text:

${extractedText}

Return ONLY a JSON array of 10-15 specific skills, technologies, and areas of expertise in this exact format: ["skill1", "skill2", "skill3"]
Do NOT wrap it in an object like {skills: [...]}, just return the array directly.

Focus on:
- Technical skills (programming languages, frameworks, tools)
- Domain expertise (industries, methodologies)
- Professional competencies
- Notable achievements or specializations`;

          const response = await openaiProvider.completeJSON<string[] | { skills: string[] }>(prompt, {
            temperature: 0.3,
            maxTokens: 500
          });

          // Handle both array format and object with skills property
          if (Array.isArray(response)) {
            expertise = response;
          } else if (response && typeof response === 'object' && 'skills' in response && Array.isArray(response.skills)) {
            expertise = response.skills;
          }
          
          console.log(`[Resume Upload] Extracted ${expertise.length} skills:`, expertise);
          
        } catch (pdfError) {
          console.error('[Resume Upload] PDF parsing error:', pdfError);
          throw new Error('Failed to parse PDF. The file may be corrupted or password-protected.');
        }
        
      } else if (file.type.startsWith('image/')) {
        // Handle image files using OpenAI vision
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        
        console.log('[Resume Upload] Sending image to OpenAI for analysis');
        
        const prompt = `You are analyzing a resume image. Extract the following information:

1. First, extract ALL the text content from the image
2. Then, identify 10-15 specific skills, technologies, and areas of expertise

Return a JSON object in this EXACT format:
{
  "text": "full text content of the resume...",
  "expertise": ["skill1", "skill2", "skill3", ...]
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: prompt
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${file.type};base64,${base64}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 4000,
            temperature: 0.3
          })
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('[Resume Upload] OpenAI Vision API error:', error);
          throw new Error('Failed to analyze image');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        console.log('[Resume Upload] OpenAI vision response received');
        
        // Parse the JSON response
        const parsed = JSON.parse(content);
        extractedText = parsed.text || '';
        expertise = parsed.expertise || [];
        
      } else {
        return NextResponse.json({
          error: 'Unsupported file type. Please upload a PDF or image file.',
          text: ''
        });
      }

      // Save the expertise to database if we have any
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

  } catch (error) {
    console.error('[Resume Upload] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Configure the API route for Node.js runtime (required for pdf-parse)
export const runtime = 'nodejs';