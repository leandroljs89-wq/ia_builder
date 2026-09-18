import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, BookOpen, Settings, Search, Trash2, MoreVertical } from 'lucide-react';

export function Dashboard() {
  const { notebooks, createNotebook, deleteNotebook, setPage, settings } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const configuredProviders = Object.values(settings.providers).filter(p => p.status === 'configured');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">OpenNotebook AI</h1>
            <p className="text-xs text-text-muted">Pesquisa inteligente com multi-provider IA</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {configuredProviders.length > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-success/10 border border-success/30 rounded-full">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span className="text-xs text-success font-medium">{configuredProviders.length} provedor{configuredProviders.length > 1 ? 'es' : ''}</span>
            </div>
          )}
          <button
            onClick={() => setPage('settings')}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Search & Create */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar notebooks..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Notebook
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotebooks.map((notebook) => (
              <div
                key={notebook.id}
                className="group bg-bg-card border border-border rounded-xl p-5 hover:border-accent/50 transition-all cursor-pointer animate-fade-in"
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
                      if (confirm('Excluir este notebook?')) deleteNotebook(notebook.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-error rounded transition-all"
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
    </div>
  );
}
