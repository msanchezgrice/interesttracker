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

    console.log('[Resume Upload] Uploading file to OpenAI for analysis');

    // Step 1: Upload file to OpenAI with 'assistants' purpose
    const fileFormData = new FormData();
    fileFormData.append('purpose', 'assistants');
    fileFormData.append('file', file);

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
      throw new Error(`File upload failed: ${error}`);
    }

    const uploadData = await uploadResponse.json();
    const fileId = uploadData.id;
    console.log('[Resume Upload] File uploaded successfully, ID:', fileId);

    // Step 2: Create an assistant with file_search capability
    const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: 'Resume Analyzer',
        instructions: 'You are an expert at analyzing resumes and extracting professional skills and expertise.',
        model: 'gpt-4o',
        tools: [{ type: 'file_search' }]
      })
    });

    if (!assistantResponse.ok) {
      const error = await assistantResponse.text();
      console.error('[Resume Upload] Assistant creation error:', error);
      throw new Error(`Assistant creation failed: ${error}`);
    }

    const assistant = await assistantResponse.json();
    console.log('[Resume Upload] Assistant created:', assistant.id);

    // Step 3: Create a thread with the uploaded file
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Analyze the attached resume document and extract:
1. The full text content from the document
2. 10-15 specific skills, technologies, and areas of expertise

Return the response as a JSON object in this exact format:
{
  "text": "full extracted text from the resume...",
  "expertise": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8", "skill9", "skill10"]
}

Focus on technical skills, programming languages, frameworks, tools, domain expertise, and professional competencies. Be specific and avoid generic terms.`,
            attachments: [
              {
                file_id: fileId,
                tools: [{ type: 'file_search' }]
              }
            ]
          }
        ]
      })
    });

    if (!threadResponse.ok) {
      const error = await threadResponse.text();
      console.error('[Resume Upload] Thread creation error:', error);
      throw new Error(`Thread creation failed: ${error}`);
    }

    const thread = await threadResponse.json();
    console.log('[Resume Upload] Thread created:', thread.id);

    // Step 4: Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistant.id
      })
    });

    if (!runResponse.ok) {
      const error = await runResponse.text();
      console.error('[Resume Upload] Run creation error:', error);
      throw new Error(`Run creation failed: ${error}`);
    }

    const run = await runResponse.json();
    console.log('[Resume Upload] Run started:', run.id);

    // Step 5: Poll for completion
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        console.log('[Resume Upload] Run status:', runStatus);
      }
      
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error(`Assistant run failed or timed out. Status: ${runStatus}`);
    }

    // Step 6: Get the assistant's response
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!messagesResponse.ok) {
      const error = await messagesResponse.text();
      console.error('[Resume Upload] Messages retrieval error:', error);
      throw new Error(`Messages retrieval failed: ${error}`);
    }

    const messages = await messagesResponse.json();
    const assistantMessage = messages.data.find((msg: { role: string; content: Array<{ text: { value: string } }> }) => msg.role === 'assistant');
    
    if (!assistantMessage) {
      throw new Error('No assistant response found');
    }

    const content = assistantMessage.content[0].text.value;
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

    // Cleanup: Delete the assistant and file
    try {
      await fetch(`https://api.openai.com/v1/assistants/${assistant.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      await fetch(`https://api.openai.com/v1/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        }
      });
      
      console.log('[Resume Upload] Cleanup completed');
    } catch (cleanupError) {
      console.warn('[Resume Upload] Cleanup warning:', cleanupError);
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