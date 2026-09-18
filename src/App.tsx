import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Dashboard } from './components/Dashboard';
import { NotebookView } from './components/NotebookView';
import { Settings } from './components/Settings';
import { Onboarding } from './components/Onboarding';
import { Toast } from './components/Toast';

export default function App() {
  const { currentPage, settings, loadState } = useStore();

  useEffect(() => {
    loadState();
  }, [loadState]);

  const renderPage = () => {
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-bg-primary text-text-primary flex flex-col">
      {renderPage()}
      <Toast />
    </div>
  );
}
