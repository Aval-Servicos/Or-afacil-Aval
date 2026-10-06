import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Client, Budget, ClarificationQuestion } from '../types/budget';
import { generateNextBudgetNumber } from '../services/firestoreService';
import { lookupCep, formatCep, formatPhone, formatCpfCnpj } from '../lib/cep';
import { ClarificationModal } from './ClarificationModal';
import {
  Sparkles,
  MapPin,
  User,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wrench,
  Paintbrush,
  Zap,
  Wind,
  X,
  Save,
  Phone,
  Mail,
  Building,
} from 'lucide-react';

interface NewBudgetViewProps {
  clients: Client[];
  onOpenReview: (budget: Budget) => void;
  onSaveClient: (client: Partial<Client>) => Promise<Client | void>;
}

export const NewBudgetView: React.FC<NewBudgetViewProps> = ({
  clients,
  onOpenReview,
  onSaveClient,
}) => {
  const { user, companySettings } = useAuth();

  const [prompt, setPrompt] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [location, setLocation] = useState(
    companySettings?.city && companySettings?.state
      ? `${companySettings.city} - ${companySettings.state}`
      : 'São Paulo - SP'
  );

  // Manual client fields if not selected from database
  const [customClientName, setCustomClientName] = useState('João da Silva');
  const [customClientDocument, setCustomClientDocument] = useState('123.456.789-00');
  const [customClientPhone, setCustomClientPhone] = useState('(11) 98765-4321');
  const [customClientEmail, setCustomClientEmail] = useState('joao.silva@email.com');
  const [customClientAddress, setCustomClientAddress] = useState('Rua Augusta, 500 - Consolação, São Paulo - SP');

  // Quick Client Creation Modal State
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState<Partial<Client>>({
    name: '',
    document: '',
    company: '',
    phone: '',
    whatsapp: '',
    email: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
    notes: '',
  });
  const [loadingCep, setLoadingCep] = useState(false);
  const [savingClient, setSavingClient] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Clarifications state
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[] | null>(null);

  // Ready-to-click quick prompts
  const quickPrompts = [
    {
      title: 'Troca de torneira de cozinha (Teste Oficial)',
      prompt: 'Gere um orçamento para troca de uma torneira de cozinha com fornecimento de material. Retirar a torneira antiga, fornecer uma torneira nova de qualidade intermediária e instalar a nova. Considerar deslocamento.',
      icon: Wrench,
      highlight: true,
    },
    {
      title: 'Pintura de sala 30m²',
      prompt: 'Preciso pintar uma sala de 30 metros quadrados. Incluir materiais (tinta látex acrílica fosca, massa corrida para pequenos retoques, lixas e fita crepe) e mão de obra de pintura em duas demãos.',
      icon: Paintbrush,
    },
    {
      title: 'Instalação de 5 tomadas elétricas',
      prompt: 'Faça um orçamento para instalar 5 tomadas elétricas novas de 10A padrão brasileiro, incluindo fornecimento de placas, módulos, fiação antichamas de 2.5mm² e mão de obra de eletricista.',
      icon: Zap,
    },
    {
      title: 'Instalação de Ar Condicionado Split 12.000 BTUs',
      prompt: 'Instalar um ar condicionado Split de 12.000 BTUs em alvenaria. Fornecimento de suporte externo, tubulação de cobre até 3 metros, isolamento térmico, cabeamento e teste de vácuo.',
      icon: Wind,
    },
  ];

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setCustomClientName(found.name);
      setCustomClientDocument(found.document || '');
      setCustomClientPhone(found.whatsapp || found.phone || '');
      setCustomClientEmail(found.email || '');
      const addr = [
        found.address,
        found.number ? `nº ${found.number}` : '',
        found.complement,
        found.neighborhood,
        found.city && found.state ? `${found.city} - ${found.state}` : found.city,
      ].filter(Boolean).join(', ');
      setCustomClientAddress(addr);
      if (found.city && found.state) {
        setLocation(`${found.city} - ${found.state}`);
      }
    }
  };

  const handleCepLookupForNewClient = async (rawCep: string) => {
    const formatted = formatCep(rawCep);
    setNewClientData((prev) => ({ ...prev, cep: formatted }));

    const clean = rawCep.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const addr = await lookupCep(clean);
        if (addr) {
          setNewClientData((prev) => ({
            ...prev,
            address: addr.street || prev.address,
            neighborhood: addr.neighborhood || prev.neighborhood,
            city: addr.city || prev.city,
            state: addr.state || prev.state,
          }));
        }
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleCreateNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.name?.trim()) return;

    setSavingClient(true);
    try {
      const saved = await onSaveClient(newClientData);
      if (saved && saved.id) {
        handleSelectClient(saved.id);
      }
      setNewClientModalOpen(false);
    } catch (err) {
      console.error('Erro ao cadastrar cliente rápido:', err);
    } finally {
      setSavingClient(false);
    }
  };

  const handleGenerate = async (
    clarificationAnswers: Record<string, string> = {},
    forceGenerate = false
  ) => {
    if (!prompt.trim()) {
      setError('Por favor, descreva o serviço que você precisa orçar.');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage('1/3 Interpretando o serviço solicitado com IA...');

    try {
      const timer1 = setTimeout(() => {
        setStatusMessage('2/3 Pesquisando preços reais no Google Search no Brasil...');
      }, 2500);

      const timer2 = setTimeout(() => {
        setStatusMessage('3/3 Calculando materiais, mão de obra e montando a proposta...');
      }, 5500);

      const response = await fetch('/api/ai/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          location: location.trim() || 'São Paulo - SP',
          companySettings: companySettings || {},
          clarificationAnswers,
          forceGenerate,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao processar orçamento pela IA.');
      }

      const data = await response.json();

      if (data.needsClarification && data.questions && data.questions.length > 0 && !forceGenerate) {
        setClarificationQuestions(data.questions);
        setLoading(false);
        return;
      }

      const nextBudgetNumber = await generateNextBudgetNumber(user?.uid || 'guest');

      const fullBudget: Budget = {
        userId: user?.uid || 'guest',
        budgetNumber: nextBudgetNumber,
        title: data.title || 'Orçamento de Serviço',
        promptDescription: prompt,
        serviceDescription: data.serviceDescription || prompt,
        serviceLocation: location.trim() || 'São Paulo - SP',
        clientId: selectedClientId || undefined,
        clientName: customClientName.trim() || 'Cliente',
        clientDocument: customClientDocument.trim() || '',
        clientPhone: customClientPhone.trim() || '',
        clientWhatsapp: customClientPhone.trim() || '',
        clientEmail: customClientEmail.trim() || '',
        clientAddress: customClientAddress.trim() || '',
        status: 'draft',
        items: data.items || [],
        sources: data.sources || [],
        materialsSubtotal: Number(data.materialsSubtotal) || 0,
        laborSubtotal: Number(data.laborSubtotal) || 0,
        otherSubtotal: Number(data.otherSubtotal) || 0,
        displacementFee: Number(data.displacementFee ?? companySettings?.defaultDisplacementFee ?? 50),
        discount: Number(data.discount) || 0,
        additionalFees: Number(data.additionalFees) || 0,
        profitMarginPercent: Number(data.profitMarginPercent ?? companySettings?.defaultMargin ?? 20),
        profitMarginValue: Number(data.profitMarginValue) || 0,
        total: Number(data.total) || 0,
        executionDays: Number(data.executionDays ?? companySettings?.defaultExecutionDays ?? 2),
        validityDays: Number(data.validityDays ?? companySettings?.defaultValidityDays ?? 15),
        paymentTerms: data.paymentTerms || companySettings?.paymentTerms || 'À vista via Pix ou até 3x no cartão',
        notes: data.notes || '',
        terms: data.terms || 'Garantia legal de 90 dias sobre a mão de obra. Materiais com garantia do fabricante.',
        confidenceLevel: data.confidenceLevel || 'Alta',
        confidenceReason: data.confidenceReason || '',
        responsibleName: companySettings?.responsibleName || 'Responsável Técnico',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setClarificationQuestions(null);
      onOpenReview(fullBudget);
    } catch (err: any) {
      console.error('Error generating budget:', err);
      setError(err?.message || 'Ocorreu um erro ao gerar o orçamento. Tente novamente.');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Title Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <Sparkles className="w-64 h-64 text-blue-200" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gerador Inteligente com Pesquisa Google</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Criar Orçamento com IA
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Descreva o serviço em linguagem natural. A IA pesquisa preços reais no mercado brasileiro, separa materiais e mão de obra e monta a proposta completa vinculada ao seu cliente.
          </p>
        </div>
      </div>

      {/* Main Input Form Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sm:p-8 space-y-6">
        {/* Client & Location Selection Bar */}
        <div className="space-y-4 pb-4 border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Cliente do Orçamento</span>
                </label>
                <button
                  type="button"
                  onClick={() => setNewClientModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Novo Cliente</span>
                </button>
              </div>

              <select
                value={selectedClientId}
                onChange={(e) => handleSelectClient(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Cliente Avulso (Preencher dados abaixo)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} — {c.city || 'Sem cidade'}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Localização do Serviço (Cidade - UF)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: São Paulo - SP"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400">
                A cidade calibra os preços regionais de materiais e referências de mão de obra.
              </p>
            </div>
          </div>

          {/* Selected Client Details Card or Manual Form */}
          {selectedClient ? (
            <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{selectedClient.name}</span>
                  {selectedClient.company && (
                    <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                      {selectedClient.company}
                    </span>
                  )}
                  {selectedClient.document && (
                    <span className="text-slate-500 font-mono text-[11px]">
                      {selectedClient.document}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-[11px]">
                  {(selectedClient.whatsapp || selectedClient.phone) && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedClient.whatsapp || selectedClient.phone}
                    </span>
                  )}
                  {selectedClient.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {selectedClient.email}
                    </span>
                  )}
                  {customClientAddress && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {customClientAddress}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClientId('')}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline shrink-0"
              >
                Alterar / Preencher manual
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Dados do Cliente Avulso:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Nome do Cliente (ex: João da Silva)"
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="text"
                  placeholder="CPF/CNPJ"
                  value={customClientDocument}
                  onChange={(e) => setCustomClientDocument(formatCpfCnpj(e.target.value))}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
                <input
                  type="text"
                  placeholder="WhatsApp do Cliente"
                  value={customClientPhone}
                  onChange={(e) => setCustomClientPhone(formatPhone(e.target.value))}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <input
                type="text"
                placeholder="Endereço da obra (ex: Rua Augusta, 500 - Consolação, São Paulo - SP)"
                value={customClientAddress}
                onChange={(e) => setCustomClientAddress(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
              />
            </div>
          )}
        </div>

        {/* Big Prompt Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-900 tracking-tight">
              Descreva o serviço que você precisa orçar
            </label>
            <span className="text-xs text-slate-400">
              Quanto mais detalhes, mais preciso o orçamento
            </span>
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Exemplo: trocar uma torneira de cozinha, fornecendo uma torneira nova, retirar a antiga e instalar a nova."
              className="w-full p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm leading-relaxed text-slate-800 placeholder-slate-400 resize-y shadow-inner font-medium"
            />
          </div>
        </div>

        {/* Quick Inspiration Prompts */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Ou clique em um exemplo para testar:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickPrompts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPrompt(item.prompt)}
                  className={`text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-start gap-2.5 ${
                    item.highlight
                      ? 'bg-blue-50/70 border-blue-300 text-blue-900 hover:bg-blue-100 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${item.highlight ? 'text-blue-600' : 'text-slate-500'}`} />
                  <div>
                    <span className="font-bold block text-slate-900">{item.title}</span>
                    <span className="text-slate-500 line-clamp-2 mt-0.5 text-[11px]">{item.prompt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state bar */}
        {loading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 animate-pulse">
            <div className="flex items-center gap-3 text-blue-900 font-bold text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>{statusMessage || 'Processando com IA...'}</span>
            </div>
            <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-2/3 animate-progress"></div>
            </div>
            <p className="text-[11px] text-blue-700">
              Pesquisando lojas brasileiras, distribuidores e referências de mão de obra...
            </p>
          </div>
        )}

        {/* CTA Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerate()}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Pesquisando e Gerando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar orçamento com IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick New Client Modal inside New Budget */}
      {newClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Cadastrar Cliente para o Orçamento</h3>
              </div>
              <button
                onClick={() => setNewClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClient} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={newClientData.name || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                    placeholder="Ex: João da Silva"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={newClientData.document || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, document: formatCpfCnpj(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Empresa (se PJ)</label>
                  <input
                    type="text"
                    value={newClientData.company || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Nome da empresa"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={newClientData.whatsapp || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, whatsapp: formatPhone(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={newClientData.email || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="cliente@email.com"
                  />
                </div>

                {/* CEP auto-fill */}
                <div className="sm:col-span-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-blue-900">CEP (Busca Automática)</label>
                    {loadingCep && <span className="text-[10px] text-blue-600 font-bold">Buscando...</span>}
                  </div>
                  <input
                    type="text"
                    value={newClientData.cep || ''}
                    onChange={(e) => handleCepLookupForNewClient(e.target.value)}
                    className="w-full px-3 py-1.5 border border-blue-200 bg-white rounded-lg text-xs font-mono"
                    placeholder="01310-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Endereço da Obra</label>
                  <input
                    type="text"
                    value={newClientData.address || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Rua das Flores, 123"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={newClientData.city || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={newClientData.state || ''}
                    onChange={(e) => setNewClientData({ ...newClientData, state: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-bold text-center"
                    placeholder="SP"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewClientModalOpen(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
                >
                  {savingClient ? 'Salvando...' : 'Salvar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clarification Modal if essential info is missing */}
      {clarificationQuestions && (
        <ClarificationModal
          questions={clarificationQuestions}
          onConfirm={(answers) => handleGenerate(answers, false)}
          onCancel={() => setClarificationQuestions(null)}
          onForceGenerate={() => handleGenerate({}, true)}
        />
      )}
    </div>
  );
};
