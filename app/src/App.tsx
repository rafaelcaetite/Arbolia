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
import { supabase } from './lib/supabase';

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
    // 1. Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });

    // 2. Ouve mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (user) {
      initializeData();
    }
  }, [user, initializeData]);

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

