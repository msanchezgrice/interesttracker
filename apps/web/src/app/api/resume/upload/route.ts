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
    if (!openaiProvider || !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    try {
      let extractedText = '';
      let expertise: string[] = [];

      // Convert file to FormData for OpenAI file upload
      const fileFormData = new FormData();
      fileFormData.append('purpose', 'user_data');
      fileFormData.append('file', file);

      console.log('[Resume Upload] Uploading file to OpenAI');

      // Upload file to OpenAI
      const uploadResponse = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: fileFormData
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        console.error('[Resume Upload] File upload error:', error);
        
        // Fallback to pdf-parse for PDFs
        if (file.type === 'application/pdf') {
          console.log('[Resume Upload] Falling back to pdf-parse');
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          const pdf = await import('pdf-parse');
          const pdfData = await pdf.default(buffer);
          extractedText = pdfData.text;
          
          if (!extractedText || extractedText.length < 50) {
            throw new Error('Could not extract meaningful text from PDF');
          }
          
          // Extract skills from text
          const prompt = `Extract professional expertise from this resume text:

${extractedText}

Return ONLY a JSON array of 10-15 specific skills, technologies, and areas of expertise in this exact format: ["skill1", "skill2", "skill3"]`;

          const response = await openaiProvider.completeJSON<string[] | { skills: string[] }>(prompt, {
            temperature: 0.3,
            maxTokens: 500
          });

          if (Array.isArray(response)) {
            expertise = response;
          } else if (response && typeof response === 'object' && 'skills' in response) {
            expertise = response.skills;
          }
        } else {
          throw new Error('File upload failed and no fallback available');
        }
      } else {
        const uploadData = await uploadResponse.json();
        const fileId = uploadData.id;
        
        console.log('[Resume Upload] File uploaded successfully, ID:', fileId);
        
        // Try the new responses endpoint
        const analysisResponse = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-5", // Latest model as of August 2025
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_file",
                    file_id: fileId
                  },
                  {
                    type: "input_text",
                    text: `Extract the following from this resume:
1. The full text content
2. 10-15 specific skills, technologies, and areas of expertise

Return as JSON in format:
{
  "text": "full resume text...",
  "expertise": ["skill1", "skill2", "skill3", ...]
}`
                  }
                ]
              }
            ]
          })
        });

        if (!analysisResponse.ok) {
          const error = await analysisResponse.text();
          console.error('[Resume Upload] Analysis error:', error);
          
          // Fallback to standard chat completions
          console.log('[Resume Upload] Falling back to chat completions');
          const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                {
                  role: "user",
                  content: `I uploaded a file with ID ${fileId}. Please extract skills from it.`
                }
              ],
              max_tokens: 1000
            })
          });
          
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            const content = data.choices[0].message.content;
            extractedText = content;
            expertise = [];
          } else {
            throw new Error('Both responses endpoint and fallback failed');
          }
        } else {
          const data = await analysisResponse.json();
          const output = data.output_text || data.output || data.choices?.[0]?.message?.content || '';
          
          try {
            const parsed = JSON.parse(output);
            extractedText = parsed.text || '';
            expertise = parsed.expertise || [];
          } catch {
            extractedText = output;
            expertise = [];
          }
        }
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