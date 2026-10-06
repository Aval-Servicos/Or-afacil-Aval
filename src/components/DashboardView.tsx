import React from 'react';
import { Budget, CompanySettings } from '../types/budget';
import { formatBRL, formatDateBR } from '../lib/pdfGenerator';
import {
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Plus,
  Eye,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface DashboardViewProps {
  budgets: Budget[];
  companySettings?: CompanySettings | null;
  onNewBudget: () => void;
  onOpenBudget: (budget: Budget) => void;
  onViewAllBudgets: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  budgets,
  companySettings,
  onNewBudget,
  onOpenBudget,
  onViewAllBudgets,
}) => {
  // Compute KPI metrics
  const totalBudgets = budgets.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthBudgets = budgets.filter((b) => {
    if (!b.createdAt) return false;
    const d = new Date(b.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const approvedBudgets = budgets.filter((b) => b.status === 'approved');
  const pendingBudgets = budgets.filter((b) => b.status === 'pending' || b.status === 'sent');
  const rejectedBudgets = budgets.filter((b) => b.status === 'rejected');

  const totalValue = budgets.reduce((acc, b) => acc + (b.total || 0), 0);
  const approvedValue = approvedBudgets.reduce((acc, b) => acc + (b.total || 0), 0);

  const approvalRate = totalBudgets > 0 ? Math.round((approvedBudgets.length / totalBudgets) * 100) : 0;

  // Monthly breakdown for visual charts (last 6 months)
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthlyData: { month: string; count: number; value: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const matches = budgets.filter((b) => {
      if (!b.createdAt) return false;
      const bd = new Date(b.createdAt);
      return bd.getMonth() === m && bd.getFullYear() === y;
    });
    const val = matches.reduce((acc, b) => acc + (b.total || 0), 0);
    monthlyData.push({
      month: `${monthNames[m]}/${String(y).slice(-2)}`,
      count: matches.length,
      value: val,
    });
  }

  const maxMonthlyVal = Math.max(...monthlyData.map((d) => d.value), 1000);

  const recentBudgets = budgets.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Orçamentos Inteligentes em Segundos</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Olá, {companySettings?.responsibleName?.split(' ')[0] || 'Empresário'}!
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Seu assistente comercial para cotação em tempo real com fontes de preços brasileiras no Google Search e geração de propostas profissionais.
          </p>
        </div>

        <button
          onClick={onNewBudget}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Orçamento</span>
        </button>
      </div>

      {/* KPI Cards (Section 15: Totais) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Orçamentos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalBudgets}</div>
          <p className="text-[10px] text-slate-400">Propostas criadas</p>
        </div>

        {/* Orçamentos deste mês */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Este Mês</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{thisMonthBudgets.length}</div>
          <p className="text-[10px] text-slate-400">Neste mês vigente</p>
        </div>

        {/* Aprovados */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Aprovados</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{approvedBudgets.length}</div>
          <p className="text-[10px] text-emerald-600/80">{formatBRL(approvedValue)}</p>
        </div>

        {/* Pendentes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pendentes</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{pendingBudgets.length}</div>
          <p className="text-[10px] text-amber-600/80">Em negociação</p>
        </div>

        {/* Valor Total Orçado */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Orçado</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 truncate">
            {formatBRL(totalValue)}
          </div>
          <p className="text-[10px] text-slate-400">Volume emitido</p>
        </div>

        {/* Taxa de Aprovação */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Conversão</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">{approvalRate}%</div>
          <p className="text-[10px] text-slate-400">Taxa de aprovação</p>
        </div>
      </div>

      {/* Charts Section (Section 16: Gráficos simples) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Volume Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Volume Orçado por Mês (R$)</h3>
            </div>
            <span className="text-xs text-slate-400">Últimos 6 meses</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
            {monthlyData.map((d, idx) => {
              const heightPct = Math.max(8, Math.round((d.value / maxMonthlyVal) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatBRL(d.value)}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[42px] bg-blue-600 group-hover:bg-blue-500 rounded-t-md transition-all shadow-xs"
                  ></div>
                  <span className="text-[11px] font-medium text-slate-500">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Status das Propostas</h3>
              <span className="text-xs text-slate-400">{totalBudgets} total</span>
            </div>

            <div className="space-y-3">
              {/* Aprovados */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Aprovados
                  </span>
                  <span className="text-slate-700">{approvedBudgets.length}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${totalBudgets ? (approvedBudgets.length / totalBudgets) * 100 : 0}%` }}
                    className="bg-emerald-500 h-full rounded-full"
                  ></div>
                </div>
              </div>

              {/* Pendentes */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Aguardando Resposta
                  </span>
                  <span className="text-slate-700">{pendingBudgets.length}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${totalBudgets ? (pendingBudgets.length / totalBudgets) * 100 : 0}%` }}
                    className="bg-amber-500 h-full rounded-full"
                  ></div>
                </div>
              </div>

              {/* Recusados */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-rose-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Recusados
                  </span>
                  <span className="text-slate-700">{rejectedBudgets.length}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${totalBudgets ? (rejectedBudgets.length / totalBudgets) * 100 : 0}%` }}
                    className="bg-rose-500 h-full rounded-full"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
            💡 <strong>Dica Pro:</strong> Propostas enviadas pelo WhatsApp no mesmo dia têm taxa de fechamento até 45% maior.
          </div>
        </div>
      </div>

      {/* Recent Budgets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Orçamentos Recentes</h3>
          </div>
          <button
            onClick={onViewAllBudgets}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentBudgets.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhum orçamento cadastrado ainda. Clique em "Criar Novo Orçamento" para começar!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-4 w-32">Número</th>
                  <th className="py-2.5 px-4">Cliente</th>
                  <th className="py-2.5 px-4">Serviço</th>
                  <th className="py-2.5 px-4 w-24 text-center">Data</th>
                  <th className="py-2.5 px-4 w-28 text-right">Total</th>
                  <th className="py-2.5 px-4 w-24 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBudgets.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => onOpenBudget(b)}
                    className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {b.budgetNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 truncate max-w-[150px]">
                      {b.clientName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[220px]">
                      {b.title}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">
                      {formatDateBR(b.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatBRL(b.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBudget(b);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        title="Ver Proposta"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
