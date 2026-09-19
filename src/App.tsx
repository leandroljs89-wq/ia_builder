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
import type { User } from '@supabase/supabase-js';

export default function App() {
  const { currentPage, settings, loadState, showToast, setPage } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Verificar sessão atual do Supabase
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

      loadState();
      
      // Run migrations to update deprecated models
      const { migrated, changes } = runMigrations();
      if (migrated && changes.length > 0) {
        // Reload state after migration
        loadState();
        showToast('info', 'Modelos atualizados automaticamente');
      }

      // Register service worker for PWA
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration failed, continue without PWA features
          });
        });
      }

      return () => subscription.unsubscribe();
    } catch (err) {
      console.error('Erro ao inicializar app:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLoading(false);
    }
  }, [loadState, showToast]);

  // Tela de loading
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-primary text-text-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-primary text-text-primary p-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Ops! Algo deu errado</h1>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  // Tela de login (opcional)
  if (!user) {
    return <AuthPage />;
  }

  const renderPage = () => {
    try {
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
    } catch (err) {
      console.error('Erro ao renderizar página:', err);
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-text-secondary">Erro ao carregar página</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-accent text-white rounded-lg"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
  };

  const handleOpenSettings = () => {
    setPage('settings');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      showToast('success', 'Logout realizado com sucesso');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      showToast('error', 'Erro ao fazer logout');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-bg-primary text-text-primary flex">
      {/* Sidebar */}
      {settings.onboardingComplete && (
        <Sidebar onOpenSettings={handleOpenSettings} user={user} onLogout={handleLogout} />
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderPage()}
      </div>
      
      <Toast />
    </div>
  );
}
