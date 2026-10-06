import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  PlusCircle,
  Users,
  Settings,
  LayoutDashboard,
  LogOut,
  LogIn,
  Building2,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: () => void;
  budgetCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  budgetCount = 0,
}) => {
  const { user, companySettings, logout, isDemoUser } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-budget', label: 'Novo Orçamento', icon: PlusCircle, highlight: true },
    { id: 'budgets', label: 'Orçamentos', icon: FileText, badge: budgetCount > 0 ? String(budgetCount) : undefined },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'settings', label: 'Config. Empresa', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 font-black text-xl">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-lg tracking-tight">OrçaFácil</span>
              <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-400/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> IA
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[150px]">
              {companySettings?.name || 'Gestão de Orçamentos'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : item.highlight
                  ? 'text-blue-300 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Company preview in bottom */}
      {companySettings && (
        <div className="mx-3 my-2 p-3 bg-slate-800/60 rounded-lg border border-slate-700/50 text-xs text-slate-300">
          <div className="flex items-center gap-2 mb-1 text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-200 truncate">{companySettings.name}</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {companySettings.city} - {companySettings.state}
          </div>
          <div className="text-[10px] text-blue-400 font-medium mt-1">
            Margem Padrão: {companySettings.defaultMargin}%
          </div>
        </div>
      )}

      {/* User / Auth footer */}
      <div className="p-3 border-t border-slate-800">
        {user ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {user.displayName || user.email || 'Usuário'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {isDemoUser ? 'Modo Demonstração' : user.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-md transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Entrar / Criar Conta
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
