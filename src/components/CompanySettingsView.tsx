import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CompanySettings } from '../types/budget';
import { lookupCep, formatCep, formatPhone, formatCpfCnpj } from '../lib/cep';
import {
  Building2,
  DollarSign,
  Save,
  CheckCircle,
  Clock,
  Percent,
  Sliders,
  Phone,
  Mail,
  MapPin,
  Shield,
  Upload,
  Image,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export const CompanySettingsView: React.FC = () => {
  const { companySettings, updateCompanySettings } = useAuth();
  const [formData, setFormData] = useState<Partial<CompanySettings>>(companySettings || {});
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepSuccess, setCepSuccess] = useState(false);

  React.useEffect(() => {
    if (companySettings) {
      setFormData(companySettings);
    }
  }, [companySettings]);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCepChange = async (rawCep: string) => {
    const formatted = formatCep(rawCep);
    handleChange('cep', formatted);

    const clean = rawCep.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      setCepSuccess(false);
      try {
        const addr = await lookupCep(clean);
        if (addr) {
          setFormData((prev) => ({
            ...prev,
            address: addr.street || prev?.address,
            neighborhood: addr.neighborhood || prev?.neighborhood,
            city: addr.city || prev?.city,
            state: addr.state || prev?.state,
          }));
          setCepSuccess(true);
        }
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem do logotipo deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateCompanySettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Error saving company settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Configurações da Empresa</h2>
          <p className="text-xs text-slate-500">
            Estes dados são preenchidos automaticamente em todos os novos orçamentos e impressos no cabeçalho dos PDFs
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: DADOS CADASTRAIS DA EMPRESA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Dados Cadastrais da Empresa</h3>
              <p className="text-[11px] text-slate-400">Identificação formal que constará nos orçamentos e contratos</p>
            </div>
          </div>

          {/* Logo Upload & Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Logo da Empresa"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="text-center p-2 text-slate-400">
                  <Image className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-[9px] font-bold block uppercase">Sem Logo</span>
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <span className="font-bold text-xs text-slate-800 block">Logotipo da Empresa</span>
              <p className="text-[11px] text-slate-500 max-w-md">
                Envie a logo da sua empresa (PNG ou JPG, max 2MB) ou informe uma URL pública. Ela aparecerá no topo de todas as propostas e PDFs.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Escolher Arquivo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => handleChange('logoUrl', '')}
                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Nome Fantasia */}
            <div className="lg:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nome da Empresa (Nome Fantasia) *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full text-sm font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Hidráulica & Reformas São Paulo"
              />
            </div>

            {/* Razão Social */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Razão Social (Business Name)
              </label>
              <input
                type="text"
                value={formData.tradeName || ''}
                onChange={(e) => handleChange('tradeName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Ex: Silva Prestação de Serviços Ltda"
              />
            </div>

            {/* CNPJ */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                CNPJ (Tax ID)
              </label>
              <input
                type="text"
                value={formData.cnpj || ''}
                onChange={(e) => handleChange('cnpj', formatCpfCnpj(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                placeholder="00.000.000/0001-00"
              />
            </div>

            {/* Inscrição Estadual */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Inscrição Estadual (State Registration)
              </label>
              <input
                type="text"
                value={formData.ie || ''}
                onChange={(e) => handleChange('ie', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Isento ou 000.000.000"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telefone Fixo</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="(11) 3333-4444"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp de Atendimento *</label>
              <input
                type="text"
                value={formData.whatsapp || ''}
                onChange={(e) => handleChange('whatsapp', formatPhone(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
                placeholder="(11) 99999-8888"
              />
            </div>

            {/* E-mail */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-mail Comercial</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="orcamentos@minhaempresa.com.br"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website ou Rede Social</label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="www.minhaempresa.com.br"
              />
            </div>
          </div>

          {/* Endereço com Busca Automática de CEP */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Endereço Sede da Empresa</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 col-span-1 sm:col-span-2 lg:col-span-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-blue-900">
                    CEP da Empresa (Busca Automática)
                  </label>
                  {loadingCep && (
                    <span className="text-[11px] text-blue-600 flex items-center gap-1 font-semibold">
                      <Loader2 className="w-3 h-3 animate-spin" /> Buscando CEP...
                    </span>
                  )}
                  {cepSuccess && (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3 h-3" /> Endereço carregado com sucesso!
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.cep || ''}
                  onChange={(e) => handleCepChange(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 bg-white rounded-lg text-sm font-mono max-w-sm"
                  placeholder="01310-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Logradouro / Rua</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Avenida Paulista"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Número</label>
                <input
                  type="text"
                  value={formData.number || ''}
                  onChange={(e) => handleChange('number', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Complemento</label>
                <input
                  type="text"
                  value={formData.complement || ''}
                  onChange={(e) => handleChange('complement', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Sala 101"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bairro</label>
                <input
                  type="text"
                  value={formData.neighborhood || ''}
                  onChange={(e) => handleChange('neighborhood', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Bela Vista"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cidade Base</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.state || ''}
                  onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-bold text-center"
                  placeholder="SP"
                />
              </div>
            </div>
          </div>

          {/* Responsável */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Responsável Técnico / Comercial (Assinatura do Orçamento)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome do Responsável (Responsible Name)
                </label>
                <input
                  type="text"
                  value={formData.responsibleName || ''}
                  onChange={(e) => handleChange('responsibleName', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  placeholder="João Carlos Oliveira"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cargo do Responsável (Responsible Title)
                </label>
                <input
                  type="text"
                  value={formData.responsibleRole || ''}
                  onChange={(e) => handleChange('responsibleRole', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Responsável Técnico / Engenheiro Civil / Orçamentista"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: PARÂMETROS FINANCEIROS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Parâmetros de Preço e Orçamento Padrão</h3>
              <p className="text-[11px] text-slate-400">Valores aplicados como base em todos os novos orçamentos gerados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {/* Margem de Lucro */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block font-bold text-slate-800">
                Margem de Lucro Padrão (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.defaultMargin ?? 20}
                  onChange={(e) => handleChange('defaultMargin', parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-bold px-3 py-2 border border-slate-300 rounded-lg pr-8"
                />
                <Percent className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-500">
                Aplicada automaticamente no cálculo das propostas.
              </p>
            </div>

            {/* Aplicação da Margem */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block font-bold text-slate-800">
                Aplicação da Margem
              </label>
              <select
                value={formData.marginApplication || 'total'}
                onChange={(e) => handleChange('marginApplication', e.target.value as any)}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="total">Sobre Custo Total (Materiais + MO + Deslocamento)</option>
                <option value="materials_labor">Somente sobre Materiais e Mão de Obra</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Define a base de cálculo para a margem de lucro.
              </p>
            </div>

            {/* Valor Hora Mão de Obra */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block font-bold text-slate-800">
                Valor/Hora de Referência (R$)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={formData.defaultHourlyRate ?? 70}
                onChange={(e) => handleChange('defaultHourlyRate', parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-bold px-3 py-2 border border-slate-300 rounded-lg"
              />
              <p className="text-[11px] text-slate-500">
                Referência para a IA calibrar estimativas de mão de obra.
              </p>
            </div>

            {/* Taxa de Deslocamento */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block font-bold text-slate-800">
                Taxa de Deslocamento Padrão (R$)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={formData.defaultDisplacementFee ?? 50}
                onChange={(e) => handleChange('defaultDisplacementFee', parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-bold px-3 py-2 border border-slate-300 rounded-lg"
              />
              <p className="text-[11px] text-slate-500">
                Custo de deslocamento inserido por padrão.
              </p>
            </div>

            {/* Prazo Padrão de Execução */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block font-bold text-slate-800">
                Prazo Padrão de Execução (Dias)
              </label>
              <input
                type="number"
                min="1"
                value={formData.defaultExecutionDays ?? 2}
                onChange={(e) => handleChange('defaultExecutionDays', parseInt(e.target.value) || 1)}
                className="w-full text-sm font-bold px-3 py-2 border border-slate-300 rounded-lg"
              />
              <p className="text-[11px] text-slate-500">
                Prazo estimado de execução da obra.
              </p>
            </div>

            {/* Validade do Orçamento */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block font-bold text-slate-800">
                Validade da Proposta (Dias)
              </label>
              <input
                type="number"
                min="1"
                value={formData.defaultValidityDays ?? 15}
                onChange={(e) => handleChange('defaultValidityDays', parseInt(e.target.value) || 15)}
                className="w-full text-sm font-bold px-3 py-2 border border-slate-300 rounded-lg"
              />
              <p className="text-[11px] text-slate-500">
                Validade da proposta impressa no documento.
              </p>
            </div>
          </div>

          {/* Condições de pagamento padrão */}
          <div className="pt-2">
            <label className="block font-bold text-slate-800 text-xs mb-1">
              Condições de Pagamento Padrão
            </label>
            <input
              type="text"
              value={formData.paymentTerms || ''}
              onChange={(e) => handleChange('paymentTerms', e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Ex: À vista com 5% de desconto via Pix ou até 3x sem juros no cartão de crédito"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando Configurações...' : 'Salvar Todas as Configurações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
