import React, { useState, useEffect } from 'react';
import { Budget, BudgetItem, ItemType, PriceSourceType, CompanySettings } from '../types/budget';
import { formatBRL, generateBudgetPDF } from '../lib/pdfGenerator';
import { generateWhatsAppMessage, openWhatsAppChat } from '../lib/whatsapp';
import {
  Save,
  FileDown,
  MessageCircle,
  Plus,
  Trash2,
  Info,
  DollarSign,
  Calendar,
  Clock,
  Sparkles,
  Search,
  CheckCircle,
  HelpCircle,
  Eye,
  X,
} from 'lucide-react';
import { SourcesDrawer } from './SourcesDrawer';

interface BudgetReviewModalProps {
  budget: Budget;
  companySettings: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBudget: Budget) => Promise<void>;
  onPreviewDocument?: (budget: Budget) => void;
}

export const BudgetReviewModal: React.FC<BudgetReviewModalProps> = ({
  budget: initialBudget,
  companySettings,
  isOpen,
  onClose,
  onSave,
  onPreviewDocument,
}) => {
  const [budget, setBudget] = useState<Budget>(initialBudget);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'terms' | 'client'>('items');

  useEffect(() => {
    setBudget(initialBudget);
  }, [initialBudget]);

  if (!isOpen) return null;

  // Recalculate totals whenever items or financial fields change
  const recalculateTotals = (
    currentItems: BudgetItem[],
    displacement: number,
    marginPct: number,
    discountVal: number,
    additionalFeesVal: number,
    marginMode: 'total' | 'materials_labor' = companySettings.marginApplication || 'total'
  ) => {
    let matSub = 0;
    let labSub = 0;
    let othSub = 0;

    const updatedItems = currentItems.map((item) => {
      const q = Number(item.quantity) || 0;
      const up = Number(item.unitPrice) || 0;
      const tot = Math.round(q * up * 100) / 100;
      if (item.type === 'material') matSub += tot;
      else if (item.type === 'labor') labSub += tot;
      else othSub += tot;
      return { ...item, total: tot };
    });

    const disp = Number(displacement) || 0;
    const disc = Number(discountVal) || 0;
    const fees = Number(additionalFeesVal) || 0;

    let baseForMargin = 0;
    if (marginMode === 'materials_labor') {
      baseForMargin = matSub + labSub;
    } else {
      baseForMargin = matSub + labSub + othSub + disp;
    }

    const marginValue = Math.round(baseForMargin * (marginPct / 100) * 100) / 100;
    const finalTotal = Math.max(0, Math.round((matSub + labSub + othSub + disp + marginValue - disc + fees) * 100) / 100);

    return {
      updatedItems,
      materialsSubtotal: Math.round(matSub * 100) / 100,
      laborSubtotal: Math.round(labSub * 100) / 100,
      otherSubtotal: Math.round(othSub * 100) / 100,
      displacementFee: disp,
      profitMarginPercent: marginPct,
      profitMarginValue: marginValue,
      discount: disc,
      additionalFees: fees,
      total: finalTotal,
    };
  };

  const handleItemChange = (id: string, field: keyof BudgetItem, val: any) => {
    const newItems = budget.items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: val, sourceType: (field === 'unitPrice' ? 'manual' : item.sourceType) as PriceSourceType };
      }
      return item;
    });

    const calcs = recalculateTotals(
      newItems,
      budget.displacementFee,
      budget.profitMarginPercent,
      budget.discount,
      budget.additionalFees
    );

    setBudget((prev) => ({
      ...prev,
      items: calcs.updatedItems,
      materialsSubtotal: calcs.materialsSubtotal,
      laborSubtotal: calcs.laborSubtotal,
      otherSubtotal: calcs.otherSubtotal,
      profitMarginValue: calcs.profitMarginValue,
      total: calcs.total,
    }));
  };

  const handleAddItem = (type: ItemType) => {
    const newItem: BudgetItem = {
      id: `custom-${Date.now()}`,
      type,
      description: type === 'material' ? 'Novo Material' : type === 'labor' ? 'Nova Etapa de Mão de Obra' : 'Outro Custo',
      quantity: 1,
      unit: type === 'material' ? 'un' : type === 'labor' ? 'h' : 'serviço',
      unitPrice: 0,
      total: 0,
      sourceType: 'manual',
      notes: 'Inserido manualmente pelo usuário',
    };

    const newItems = [...budget.items, newItem];
    const calcs = recalculateTotals(
      newItems,
      budget.displacementFee,
      budget.profitMarginPercent,
      budget.discount,
      budget.additionalFees
    );

    setBudget((prev) => ({
      ...prev,
      items: calcs.updatedItems,
      materialsSubtotal: calcs.materialsSubtotal,
      laborSubtotal: calcs.laborSubtotal,
      otherSubtotal: calcs.otherSubtotal,
      profitMarginValue: calcs.profitMarginValue,
      total: calcs.total,
    }));
  };

  const handleRemoveItem = (id: string) => {
    const newItems = budget.items.filter((i) => i.id !== id);
    const calcs = recalculateTotals(
      newItems,
      budget.displacementFee,
      budget.profitMarginPercent,
      budget.discount,
      budget.additionalFees
    );

    setBudget((prev) => ({
      ...prev,
      items: calcs.updatedItems,
      materialsSubtotal: calcs.materialsSubtotal,
      laborSubtotal: calcs.laborSubtotal,
      otherSubtotal: calcs.otherSubtotal,
      profitMarginValue: calcs.profitMarginValue,
      total: calcs.total,
    }));
  };

  const handleFinancialChange = (field: 'displacementFee' | 'profitMarginPercent' | 'discount' | 'additionalFees', val: number) => {
    const displacement = field === 'displacementFee' ? val : budget.displacementFee;
    const marginPct = field === 'profitMarginPercent' ? val : budget.profitMarginPercent;
    const discount = field === 'discount' ? val : budget.discount;
    const fees = field === 'additionalFees' ? val : budget.additionalFees;

    const calcs = recalculateTotals(budget.items, displacement, marginPct, discount, fees);

    setBudget((prev) => ({
      ...prev,
      displacementFee: calcs.displacementFee,
      profitMarginPercent: calcs.profitMarginPercent,
      profitMarginValue: calcs.profitMarginValue,
      discount: calcs.discount,
      additionalFees: calcs.additionalFees,
      total: calcs.total,
    }));
  };

  const handleSaveBudget = async () => {
    setSaving(true);
    try {
      await onSave(budget);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = generateBudgetPDF(budget, companySettings);
    doc.save(`${budget.budgetNumber || 'orcamento'}.pdf`);
  };

  const handleSendWhatsApp = () => {
    const msg = generateWhatsAppMessage(budget, companySettings);
    openWhatsAppChat(budget.clientWhatsapp || budget.clientPhone, msg);
  };

  const materials = budget.items.filter((i) => i.type === 'material');
  const labor = budget.items.filter((i) => i.type === 'labor');
  const otherItems = budget.items.filter((i) => i.type === 'other');

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-auto border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/30">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">Revisão do Orçamento</h2>
                <span className="text-xs bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded border border-blue-400/30 font-semibold">
                  {budget.budgetNumber}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  budget.confidenceLevel === 'Alta'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : budget.confidenceLevel === 'Média'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}>
                  Confiança: {budget.confidenceLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Revise os materiais, mão de obra e condições antes de gerar o documento final
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSourcesOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg border border-slate-700 transition-colors"
              title="Ver fontes pesquisadas no Google"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Fontes ({budget.sources?.length || 0})</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 gap-6 text-sm font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'items'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Itens & Mão de Obra ({budget.items.length})
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'client'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Dados do Cliente & Local
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'terms'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Prazos, Garantia & Termos
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: ITEMS */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              {/* Service title and technical description */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Título do Serviço
                  </label>
                  <input
                    type="text"
                    value={budget.title}
                    onChange={(e) => setBudget({ ...budget, title: e.target.value })}
                    className="w-full text-sm font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Descrição Detalhada do Escopo
                  </label>
                  <textarea
                    rows={2}
                    value={budget.serviceDescription}
                    onChange={(e) => setBudget({ ...budget, serviceDescription: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* SECTION: MATERIAIS */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="p-3.5 bg-blue-50/70 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="font-bold text-slate-900 text-sm">1. Materiais e Fornecimento</h3>
                    <span className="text-xs text-slate-500 font-medium">({materials.length} itens)</span>
                  </div>
                  <button
                    onClick={() => handleAddItem('material')}
                    className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-white hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Material
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3 w-8">#</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Descrição</th>
                        <th className="py-2.5 px-3 w-20 text-center">Qtd</th>
                        <th className="py-2.5 px-3 w-16 text-center">Unid</th>
                        <th className="py-2.5 px-3 w-28 text-right">Valor Unit. (R$)</th>
                        <th className="py-2.5 px-3 w-28 text-right">Total (R$)</th>
                        <th className="py-2.5 px-3 w-32">Origem / Faixa</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {materials.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-4 text-center text-slate-400 italic">
                            Nenhum material listado. O cliente fornecerá todo o material ou clique em "Adicionar Material".
                          </td>
                        </tr>
                      ) : (
                        materials.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                className="w-full px-2 py-1 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white text-slate-800 font-medium"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 text-center border border-slate-200 rounded focus:border-blue-500"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                className="w-12 px-1 py-1 text-center border border-slate-200 rounded focus:border-blue-500"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-24 px-1.5 py-1 text-right border border-slate-200 rounded font-semibold text-slate-800 focus:border-blue-500"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {formatBRL(item.total)}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex flex-col">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded w-fit ${
                                  item.sourceType === 'pesquisado'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.sourceType === 'estimado'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {item.sourceType === 'pesquisado' ? '🔍 Pesquisado' : item.sourceType === 'estimado' ? '📊 Estimado' : '✍️ Manual'}
                                </span>
                                {item.priceRange && (
                                  <span className="text-[10px] text-slate-400 truncate" title={item.priceRange}>
                                    {item.priceRange}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                title="Excluir item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end text-xs font-bold text-slate-700">
                  Subtotal Materiais: <span className="text-blue-900 ml-2">{formatBRL(budget.materialsSubtotal)}</span>
                </div>
              </div>

              {/* SECTION: MÃO DE OBRA / SERVIÇOS */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="p-3.5 bg-indigo-50/70 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <h3 className="font-bold text-slate-900 text-sm">2. Serviços e Mão de Obra</h3>
                    <span className="text-xs text-slate-500 font-medium">({labor.length} etapas)</span>
                  </div>
                  <button
                    onClick={() => handleAddItem('labor')}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Serviço
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3 w-8">#</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Etapa / Serviço</th>
                        <th className="py-2.5 px-3 w-20 text-center">Qtd</th>
                        <th className="py-2.5 px-3 w-16 text-center">Unid</th>
                        <th className="py-2.5 px-3 w-28 text-right">Valor Unit. (R$)</th>
                        <th className="py-2.5 px-3 w-28 text-right">Total (R$)</th>
                        <th className="py-2.5 px-3 w-32">Origem / Referência</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {labor.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-4 text-center text-slate-400 italic">
                            Nenhum serviço listado. Clique em "Adicionar Serviço".
                          </td>
                        </tr>
                      ) : (
                        labor.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                className="w-full px-2 py-1 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white text-slate-800 font-medium"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 text-center border border-slate-200 rounded focus:border-blue-500"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                className="w-12 px-1 py-1 text-center border border-slate-200 rounded focus:border-blue-500"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-24 px-1.5 py-1 text-right border border-slate-200 rounded font-semibold text-slate-800 focus:border-blue-500"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {formatBRL(item.total)}
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                                {item.sourceType === 'pesquisado' ? '🔍 Referência' : '📊 Mercado Local'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                title="Excluir item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end text-xs font-bold text-slate-700">
                  Subtotal Mão de Obra: <span className="text-indigo-900 ml-2">{formatBRL(budget.laborSubtotal)}</span>
                </div>
              </div>

              {/* FINANCIAL TOTALS AND MARGINS CARD */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Parâmetros Financeiros e Fechamento
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Deslocamento */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      🚗 Taxa de Deslocamento (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={budget.displacementFee}
                      onChange={(e) => handleFinancialChange('displacementFee', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>

                  {/* Margem de Lucro */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        📈 Margem de Lucro (%)
                      </label>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        +{formatBRL(budget.profitMarginValue)}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={budget.profitMarginPercent}
                      onChange={(e) => handleFinancialChange('profitMarginPercent', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>

                  {/* Desconto */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      🏷️ Desconto Especial (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={budget.discount}
                      onChange={(e) => handleFinancialChange('discount', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg text-rose-600"
                    />
                  </div>

                  {/* Prazo */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      ⏳ Prazo de Execução (Dias)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={budget.executionDays}
                      onChange={(e) => setBudget({ ...budget, executionDays: parseInt(e.target.value) || 1 })}
                      className="w-full text-sm font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Big Total Bar */}
                <div className="bg-blue-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-xs text-blue-200 uppercase font-semibold">
                      Composição do Orçamento:
                    </div>
                    <div className="text-xs text-slate-300 flex flex-wrap gap-x-3 gap-y-1">
                      <span>Materiais: {formatBRL(budget.materialsSubtotal)}</span>
                      <span>•</span>
                      <span>Mão de Obra: {formatBRL(budget.laborSubtotal)}</span>
                      <span>•</span>
                      <span>Deslocamento: {formatBRL(budget.displacementFee)}</span>
                      {budget.profitMarginValue > 0 && (
                        <>
                          <span>•</span>
                          <span>Margem ({budget.profitMarginPercent}%): {formatBRL(budget.profitMarginValue)}</span>
                        </>
                      )}
                      {budget.discount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-rose-300">Desconto: -{formatBRL(budget.discount)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider text-blue-200 font-bold">
                      Valor Total da Proposta
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {formatBRL(budget.total)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLIENT & LOCATION */}
          {activeTab === 'client' && (
            <div className="space-y-5 max-w-2xl">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Dados do Cliente</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Cliente</label>
                    <input
                      type="text"
                      value={budget.clientName}
                      onChange={(e) => setBudget({ ...budget, clientName: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">CPF ou CNPJ</label>
                    <input
                      type="text"
                      value={budget.clientDocument || ''}
                      onChange={(e) => setBudget({ ...budget, clientDocument: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={budget.clientWhatsapp || ''}
                      onChange={(e) => setBudget({ ...budget, clientWhatsapp: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={budget.clientEmail || ''}
                      onChange={(e) => setBudget({ ...budget, clientEmail: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="cliente@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Endereço Completo da Obra / Serviço
                  </label>
                  <input
                    type="text"
                    value={budget.clientAddress || ''}
                    onChange={(e) => setBudget({ ...budget, clientAddress: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Rua das Flores, 123 - Apto 45 - Bairro - São Paulo - SP"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Localização Geográfica (Cidade - UF utilizada na cotação)
                  </label>
                  <input
                    type="text"
                    value={budget.serviceLocation}
                    onChange={(e) => setBudget({ ...budget, serviceLocation: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="São Paulo - SP"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TERMS & PAYMENT */}
          {activeTab === 'terms' && (
            <div className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Validade da Proposta (Dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={budget.validityDays}
                    onChange={(e) => setBudget({ ...budget, validityDays: parseInt(e.target.value) || 15 })}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Condições de Pagamento
                  </label>
                  <input
                    type="text"
                    value={budget.paymentTerms}
                    onChange={(e) => setBudget({ ...budget, paymentTerms: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="À vista via Pix ou até 3x no cartão"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observações Gerais da Proposta
                </label>
                <textarea
                  rows={3}
                  value={budget.notes}
                  onChange={(e) => setBudget({ ...budget, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Instruções sobre o dia da execução, limpeza do local, etc."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Termos e Condições de Garantia
                </label>
                <textarea
                  rows={4}
                  value={budget.terms}
                  onChange={(e) => setBudget({ ...budget, terms: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Garantia legal de 90 dias, termos de exclusão de responsabilidade..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPreviewDocument && onPreviewDocument(budget)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 shadow-2xs transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visualizar Proposta</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleSaveBudget}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Orçamento'}</span>
            </button>
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
