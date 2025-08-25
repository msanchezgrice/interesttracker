import { NextRequest, NextResponse } from 'next/server';
import { openaiProvider } from '@/lib/llm';
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

    // Check if OpenAI provider is available
    if (!openaiProvider) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    try {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        // Convert file to base64 for OpenAI
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        
        console.log('[Resume Upload] Sending file to OpenAI for analysis');
        
        // Create the prompt for OpenAI
        const prompt = `You are analyzing a resume file. Extract the following information:

1. First, extract ALL the text content from the file
2. Then, identify 10-15 specific skills, technologies, and areas of expertise

Return a JSON object in this EXACT format:
{
  "text": "full text content of the resume...",
  "expertise": ["skill1", "skill2", "skill3", ...]
}

Focus on:
- Technical skills (programming languages, frameworks, tools)
- Domain expertise (industries, methodologies)
- Professional competencies
- Notable achievements or specializations`;

        // Use OpenAI's vision/file analysis capability
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
          console.error('[Resume Upload] OpenAI API error:', error);
          throw new Error('Failed to analyze file');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        console.log('[Resume Upload] OpenAI response received');
        
        // Parse the JSON response
        try {
          const parsed = JSON.parse(content);
          console.log('[Resume Upload] Extracted text length:', parsed.text?.length || 0);
          console.log('[Resume Upload] Extracted skills:', parsed.expertise?.length || 0);
          
          // Save the expertise to database
          if (parsed.expertise && parsed.expertise.length > 0) {
            await prisma.userPreferences.upsert({
              where: { userId },
              update: {
                extractedExpertise: parsed.expertise,
                lastExpertiseSync: new Date()
              },
              create: {
                userId,
                extractedExpertise: parsed.expertise,
                lastExpertiseSync: new Date(),
                weeklyThemes: [],
                generalInterests: []
              }
            });
          }
          
          return NextResponse.json({
            text: parsed.text || '',
            expertise: parsed.expertise || [],
            message: parsed.expertise?.length ? `Successfully extracted ${parsed.expertise.length} skills from your resume` : 'No skills found'
          });
        } catch (parseError) {
          console.error('[Resume Upload] Failed to parse OpenAI response:', parseError);
          // Try to extract text from the response even if it's not proper JSON
          return NextResponse.json({
            text: content,
            expertise: [],
            message: 'Could not parse skills, but extracted text'
          });
        }
        
      } else {
        return NextResponse.json({
          error: 'Unsupported file type. Please upload a PDF or image file.',
          text: ''
        });
      }

    } catch (error) {
      console.error('[Resume Upload] Error processing file:', error);
      return NextResponse.json(
        { error: 'Failed to process file. Please try pasting your resume text instead.' },
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