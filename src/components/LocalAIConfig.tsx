import { useState, useEffect } from 'react';
import { localAI, LOCAL_MODELS, LocalModel } from '../lib/local-ai';
import { Download, Check, Loader2, Trash2, Cpu, Wifi, WifiOff } from 'lucide-react';

export function LocalAIConfig() {
  const [models, setModels] = useState<LocalModel[]>(LOCAL_MODELS);
  const [loadingModel, setLoadingModel] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Monitorar status de conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar modelos já carregados
    const loadedModels = models.map(m => ({
      ...m,
      downloaded: localAI.isModelLoaded(m.id),
    }));
    setModels(loadedModels);

    // Assinar progresso de download
    const unsubscribe = localAI.onProgress(({ model, progress }) => {
      setDownloadProgress(prev => ({ ...prev, [model]: progress }));
    });

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLoadModel = async (modelId: string) => {
    setLoadingModel(modelId);
    try {
      await localAI.loadModel(modelId, (progress) => {
        setDownloadProgress(prev => ({ ...prev, [modelId]: progress }));
      });
      
      setModels(prev => prev.map(m => 
        m.id === modelId ? { ...m, downloaded: true } : m
      ));
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
      alert('Erro ao carregar modelo. Verifique sua conexão e tente novamente.');
    } finally {
      setLoadingModel(null);
    }
  };

  const handleUnloadModel = (modelId: string) => {
    localAI.unloadModel(modelId);
    setModels(prev => prev.map(m => 
      m.id === modelId ? { ...m, downloaded: false } : m
    ));
    setDownloadProgress(prev => {
      const next = { ...prev };
      delete next[modelId];
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Status de Conexão */}
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${
        isOnline 
          ? 'bg-green-500/10 border-green-500/30 text-green-400' 
          : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
      }`}>
        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        <span className="text-sm">
          {isOnline 
            ? 'Online - Você pode baixar novos modelos' 
            : 'Offline - Usando apenas modelos já baixados'}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Cpu className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-200">
            <p className="font-semibold mb-1">IA Local no Navegador</p>
            <p className="text-xs text-purple-300">
              Modelos rodam diretamente no seu dispositivo usando WebAssembly. 
              Funciona offline após o download inicial. Sem API key, sem custos, total privacidade.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Modelos */}
      <div className="space-y-3">
        {models.map((model) => {
          const isLoading = loadingModel === model.id;
          const progress = downloadProgress[model.id] || 0;

          return (
            <div
              key={model.id}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    {model.name}
                    {model.downloaded && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{model.description}</p>
                  <p className="text-xs text-slate-500 mt-1">Tamanho: {model.size}</p>
                </div>

                <div className="flex-shrink-0">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                      <span className="text-xs text-slate-400">{progress}%</span>
                    </div>
                  ) : model.downloaded ? (
                    <button
                      onClick={() => handleUnloadModel(model.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      title="Descarregar modelo"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs">Descarregar</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLoadModel(model.id)}
                      disabled={!isOnline}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-purple-400 rounded-lg transition-colors"
                      title="Baixar modelo"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-xs">Baixar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Barra de Progresso */}
              {isLoading && (
                <div className="mt-3">
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dicas */}
      <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">💡 Dicas</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Baixe modelos quando estiver em Wi-Fi</li>
          <li>• Modelos ficam cacheados no navegador</li>
          <li>• Use "Qwen 2.5 0.5B" para dispositivos com pouca memória</li>
          <li>• "MiniLM Embeddings" é essencial para busca vetorial</li>
          <li>• Descarregue modelos não utilizados para liberar memória</li>
        </ul>
      </div>
    </div>
  );
}
