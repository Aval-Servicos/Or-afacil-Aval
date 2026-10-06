import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Building, UserCheck, LogIn } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNewBudget: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onNewBudget, onOpenAuth }) => {
  const { user, companySettings, isDemoUser } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {companySettings?.name && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate max-w-[200px]">{companySettings.name}</span>
          </div>
        )}

        {user ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="truncate max-w-[140px]">{user.displayName || user.email || 'Conta Ativa'}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar / Cadastrar</span>
          </button>
        )}

        <button
          onClick={onNewBudget}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Orçamento</span>
        </button>
      </div>
    </header>
  );
};
