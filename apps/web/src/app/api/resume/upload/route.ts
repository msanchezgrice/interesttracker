import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { openaiProvider } from '@/lib/llm';
import { geminiProvider } from '@/lib/llm/gemini-provider';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[Resume Upload] Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

    let extractedText = '';
    let expertise: string[] = [];

    try {
      // For PDFs and images, we'll use Gemini with appropriate extraction
      if (file.type === 'application/pdf') {
        // For PDFs, we need to extract text first
        // Since we can't directly process PDFs in the browser, we'll ask the user to paste text
        return NextResponse.json({
          error: 'PDF processing is not yet implemented. Please copy and paste your resume text instead.',
          text: ''
        });
      } else if (file.type.startsWith('image/')) {
        // For images, we can use Gemini's vision capabilities
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        
        const prompt = `Extract all text from this resume image. Then extract professional expertise from it.

Return a JSON object with two fields:
1. "text": The full text content of the resume
2. "expertise": An array of 10-15 specific skills, technologies, and areas of expertise

Focus on:
- Technical skills (programming languages, frameworks, tools)
- Domain expertise (industries, methodologies)
- Professional competencies
- Notable achievements or specializations

Format: {"text": "full resume text...", "expertise": ["skill1", "skill2", "skill3"]}`;

        const response = await geminiProvider.completeJSON<{text: string, expertise: string[]}>(
          prompt,
          {
            temperature: 0.3,
            maxTokens: 2000,
            model: 'gemini-2.0-flash-exp', // Using the vision model
            // We'll need to pass the image as part of the content
          }
        );

        // Note: This is a simplified version. In production, you'd need to properly
        // handle image uploads to Gemini's vision API
        return NextResponse.json({
          error: 'Image processing requires additional setup. Please copy and paste your resume text instead.',
          text: ''
        });
      } else {
        return NextResponse.json({
          error: 'Unsupported file type. Please upload a PDF or image file, or paste your resume text.',
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
