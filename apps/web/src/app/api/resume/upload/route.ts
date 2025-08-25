import { NextRequest, NextResponse } from 'next/server';

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
        // For images, we'll need to implement vision API support
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
