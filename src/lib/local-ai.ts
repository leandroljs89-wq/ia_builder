/**
 * Local AI Provider - Transformers.js + Free APIs
 * Roda modelos de IA diretamente no navegador/celular sem API key
 * Suporta tanto IA local (offline) quanto APIs gratuitas (online)
 */

import { pipeline, env } from '@huggingface/transformers';

// Configurar para usar cache do navegador
env.allowLocalModels = false;
env.useBrowserCache = true;

// APIs gratuitas que não precisam de API key
export const FREE_APIS = [
  {
    id: 'huggingface-free',
    name: 'Hugging Face (Gratuito)',
    description: 'API gratuita do Hugging Face - sem API key',
    baseUrl: 'https://api-inference.huggingface.co/models',
    models: [
      { id: 'microsoft/DialoGPT-large', name: 'DialoGPT Large', type: 'chat' },
      { id: 'facebook/blenderbot-400M-distill', name: 'BlenderBot 400M', type: 'chat' },
    ],
  },
];

export interface LocalModel {
  id: string;
  name: string;
  description: string;
  size: string;
  type: 'text-generation' | 'feature-extraction';
  downloaded: boolean;
}

export const LOCAL_MODELS: LocalModel[] = [
  {
    id: 'Xenova/Qwen2.5-0.5B-Instruct',
    name: 'Qwen 2.5 0.5B',
    description: 'Modelo leve e rápido, ideal para celular',
    size: '~500MB',
    type: 'text-generation',
    downloaded: false,
  },
  {
    id: 'Xenova/Phi-3-mini-4k-instruct',
    name: 'Phi-3 Mini',
    description: 'Modelo da Microsoft, bom equilíbrio',
    size: '~1.5GB',
    type: 'text-generation',
    downloaded: false,
  },
  {
    id: 'Xenova/all-MiniLM-L6-v2',
    name: 'MiniLM Embeddings',
    description: 'Para embeddings e busca vetorial',
    size: '~80MB',
    type: 'feature-extraction',
    downloaded: false,
  },
];

class LocalAIProvider {
  private generators: Map<string, any> = new Map();
  private downloadProgress: Map<string, number> = new Map();
  private listeners: Set<(progress: { model: string; progress: number }) => void> = new Set();

  /**
   * Adicionar listener para progresso de download
   */
  onProgress(callback: (progress: { model: string; progress: number }) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Baixar e carregar modelo
   */
  async loadModel(modelId: string, onProgress?: (progress: number) => void): Promise<void> {
    if (this.generators.has(modelId)) {
      return; // Já carregado
    }

    const model = LOCAL_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Modelo ${modelId} não encontrado`);
    }

    try {
      const generator = await pipeline(model.type, modelId, {
        progress_callback: (progress: any) => {
          if (progress.status === 'progress' && progress.progress) {
            const percent = Math.round(progress.progress);
            this.downloadProgress.set(modelId, percent);
            onProgress?.(percent);
            this.notifyListeners(modelId, percent);
          }
        },
      });

      this.generators.set(modelId, generator);
      model.downloaded = true;
      this.downloadProgress.set(modelId, 100);
      this.notifyListeners(modelId, 100);
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
      throw error;
    }
  }

  /**
   * Gerar texto com modelo local
   */
  async generate(
    modelId: string,
    prompt: string,
    options: {
      max_tokens?: number;
      temperature?: number;
      top_p?: number;
    } = {}
  ): Promise<string> {
    const generator = this.generators.get(modelId);
    if (!generator) {
      throw new Error(`Modelo ${modelId} não carregado. Chame loadModel primeiro.`);
    }

    const output = await generator(prompt, {
      max_new_tokens: options.max_tokens || 256,
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.9,
      do_sample: true,
    });

    return output[0]?.generated_text || '';
  }

  /**
   * Gerar embeddings com modelo local
   */
  async embed(modelId: string, texts: string[]): Promise<number[][]> {
    const generator = this.generators.get(modelId);
    if (!generator) {
      throw new Error(`Modelo ${modelId} não carregado. Chame loadModel primeiro.`);
    }

    const embeddings: number[][] = [];
    for (const text of texts) {
      const output = await generator(text, {
        pooling: 'mean',
        normalize: true,
      });
      embeddings.push(Array.from(output.data));
    }

    return embeddings;
  }

  /**
   * Verificar se modelo está carregado
   */
  isModelLoaded(modelId: string): boolean {
    return this.generators.has(modelId);
  }

  /**
   * Obter progresso de download
   */
  getDownloadProgress(modelId: string): number {
    return this.downloadProgress.get(modelId) || 0;
  }

  /**
   * Descarregar modelo para liberar memória
   */
  unloadModel(modelId: string): void {
    this.generators.delete(modelId);
    this.downloadProgress.delete(modelId);
    const model = LOCAL_MODELS.find(m => m.id === modelId);
    if (model) {
      model.downloaded = false;
    }
  }

  /**
   * Usar API gratuita online (sem API key)
   */
  async useFreeAPI(
    apiUrl: string,
    prompt: string,
    options: { max_tokens?: number; temperature?: number } = {}
  ): Promise<string> {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: options.max_tokens || 256,
            temperature: options.temperature || 0.7,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Hugging Face retorna array com generated_text
      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text;
      }
      
      return JSON.stringify(data);
    } catch (error) {
      console.error('Erro ao usar API gratuita:', error);
      throw error;
    }
  }

  /**
   * Notificar listeners sobre progresso
   */
  private notifyListeners(modelId: string, progress: number) {
    this.listeners.forEach(callback => {
      callback({ model: modelId, progress });
    });
  }
}

// Instância singleton
export const localAI = new LocalAIProvider();
