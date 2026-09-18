import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, BookOpen, Search, Trash2, ChevronDown, Check } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { PROVIDER_DEFINITIONS } from '../lib/ai-adapter';

export function Dashboard() {
  const { notebooks, createNotebook, deleteNotebook, setPage, settings, setDefaultModel } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string; name: string }>({
    show: false,
    id: '',
    name: '',
  });

  const handleCreate = () => {
    if (newName.trim()) {
      const id = createNotebook(newName.trim(), newDesc.trim());
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      setPage('notebook', id);
    }
  };

  const filteredNotebooks = notebooks.filter(n => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const configuredProviders = Object.entries(settings.providers).filter(([_, p]) => p.status === 'configured');
  
  const currentProvider = configuredProviders.find(([id]) => id === settings.defaultProvider);
  const currentProviderDef = currentProvider ? PROVIDER_DEFINITIONS[currentProvider[0]] : null;
  const currentModel = currentProviderDef?.models.find(m => m.id === settings.defaultModel);

  const handleProviderChange = (providerId: string) => {
    const providerDef = PROVIDER_DEFINITIONS[providerId];
    if (providerDef && providerDef.models.length > 0) {
      const firstChatModel = providerDef.models.find(m => m.type === 'chat');
      if (firstChatModel) {
        setDefaultModel(providerId, firstChatModel.id);
      }
    }
    setShowProviderSelector(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border safe-top shrink-0 pl-14 lg:pl-6">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold truncate">Dashboard</h1>
          <p className="text-[10px] sm:text-xs text-text-muted">
            {notebooks.length} notebook{notebooks.length !== 1 ? 's' : ''}
            {configuredProviders.length > 0 && ` • ${configuredProviders.length} provedor${configuredProviders.length > 1 ? 'es' : ''} ativo${configuredProviders.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {configuredProviders.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowProviderSelector(!showProviderSelector)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-bg-card border border-border rounded-lg hover:border-accent/50 transition-colors"
              >
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-success rounded-full shrink-0" />
                <div className="text-left hidden sm:block">
                  <div className="text-xs text-text-primary font-medium">
                    {currentProviderDef?.icon} {currentProviderDef?.name || 'Provedor'}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {currentModel?.name || 'Modelo'}
                  </div>
                </div>
                <div className="sm:hidden">
                  <span className="text-xs text-text-primary font-medium">
                    {currentProviderDef?.icon}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-text-muted shrink-0" />
              </button>

              {showProviderSelector && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProviderSelector(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                    <div className="p-2 border-b border-border">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider px-2 py-1">
                        Selecionar Provedor
                      </p>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-1">
                      {configuredProviders.map(([id, provider]) => {
                        const providerDef = PROVIDER_DEFINITIONS[id];
                        const chatModels = providerDef?.models.filter(m => m.type === 'chat') || [];
                        const isSelected = id === settings.defaultProvider;

                        return (
                          <div key={id} className="mb-1">
                            <button
                              onClick={() => handleProviderChange(id)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                isSelected
                                  ? 'bg-accent/10 border border-accent/30'
                                  : 'hover:bg-bg-tertiary'
                              }`}
                            >
                              <span className="text-base shrink-0">{providerDef?.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-text-primary">
                                    {providerDef?.name}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-3 h-3 text-accent-light shrink-0" />
                                  )}
                                </div>
                                <div className="text-[10px] text-text-muted truncate">
                                  {chatModels.length} modelo{chatModels.length !== 1 ? 's' : ''} disponível{chatModels.length !== 1 ? 'is' : ''}
                                </div>
                              </div>
                            </button>

                            {/* Show models if this provider is selected */}
                            {isSelected && chatModels.length > 0 && (
                              <div className="ml-8 mt-1 mb-2 space-y-0.5">
                                {chatModels.slice(0, 3).map((model) => (
                                  <button
                                    key={model.id}
                                    onClick={() => {
                                      setDefaultModel(id, model.id);
                                      setShowProviderSelector(false);
                                    }}
                                    className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors ${
                                      model.id === settings.defaultModel
                                        ? 'bg-accent/20 text-accent-light font-medium'
                                        : 'text-text-secondary hover:bg-bg-tertiary'
                                    }`}
                                  >
                                    {model.name}
                                    {model.id === settings.defaultModel && (
                                      <Check className="w-3 h-3 inline ml-1" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-2 border-t border-border">
                      <button
                        onClick={() => {
                          setShowProviderSelector(false);
                          setPage('settings');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-accent-light hover:bg-bg-tertiary rounded-lg transition-colors"
                      >
                        + Configurar provedores
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Search & Create */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar notebooks..."
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium text-xs sm:text-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Notebook</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="mb-6 p-4 bg-bg-card border border-accent/30 rounded-xl animate-fade-in">
            <h3 className="text-sm font-semibold mb-3">Criar Novo Notebook</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do notebook"
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Criar
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notebooks Grid */}
        {filteredNotebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-bg-secondary rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'Nenhum notebook encontrado' : 'Nenhum notebook ainda'}
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              {searchQuery ? 'Tente outra busca' : 'Crie seu primeiro notebook para começar a pesquisar'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Criar Notebook
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredNotebooks.map((notebook) => (
              <div
                key={notebook.id}
                className="group bg-bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-accent/50 transition-all cursor-pointer animate-fade-in"
                onClick={() => setPage('notebook', notebook.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: notebook.color + '20' }}
                  >
                    {notebook.icon}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({ show: true, id: notebook.id, name: notebook.name });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-error rounded transition-all"
                    title="Excluir notebook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-sm mb-1 truncate">{notebook.name}</h3>
                {notebook.description && (
                  <p className="text-xs text-text-secondary mb-3 line-clamp-2">{notebook.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>{notebook.sources.length} fontes</span>
                  <span>•</span>
                  <span>{notebook.conversations.length} conversas</span>
                  <span>•</span>
                  <span>{notebook.notes.length} notas</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.show}
        title="Excluir Notebook"
        message={`Tem certeza que deseja excluir "${deleteConfirm.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        danger={true}
        onConfirm={() => {
          deleteNotebook(deleteConfirm.id);
          setDeleteConfirm({ show: false, id: '', name: '' });
        }}
        onCancel={() => setDeleteConfirm({ show: false, id: '', name: '' })}
      />
    </div>
  );
}
