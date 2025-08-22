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

  constructor(apiKey: string, defaultModel = 'gpt-4-turbo-preview') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant focused on content analysis and idea generation.' },
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async completeJSON<T>(prompt: string, options?: CompletionOptions): Promise<T> {
    const jsonPrompt = `${prompt}\n\nRespond with valid JSON only, no markdown formatting.`;
    const response = await this.complete(jsonPrompt, {
      ...options,
      temperature: options?.temperature || 0.3, // Lower temp for structured output
    });

    try {
      // Clean up common JSON formatting issues
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse LLM JSON response:', response);
      throw new Error('Invalid JSON response from LLM');
    }
  }
}

// Factory function to create the appropriate provider
export function createLLMProvider(): LLMProvider | null {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (openaiKey) {
    return new OpenAIProvider(openaiKey);
  }

  // Add Anthropic provider here when needed
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
