import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import type { AppUser } from '../store/useAppStore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAppStore } from '../store/useAppStore';
import { LogIn, Mail, Lock, AlertCircle, Sun, Moon } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setUser = useAppStore(state => state.setUser);
  const { theme, setTheme } = useAppStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      window.history.replaceState(null, '', '/');
      setUser(userCredential.user as unknown as AppUser);
    } catch (err) {
      const error = err as Error & { code?: string };
      console.error(error);
      let msg = error.message || 'Erro ao realizar login';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        msg = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'E-mail inválido.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      {/* Theme Toggle Switch */}
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed top-6 right-6 p-3 rounded-full bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-md hover:scale-105 active:scale-95 transition-all text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer z-50"
        title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
      >
        {theme === 'dark' ? (
          <Sun size={20} className="text-yellow-400 fill-yellow-400 animate-in spin duration-300" />
        ) : (
          <Moon size={20} className="text-slate-600 fill-slate-100 animate-in spin duration-300" />
        )}
      </button>

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <img src={theme === 'dark' ? '/logo_branca.png' : '/logo.png'} alt="Arbolia Logo" className="h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bem-vindo ao Sistema Arbolia</h1>
          <p className="text-slate-500 text-sm mt-1">Gestão inteligente de arborização urbana</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 relative overflow-hidden">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm animate-in shake duration-300">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@arbolia.com.br"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 placeholder-slate-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 placeholder-slate-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Entrar no Sistema
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-xs text-slate-400">
              Esqueceu sua senha? Entre em contato com o suporte.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-8 uppercase tracking-widest font-bold">
          Arbolia v2.0 • Sistema de Gestão Premium
        </p>
      </div>
    </div>
  );
}
