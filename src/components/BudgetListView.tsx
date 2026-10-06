import React, { useState } from 'react';
import { Budget, BudgetStatus, CompanySettings } from '../types/budget';
import { formatBRL, formatDateBR, generateBudgetPDF } from '../lib/pdfGenerator';
import { generateWhatsAppMessage, openWhatsAppChat } from '../lib/whatsapp';
import {
  Search,
  Filter,
  FileText,
  Eye,
  Edit,
  Copy,
  Trash2,
  FileDown,
  MessageCircle,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
} from 'lucide-react';

interface BudgetListViewProps {
  budgets: Budget[];
  companySettings: CompanySettings;
  onOpenBudget: (budget: Budget) => void;
  onEditBudget: (budget: Budget) => void;
  onDuplicateBudget: (budget: Budget) => void;
  onDeleteBudget: (budgetId: string) => Promise<void>;
  onStatusChange: (budgetId: string, status: BudgetStatus) => Promise<void>;
  onNewBudget: () => void;
}

export const BudgetListView: React.FC<BudgetListViewProps> = ({
  budgets,
  companySettings,
  onOpenBudget,
  onEditBudget,
  onDuplicateBudget,
  onDeleteBudget,
  onStatusChange,
  onNewBudget,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  const filteredBudgets = budgets.filter((b) => {
    const matchesSearch =
      (b.budgetNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.serviceDescription || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: BudgetStatus) => {
    switch (status) {
      case 'approved':
        return { label: 'Aprovado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'pending':
        return { label: 'Aguardando', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'sent':
        return { label: 'Enviado', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'rejected':
        return { label: 'Recusado', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'expired':
        return { label: 'Expirado', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'canceled':
        return { label: 'Cancelado', color: 'bg-gray-100 text-gray-700 border-gray-200' };
      case 'draft':
      default:
        return { label: 'Rascunho', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const handleDownloadPDF = (b: Budget, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = generateBudgetPDF(b, companySettings);
    doc.save(`${b.budgetNumber || 'orcamento'}.pdf`);
  };

  const handleSendWhatsApp = (b: Budget, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = generateWhatsAppMessage(b, companySettings);
    openWhatsAppChat(b.clientWhatsapp || b.clientPhone, msg);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Histórico de Orçamentos</h2>
          <p className="text-xs text-slate-500">
            Gerencie todas as propostas comerciais geradas para seus clientes
          </p>
        </div>

        <button
          onClick={onNewBudget}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-600/30 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Orçamento</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número, cliente ou serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {[
            { id: 'all', label: 'Todos' },
            { id: 'approved', label: 'Aprovados' },
            { id: 'pending', label: 'Aguardando' },
            { id: 'sent', label: 'Enviados' },
            { id: 'draft', label: 'Rascunhos' },
            { id: 'rejected', label: 'Recusados' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === st.id
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budgets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredBudgets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Nenhum orçamento encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros ou a busca para visualizar outros resultados.'
                : 'Você ainda não possui orçamentos cadastrados. Crie o primeiro com a IA!'}
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <button
                onClick={onNewBudget}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Orçamento</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 w-36">Número</th>
                  <th className="py-3 px-4 min-w-[160px]">Cliente</th>
                  <th className="py-3 px-4 min-w-[220px]">Serviço</th>
                  <th className="py-3 px-4 w-28 text-center">Data</th>
                  <th className="py-3 px-4 w-28 text-right">Valor Total</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-36 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBudgets.map((b) => {
                  const badge = getStatusBadge(b.status);
                  return (
                    <tr
                      key={b.id}
                      onClick={() => onOpenBudget(b)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">
                        {b.budgetNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                          {b.clientName || 'Cliente sem nome'}
                        </span>
                        {b.clientWhatsapp && (
                          <span className="text-[11px] text-slate-400 block">{b.clientWhatsapp}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 block line-clamp-1">
                          {b.title}
                        </span>
                        <span className="text-[11px] text-slate-400 block line-clamp-1">
                          {b.serviceLocation}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-medium">
                        {formatDateBR(b.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                        {formatBRL(b.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenBudget(b)}
                            title="Visualizar Proposta"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditBudget(b)}
                            title="Editar Orçamento"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDownloadPDF(b, e)}
                            title="Baixar PDF"
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleSendWhatsApp(b, e)}
                            title="Enviar WhatsApp"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDuplicateBudget(b)}
                            title="Duplicar Orçamento"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente excluir o orçamento ${b.budgetNumber}?`)) {
                                onDeleteBudget(b.id!);
                              }
                            }}
                            title="Excluir"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
