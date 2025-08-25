// Flexible LLM adapter supporting multiple providers
export interface LLMProvider {
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  completeJSON<T>(prompt: string, options?: CompletionOptions): Promise<T>;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// OpenAI implementation
class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'gpt-4o') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    console.log('[OpenAI] Starting completion request');
    console.log('[OpenAI] Model:', options?.model || this.defaultModel);
    console.log('[OpenAI] Prompt length:', prompt.length);
    console.log('[OpenAI] Temperature:', options?.temperature || 0.7);
    
    const requestBody = {
      model: options?.model || this.defaultModel,
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant focused on content analysis and idea generation.' },
        { role: 'user', content: prompt }
      ],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 5000,
    };
    
    console.log('[OpenAI] Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenAI] API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[OpenAI] Response received');
    console.log('[OpenAI] Usage:', data.usage);
    console.log('[OpenAI] Response preview:', data.choices[0].message.content.substring(0, 200) + '...');
    
    return data.choices[0].message.content;
  }

  async completeJSON<T>(prompt: string, options?: CompletionOptions): Promise<T> {
    console.log('[OpenAI JSON] Starting JSON completion request');
    console.log('[OpenAI JSON] Prompt:', prompt.substring(0, 500) + '...');
    
    const requestBody = {
      model: options?.model || this.defaultModel,
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant. Always respond with valid JSON only. Do not include any markdown formatting, code blocks, or explanations outside the JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: options?.temperature || 0.3,
      max_tokens: options?.maxTokens || 5000,
      response_format: { type: "json_object" }
    };
    
    console.log('[OpenAI JSON] Request config:', {
      model: requestBody.model,
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens
    });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[OpenAI JSON] API error:', response.status, error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[OpenAI JSON] Response received');
    console.log('[OpenAI JSON] Raw response:', data.choices[0].message.content);
    
    try {
      const parsed = JSON.parse(data.choices[0].message.content);
      console.log('[OpenAI JSON] Successfully parsed JSON:', parsed);
      return parsed;
    } catch (error) {
      console.error('[OpenAI JSON] Failed to parse JSON:', error);
      console.error('[OpenAI JSON] Raw content:', data.choices[0].message.content);
      throw new Error('Invalid JSON response from LLM');
    }
  }
}

// Factory function to create the appropriate provider
export function createLLMProvider(): LLMProvider | null {
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey) {
    return new OpenAIProvider(openaiKey);
  }

  // Add Anthropic provider here when needed
  // const anthropicKey = process.env.ANTHROPIC_API_KEY;
  // if (anthropicKey) {
  //   return new AnthropicProvider(anthropicKey);
  // }

  console.warn('No LLM API key found. AI features will be limited.');
  return null;
}

// Singleton instance
let llmInstance: LLMProvider | null = null;

export function getLLM(): LLMProvider | null {
  if (!llmInstance) {
    llmInstance = createLLMProvider();
  }
  return llmInstance;
}
