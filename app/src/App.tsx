import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Home } from './pages/Home';
import { Inventory } from './pages/Inventory';
import { Clients } from './pages/Clients';
import { Alerts } from './pages/Alerts';
import { Acervo } from './pages/Acervo';
import { ServiceLog } from './pages/ServiceLog';
import { Employees } from './pages/Employees';
import { Login } from './pages/Login';

import { PostServiceModal } from './components/inventory/PostServiceModal';
import { LaudoAvaliacaoModal } from './components/inventory/LaudoAvaliacaoModal';
import { ServiceModal } from './components/inventory/ServiceModal';
import { UserProfileModal } from './components/layout/UserProfileModal';
import { SettingsModal } from './components/layout/SettingsModal';

import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAppStore();
  if (!userProfile) return null;
  if (userProfile.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  const { user, setUser, initializeData, theme } = useAppStore();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Efeito do Dark Mode
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  // Limpa a URL para a raiz ao fazer logout ou quando não houver usuário autenticado
  useEffect(() => {
    if (!checkingAuth && !user && window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
  }, [user, checkingAuth]);

  useEffect(() => {
    // Escuta mudanças de estado de autenticação do Firebase (inclui a inicial)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setCheckingAuth(false);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setUser(firebaseUser as any);
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout de inicialização')), 12000)
          );
          await Promise.race([initializeData(), timeoutPromise]);
        } catch (err) {
          console.error('Erro ao inicializar dados no Firebase:', err);
        } finally {
          setCheckingAuth(false);
        }
      }
    });

    return () => unsubscribe();
  }, [setUser, initializeData]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inventario" element={<Inventory />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/alertas" element={<Alerts />} />
          <Route path="/acervo" element={<Acervo />} />
          <Route path="/historico" element={<ServiceLog />} />
          <Route path="/funcionarios" element={<AdminRoute><Employees /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ServiceModal />
        <PostServiceModal />
        <LaudoAvaliacaoModal />
        <UserProfileModal />
        <SettingsModal />
      </MainLayout>
    </Router>
  );
}

export default App;

