import React, { useState } from 'react';
import { Budget, CompanySettings } from '../types/budget';
import { formatBRL, formatDateBR, generateBudgetPDF } from '../lib/pdfGenerator';
import { generateWhatsAppMessage, openWhatsAppChat } from '../lib/whatsapp';
import {
  FileDown,
  MessageCircle,
  Edit,
  ArrowLeft,
  Search,
  Building,
  Calendar,
  Clock,
  Printer,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { SourcesDrawer } from './SourcesDrawer';

interface BudgetDetailViewProps {
  budget: Budget;
  companySettings: CompanySettings;
  onBack: () => void;
  onEdit: (budget: Budget) => void;
  onStatusChange?: (budgetId: string, newStatus: Budget['status']) => Promise<void>;
}

export const BudgetDetailView: React.FC<BudgetDetailViewProps> = ({
  budget,
  companySettings,
  onBack,
  onEdit,
  onStatusChange,
}) => {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const materials = budget.items.filter((i) => i.type === 'material');
  const labor = budget.items.filter((i) => i.type === 'labor');

  const handleDownloadPDF = () => {
    const doc = generateBudgetPDF(budget, companySettings);
    doc.save(`${budget.budgetNumber || 'orcamento'}.pdf`);
  };

  const handleSendWhatsApp = () => {
    const msg = generateWhatsAppMessage(budget, companySettings);
    openWhatsAppChat(budget.clientWhatsapp || budget.clientPhone, msg);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: Budget['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'pending':
      case 'sent':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'rejected':
      case 'canceled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'expired':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusLabel = (status: Budget['status']) => {
    const labels: Record<string, string> = {
      draft: 'Rascunho',
      sent: 'Enviado',
      pending: 'Aguardando Resposta',
      approved: 'Aprovado',
      rejected: 'Recusado',
      expired: 'Expirado',
      canceled: 'Cancelado',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos Orçamentos</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          {onStatusChange && (
            <select
              value={budget.status}
              onChange={(e) => onStatusChange(budget.id!, e.target.value as Budget['status'])}
              className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 shadow-2xs"
            >
              <option value="draft">Rascunho</option>
              <option value="sent">Enviado</option>
              <option value="pending">Aguardando Resposta</option>
              <option value="approved">Aprovado ✅</option>
              <option value="rejected">Recusado ❌</option>
              <option value="expired">Expirado</option>
              <option value="canceled">Cancelado</option>
            </select>
          )}

          <button
            onClick={() => setSourcesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>Fontes Pesquisadas</span>
          </button>

          <button
            onClick={() => onEdit(budget)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>

          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            title="Imprimir"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm shadow-emerald-600/20 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Enviar pelo WhatsApp</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-600/30 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Gerar PDF</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (Styled like an official corporate document) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 border-b-4 border-blue-600">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="flex items-start gap-4">
              {companySettings.logoUrl && (
                <div className="w-16 h-16 rounded-xl bg-white p-1.5 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  <img
                    src={companySettings.logoUrl}
                    alt={companySettings.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <Building className="w-3.5 h-3.5" />
                  <span>Proposta Comercial & Técnica</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {companySettings.name || 'OrçaFácil IA'}
                </h2>
                {companySettings.tradeName && (
                  <p className="text-xs text-slate-300 font-medium">{companySettings.tradeName}</p>
                )}
                <div className="text-xs text-slate-400 space-y-0.5 pt-1">
                  {companySettings.cnpj && <p>CNPJ: {companySettings.cnpj} {companySettings.ie ? `| IE: ${companySettings.ie}` : ''}</p>}
                  <p>
                    {[
                      companySettings.address,
                      companySettings.number ? `nº ${companySettings.number}` : '',
                      companySettings.neighborhood,
                      companySettings.city && companySettings.state ? `${companySettings.city} - ${companySettings.state}` : '',
                    ].filter(Boolean).join(', ')}
                  </p>
                  <p>
                    {[
                      companySettings.phone ? `Tel: ${companySettings.phone}` : '',
                      companySettings.whatsapp ? `WhatsApp: ${companySettings.whatsapp}` : '',
                      companySettings.email ? `E-mail: ${companySettings.email}` : '',
                    ].filter(Boolean).join(' | ')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-right self-stretch sm:self-auto min-w-[220px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Número do Orçamento</span>
              <div className="text-lg font-black text-blue-300 font-mono">{budget.budgetNumber}</div>
              <div className="mt-2 text-xs text-slate-300 space-y-0.5">
                <p>Emissão: <span className="font-semibold text-white">{formatDateBR(budget.createdAt)}</span></p>
                <p>Validade: <span className="font-semibold text-white">{budget.validityDays} dias</span></p>
                <p>Local: <span className="font-semibold text-white">{budget.serviceLocation}</span></p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-700 flex justify-end">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${getStatusColor(budget.status)}`}>
                  {getStatusLabel(budget.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Client Info Card */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Dados do Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Nome / Razão Social:</span>
                <span className="font-bold text-slate-900 text-sm">{budget.clientName || 'Cliente'}</span>
              </div>
              {budget.clientDocument && (
                <div>
                  <span className="text-slate-400 block font-medium">CPF / CNPJ:</span>
                  <span className="font-semibold text-slate-800">{budget.clientDocument}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block font-medium">Contato:</span>
                <span className="font-semibold text-slate-800">
                  {budget.clientWhatsapp || budget.clientPhone || 'Não informado'}
                </span>
              </div>
              {budget.clientEmail && (
                <div>
                  <span className="text-slate-400 block font-medium">E-mail:</span>
                  <span className="font-semibold text-slate-800">{budget.clientEmail}</span>
                </div>
              )}
              {budget.clientAddress && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block font-medium">Local da Obra/Serviço:</span>
                  <span className="font-semibold text-slate-800">{budget.clientAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Service Title and Scope */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Descrição do Serviço
            </h3>
            <h4 className="text-lg font-bold text-slate-900">{budget.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {budget.serviceDescription || budget.promptDescription}
            </p>
          </div>

          {/* Table: MATERIAIS */}
          {materials.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Materiais e Insumos
                </h3>
                <span className="text-xs font-bold text-slate-600">
                  Subtotal: {formatBRL(budget.materialsSubtotal)}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Item / Especificação</th>
                      <th className="py-2.5 px-3 w-16 text-center">Qtd</th>
                      <th className="py-2.5 px-3 w-16 text-center">Unid</th>
                      <th className="py-2.5 px-3 w-28 text-right">Valor Unitário</th>
                      <th className="py-2.5 px-3 w-28 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materials.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block">{m.description}</span>
                          {m.notes && <span className="text-[11px] text-slate-500">{m.notes}</span>}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-700">{m.quantity}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{m.unit}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">{formatBRL(m.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatBRL(m.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table: MÃO DE OBRA */}
          {labor.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  Serviços e Mão de Obra
                </h3>
                <span className="text-xs font-bold text-slate-600">
                  Subtotal: {formatBRL(budget.laborSubtotal)}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Etapa / Serviço Especializado</th>
                      <th className="py-2.5 px-3 w-16 text-center">Qtd</th>
                      <th className="py-2.5 px-3 w-16 text-center">Unid</th>
                      <th className="py-2.5 px-3 w-28 text-right">Valor Unitário</th>
                      <th className="py-2.5 px-3 w-28 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {labor.map((l, idx) => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block">{l.description}</span>
                          {l.notes && <span className="text-[11px] text-slate-500">{l.notes}</span>}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-700">{l.quantity}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{l.unit}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">{formatBRL(l.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatBRL(l.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resumo Financeiro & Condições */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                Condições de Execução e Pagamento
              </h4>
              <div className="space-y-2">
                <p>
                  <strong className="text-slate-700">Prazo de execução estimado:</strong>{' '}
                  <span className="text-slate-900 font-semibold">{budget.executionDays} dias úteis</span>
                </p>
                <p>
                  <strong className="text-slate-700">Validade desta proposta:</strong>{' '}
                  <span className="text-slate-900 font-semibold">{budget.validityDays} dias</span>
                </p>
                <p>
                  <strong className="text-slate-700">Condições de pagamento:</strong>{' '}
                  <span className="text-slate-900 font-semibold">{budget.paymentTerms}</span>
                </p>
                {budget.notes && (
                  <div className="pt-2">
                    <strong className="text-slate-700 block mb-0.5">Observações:</strong>
                    <p className="text-slate-600 leading-relaxed">{budget.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between shadow-md">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-4">
                  Resumo Financeiro da Proposta
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Subtotal Materiais:</span>
                    <span className="font-semibold text-white">{formatBRL(budget.materialsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal Mão de Obra:</span>
                    <span className="font-semibold text-white">{formatBRL(budget.laborSubtotal)}</span>
                  </div>
                  {budget.displacementFee > 0 && (
                    <div className="flex justify-between">
                      <span>Deslocamento:</span>
                      <span className="font-semibold text-white">{formatBRL(budget.displacementFee)}</span>
                    </div>
                  )}
                  {budget.discount > 0 && (
                    <div className="flex justify-between text-rose-300">
                      <span>Desconto Aplicado:</span>
                      <span className="font-semibold">- {formatBRL(budget.discount)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-baseline justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-200">
                  TOTAL GERAL
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {formatBRL(budget.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Warranty */}
          {budget.terms && (
            <div className="pt-2 text-xs text-slate-500 leading-relaxed border-t border-slate-100">
              <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Termos e Condições
              </h5>
              <p>{budget.terms}</p>
            </div>
          )}

          {/* Signature Line */}
          <div className="pt-10 flex flex-col items-center justify-center text-center">
            <div className="w-72 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-slate-900 text-xs">
              {companySettings.responsibleName || budget.responsibleName || companySettings.name}
            </p>
            <p className="text-[11px] text-slate-500">
              {companySettings.responsibleRole || 'Responsável'} • {companySettings.name}
            </p>
          </div>
        </div>
      </div>

      {/* Sources Drawer */}
      <SourcesDrawer
        isOpen={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        sources={budget.sources || []}
        confidenceLevel={budget.confidenceLevel}
        confidenceReason={budget.confidenceReason}
        location={budget.serviceLocation}
      />
    </div>
  );
};
