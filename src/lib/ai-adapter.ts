// ============================================
// OpenNotebook AI - Multi-Provider Adapter
// Unified interface for all AI providers
// ============================================

import { AIModel, AIProviderConfig, ChatMessage, Citation } from './types';
import { decryptKey } from './crypto';

// ---- Provider Definitions ----
export const PROVIDER_DEFINITIONS: Record<string, {
  name: string;
  icon: string;
  baseUrl: string;
  models: AIModel[];
  apiKeyPrefix: string;
  apiKeyUrl: string;
}> = {
  openai: {
    name: 'OpenAI',
    icon: '🟢',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyPrefix: 'sk-',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', type: 'chat', maxTokens: 16384, contextWindow: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', type: 'chat', maxTokens: 16384, contextWindow: 128000 },
      { id: 'o1', name: 'o1', provider: 'openai', type: 'chat', maxTokens: 100000, contextWindow: 200000 },
      { id: 'o3-mini', name: 'o3 Mini', provider: 'openai', type: 'chat', maxTokens: 100000, contextWindow: 200000 },
      { id: 'text-embedding-3-small', name: 'Embedding 3 Small', provider: 'openai', type: 'embedding', maxTokens: 8191, contextWindow: 8191 },
      { id: 'text-embedding-3-large', name: 'Embedding 3 Large', provider: 'openai', type: 'embedding', maxTokens: 8191, contextWindow: 8191 },
    ]
  },
  anthropic: {
    name: 'Anthropic',
    icon: '🟠',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKeyPrefix: 'sk-ant-',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', type: 'chat', maxTokens: 8192, contextWindow: 200000 },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', type: 'chat', maxTokens: 4096, contextWindow: 200000 },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', type: 'chat', maxTokens: 4096, contextWindow: 200000 },
    ]
  },
  google: {
    name: 'Google Gemini',
    icon: '🔵',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyPrefix: 'AI',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', type: 'chat', maxTokens: 8192, contextWindow: 2000000 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', type: 'chat', maxTokens: 8192, contextWindow: 1000000 },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', type: 'chat', maxTokens: 8192, contextWindow: 1000000 },
      { id: 'text-embedding-004', name: 'Text Embedding', provider: 'google', type: 'embedding', maxTokens: 2048, contextWindow: 2048 },
    ]
  },
  groq: {
    name: 'Groq',
    icon: '⚡',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyPrefix: 'gsk_',
    apiKeyUrl: 'https://console.groq.com/keys',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq', type: 'chat', maxTokens: 32768, contextWindow: 128000 },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq', type: 'chat', maxTokens: 32768, contextWindow: 32768 },
    ]
  },
  mistral: {
    name: 'Mistral AI',
    icon: '🟣',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKeyPrefix: '',
    apiKeyUrl: 'https://console.mistral.ai/api-keys/',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', type: 'chat', maxTokens: 8192, contextWindow: 128000 },
      { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'mistral', type: 'chat', maxTokens: 8192, contextWindow: 32000 },
      { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'mistral', type: 'chat', maxTokens: 8192, contextWindow: 32000 },
    ]
  },
  ollama: {
    name: 'Ollama (Local)',
    icon: '🦙',
    baseUrl: 'http://localhost:11434/v1',
    apiKeyPrefix: '',
    apiKeyUrl: 'http://localhost:11434',
    models: [
      { id: 'llama3.2', name: 'Llama 3.2', provider: 'ollama', type: 'chat', maxTokens: 8192, contextWindow: 128000 },
      { id: 'mistral', name: 'Mistral', provider: 'ollama', type: 'chat', maxTokens: 8192, contextWindow: 32000 },
      { id: 'codellama', name: 'Code Llama', provider: 'ollama', type: 'chat', maxTokens: 4096, contextWindow: 16000 },
      { id: 'nomic-embed-text', name: 'Nomic Embed', provider: 'ollama', type: 'embedding', maxTokens: 8192, contextWindow: 8192 },
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    icon: '🔀',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyPrefix: 'sk-or-',
    apiKeyUrl: 'https://openrouter.ai/keys',
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)', provider: 'openrouter', type: 'chat', maxTokens: 16384, contextWindow: 128000 },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (via OR)', provider: 'openrouter', type: 'chat', maxTokens: 8192, contextWindow: 200000 },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Free', provider: 'openrouter', type: 'chat', maxTokens: 8192, contextWindow: 1000000 },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (via OR)', provider: 'openrouter', type: 'chat', maxTokens: 32768, contextWindow: 128000 },
    ]
  },
};

// ---- AI Provider Adapter Class ----
export class AIProviderAdapter {
  private providers: Record<string, AIProviderConfig> = {};

  constructor() {
    this.loadProviders();
  }

