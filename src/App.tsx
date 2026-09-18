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
    // Mostrar tela de login se não estiver autenticado
    if (!user) {
      return <AuthPage />;
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
