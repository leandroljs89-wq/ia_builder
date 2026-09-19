import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { Dashboard } from './components/Dashboard';
import { NotebookView } from './components/NotebookView';
import { Settings } from './components/Settings';
import { Onboarding } from './components/Onboarding';
import { Toast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { AuthPage } from './components/AuthPage';
import { runMigrations } from './lib/migrations';
import { supabase } from './lib/supabase';
import './lib/test-supabase'; // Importar script de teste

export default function App() {
  const { currentPage, settings, loadState, showToast, setPage } = useStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('✅ Usuário logado:', session.user.email);
          // Carregar dados do Supabase quando logar
          loadState();
        }
      }
    );

    loadState().then(() => {
      // Run migrations to update deprecated models
      const { migrated, changes } = runMigrations();
      if (migrated && changes.length > 0) {
        // Reload state after migration
        loadState();
        showToast('info', 'Modelos atualizados automaticamente');
      }
    });

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // Service worker registration failed, continue without PWA features
        });
      });
    }

    return () => subscription.unsubscribe();
  }, [loadState, showToast]);

  const renderPage = () => {
    // Se estiver carregando, mostrar tela de loading
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-secondary">Carregando...</p>
          </div>
        </div>
      );
    }

    // Se não estiver autenticado, mostrar opção de login OU continuar sem login
    if (!user) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">OpenNotebook AI</h1>
              <p className="text-text-secondary">Pesquisa inteligente com multi-provider IA</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  // Continuar sem login (usar localStorage)
                  setUser({ id: 'local-user', email: 'local@opennotebook.ai' } as any);
                  console.log('⚠️ Modo local ativado - dados salvos apenas no navegador');
                }}
                className="w-full px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium transition-colors"
              >
                Continuar sem login
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-bg-primary text-text-muted">ou</span>
                </div>
              </div>

              <button
                onClick={() => {
                  // Mostrar tela de login
                  window.location.href = '/login';
                }}
                className="w-full px-6 py-3 bg-bg-secondary hover:bg-bg-tertiary text-text-primary border border-border rounded-lg font-medium transition-colors"
              >
                Fazer login com Supabase
              </button>
            </div>

            <p className="text-xs text-text-muted mt-6">
              💡 Sem login: dados salvos apenas neste navegador<br/>
              🔐 Com login: dados sincronizados na nuvem
            </p>
          </div>
        </div>
      );
    }

    if (!settings.onboardingComplete) {
      return <Onboarding />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'notebook':
        return <NotebookView />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const handleOpenSettings = () => {
    setPage('settings');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-bg-primary text-text-primary flex">
      {/* Sidebar */}
      {settings.onboardingComplete && (
        <Sidebar onOpenSettings={handleOpenSettings} />
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderPage()}
      </div>
      
      <Toast />
    </div>
  );
}