  private loadProviders() {
    try {
      const stored = localStorage.getItem('onb_providers');
      if (stored) {
        this.providers = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load providers:', e);
    }
  }

  private saveProviders() {
    localStorage.setItem('onb_providers', JSON.stringify(this.providers));
  }

  getProvider(id: string): AIProviderConfig | undefined {
    return this.providers[id];
  }

  getAllProviders(): AIProviderConfig[] {
    return Object.values(this.providers);
  }

  getConfiguredProviders(): AIProviderConfig[] {
    return Object.values(this.providers).filter(p => p.status === 'configured');
  }

  getAvailableModels(): AIModel[] {
    const models: AIModel[] = [];
    for (const provider of Object.values(this.providers)) {
      if (provider.status === 'configured') {
        models.push(...provider.models);
      }
    }
    return models;
  }

  getChatModels(): AIModel[] {
    return this.getAvailableModels().filter(m => m.type === 'chat');
  }

  getEmbeddingModels(): AIModel[] {
    return this.getAvailableModels().filter(m => m.type === 'embedding');
  }

  setProvider(id: string, config: Partial<AIProviderConfig>) {
    const def = PROVIDER_DEFINITIONS[id];
    if (!def) throw new Error(`Unknown provider: ${id}`);
    
    this.providers[id] = {
      id,
      name: def.name,
      icon: def.icon,
      baseUrl: config.baseUrl || def.baseUrl,
      apiKey: config.apiKey || '',
      models: def.models,
      status: config.apiKey ? 'configured' : 'unconfigured',
      lastValidated: config.lastValidated,
    };
    this.saveProviders();
  }

  removeProvider(id: string) {
    delete this.providers[id];
    this.saveProviders();
  }

  // ---- Chat Completion ----
  async chat(
    providerId: string,
    modelId: string,
    messages: { role: string; content: string }[],
    options: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      stream?: boolean;
      onChunk?: (chunk: string) => void;
    } = {}
  ): Promise<string> {
    const provider = this.providers[providerId];
    if (!provider) throw new Error(`Provider ${providerId} not configured`);
    
    const apiKey = decryptKey(provider.apiKey);
    if (!apiKey && providerId !== 'ollama') {
      throw new Error(`API key not set for ${provider.name}`);
    }

    // Build full messages with system prompt
    const fullMessages = options.systemPrompt 
      ? [{ role: 'system', content: options.systemPrompt }, ...messages]
      : messages;

    // Route to appropriate provider
    switch (providerId) {
      case 'anthropic':
        return this.callAnthropic(apiKey, modelId, fullMessages, options);
      case 'google':
        return this.callGemini(apiKey, modelId, fullMessages, options);
      default:
        return this.callOpenAICompatible(provider.baseUrl, apiKey, modelId, fullMessages, options);
    }
  }

  // ---- OpenAI Compatible (works for OpenAI, Groq, Mistral, Ollama, OpenRouter) ----
  private async callOpenAICompatible(
    baseUrl: string,
    apiKey: string,
    model: string,
    messages: { role: string; content: string }[],
    options: { temperature?: number; maxTokens?: number; stream?: boolean; onChunk?: (chunk: string) => void }
  ): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      stream: options.stream ?? false,
    };
    if (options.maxTokens) body.max_tokens = options.maxTokens;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error (${response.status}): ${err}`);
    }

    if (options.stream && options.onChunk && response.body) {
      return this.handleStream(response, options.onChunk);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // ---- Anthropic ----
  private async callAnthropic(
    apiKey: string,
    model: string,
    messages: { role: string; content: string }[],
    options: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
        system: systemMsg?.content,
        messages: chatMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  // ---- Google Gemini ----
  private async callGemini(
    apiKey: string,
    model: string,
    messages: { role: string; content: string }[],
    options: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const contents = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens || 8192,
      },
    };
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // ---- Stream Handler ----
  private async handleStream(response: Response, onChunk: (chunk: string) => void): Promise<string> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onChunk(content);
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    return fullText;
  }

  // ---- Embeddings ----
  async embed(providerId: string, modelId: string, texts: string[]): Promise<number[][]> {
    const provider = this.providers[providerId];
    if (!provider) throw new Error(`Provider ${providerId} not configured`);
    
    const apiKey = decryptKey(provider.apiKey);

    if (providerId === 'ollama') {
      return this.embedOllama(modelId, texts);
    }

    if (providerId === 'google') {
      return this.embedGemini(apiKey, modelId, texts);
    }

    // OpenAI compatible embedding
    const response = await fetch(`${provider.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: modelId, input: texts }),
    });

    if (!response.ok) {
      throw new Error(`Embedding Error: ${await response.text()}`);
    }

    const data = await response.json();
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  }

  private async embedOllama(model: string, texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: text }),
      });
      const data = await response.json();
      results.push(data.embedding);
    }
    return results;
  }

  private async embedGemini(apiKey: string, model: string, texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            content: { parts: [{ text }] },
          }),
        }
      );
      const data = await response.json();
      results.push(data.embedding.values);
    }
    return results;
  }

  // ---- Validation ----
  async validateProvider(providerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const provider = this.providers[providerId];
      if (!provider) return { success: false, error: 'Provider not found' };

      const apiKey = decryptKey(provider.apiKey);
      if (!apiKey && providerId !== 'ollama') {
        return { success: false, error: 'API key not set' };
      }

      // Try a simple request
      if (providerId === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      } else if (providerId === 'ollama') {
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) throw new Error('Ollama not running');
      } else {
        const response = await fetch(`${provider.baseUrl}/models`, {
          headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      }

      provider.status = 'configured';
      provider.lastValidated = new Date().toISOString();
      this.saveProviders();
      return { success: true };
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      return { success: false, error };
    }
  }
}

// Singleton instance
export const aiAdapter = new AIProviderAdapter();
