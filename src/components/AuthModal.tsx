import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Building,
  LogIn,
  UserPlus,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    loginDemo,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name, companyName);
      }
      onClose();
    } catch {
      // Handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    clearAuthError();
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch {
      // Handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    clearAuthError();
    setLoading(true);
    try {
      await loginDemo();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in duration-200 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Acesso ao OrçaFácil IA</h3>
              <p className="text-xs text-slate-400">
                {mode === 'login' ? 'Entre na sua conta para gerenciar orçamentos' : 'Crie sua conta corporativa'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-[11px] text-blue-900 font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Isolamento Total: os dados da sua empresa são confidenciais e exclusivos da sua conta.</span>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar com Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-2 text-[10px] uppercase font-bold text-slate-400 absolute">
              ou com e-mail
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Seu Nome Completo</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome da Empresa</label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Silva Instalações e Reformas"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@empresa.com.br"
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {authError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{loading ? 'Processando...' : mode === 'login' ? 'Entrar no OrçaFácil' : 'Criar Conta Corporativa'}</span>
            </button>
          </form>

          {/* Mode Switch */}
          <div className="pt-2 text-center text-xs text-slate-500">
            {mode === 'login' ? (
              <p>
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearAuthError();
                    setMode('register');
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Cadastre sua empresa
                </button>
              </p>
            ) : (
              <p>
                Já possui conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearAuthError();
                    setMode('login');
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Fazer login
                </button>
              </p>
            )}
          </div>

          {/* Quick Demo Access button */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleDemo}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline"
            >
              Ou continue no Modo Demonstração (Sem login)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
