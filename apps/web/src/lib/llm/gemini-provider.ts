// Gemini LLM Provider with URL Context support
export interface GeminiCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  tools?: Array<{ url_context?: Record<string, never> }>;
}

export class GeminiProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string = process.env.GEMINI_API_KEY || '', defaultModel = 'gemini-2.5-flash') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async complete(prompt: string, options?: GeminiCompletionOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('[Gemini] Starting completion request');
    console.log('[Gemini] Model:', options?.model || this.defaultModel);
    console.log('[Gemini] Tools:', options?.tools ? 'URL Context enabled' : 'No tools');
    
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: options?.temperature || 0.7,
        maxOutputTokens: options?.maxTokens || 2048,
      },
      tools: options?.tools || undefined
    };


    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${options?.model || this.defaultModel}:generateContent`, {
      method: 'POST',
      headers: {
        'x-goog-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Gemini] Response received');
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('Invalid response structure from Gemini API');
  }

  async completeJSON<T>(prompt: string, options?: GeminiCompletionOptions): Promise<T> {
    console.log('[Gemini JSON] Starting JSON completion request');
    
    const requestBody = {
      contents: [{
        parts: [{ text: `${prompt}\n\nRespond with valid JSON only.` }]
      }],
      generationConfig: {
        temperature: options?.temperature || 0.3,
        maxOutputTokens: options?.maxTokens || 2048,
        response_mime_type: "application/json"
      },
      tools: options?.tools || undefined
    };


    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${options?.model || this.defaultModel}:generateContent`, {
      method: 'POST',
      headers: {
        'x-goog-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini JSON] API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Gemini JSON] Response received');
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const jsonStr = data.candidates[0].content.parts[0].text;
      try {
        return JSON.parse(jsonStr);
      } catch (error) {
        console.error('[Gemini JSON] Failed to parse JSON:', jsonStr);
        throw new Error('Failed to parse JSON response from Gemini');
      }
    }
    
    throw new Error('Invalid response structure from Gemini API');
  }
}

// Export a singleton instance
export const geminiProvider = new GeminiProvider();
