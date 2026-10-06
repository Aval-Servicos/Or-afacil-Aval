import React, { useState } from 'react';
import { Client } from '../types/budget';
import { lookupCep, formatCep, formatPhone, formatCpfCnpj } from '../lib/cep';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  FileText,
  X,
  Save,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface ClientsViewProps {
  clients: Client[];
  onSaveClient: (client: Partial<Client>) => Promise<Client | void>;
  onDeleteClient: (clientId: string) => Promise<void>;
  onNewBudgetForClient: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onSaveClient,
  onDeleteClient,
  onNewBudgetForClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepSuccess, setCepSuccess] = useState(false);

  const filteredClients = clients.filter((c) => {
    const s = searchTerm.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(s) ||
      (c.company || '').toLowerCase().includes(s) ||
      (c.document || '').toLowerCase().includes(s) ||
      (c.city || '').toLowerCase().includes(s) ||
      (c.phone || '').toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s)
    );
  });

  const handleOpenNew = () => {
    setEditingClient({
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
    setCepSuccess(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setCepSuccess(false);
    setModalOpen(true);
  };

  const handleCepChange = async (rawCep: string) => {
    const formatted = formatCep(rawCep);
    setEditingClient((prev) => (prev ? { ...prev, cep: formatted } : null));

    const clean = rawCep.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      setCepSuccess(false);
      try {
        const addr = await lookupCep(clean);
        if (addr) {
          setEditingClient((prev) =>
            prev
              ? {
                  ...prev,
                  address: addr.street || prev.address,
                  neighborhood: addr.neighborhood || prev.neighborhood,
                  city: addr.city || prev.city,
                  state: addr.state || prev.state,
                }
              : null
          );
          setCepSuccess(true);
        }
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.name?.trim()) return;

    setSaving(true);
    try {
      await onSaveClient(editingClient);
      setModalOpen(false);
      setEditingClient(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cadastro de Clientes</h2>
          <p className="text-xs text-slate-500">
            Base de clientes com preenchimento automático de endereço por CEP e integração direta aos orçamentos
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-600/30 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Pesquisar por nome, empresa, CPF/CNPJ, telefone ou cidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs outline-none text-slate-800"
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Nenhum cliente cadastrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm
              ? 'Nenhum resultado encontrado para o termo pesquisado.'
              : 'Cadastre seu primeiro cliente para agilizar o preenchimento de futuros orçamentos.'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Agora</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{c.name}</h3>
                    {c.company && (
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{c.company}</span>
                      </span>
                    )}
                  </div>
                  {c.document && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                      {c.document}
                    </span>
                  )}
                </div>

                {/* Contacts & Address info */}
                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  {(c.whatsapp || c.phone) && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.whatsapp || c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {(c.city || c.address) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {[c.address, c.number ? `nº ${c.number}` : '', c.neighborhood, c.city && c.state ? `${c.city} - ${c.state}` : c.city].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {c.notes && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg line-clamp-2">
                    {c.notes}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNewBudgetForClient(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Novo Orçamento</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover o cliente ${c.name}?`)) {
                        onDeleteClient(c.id!);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Cadastro / Edição de Cliente */}
      {modalOpen && editingClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingClient.id ? 'Editar Dados do Cliente' : 'Cadastrar Novo Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome Completo / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingClient.name || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                    placeholder="Ex: João da Silva ou Silva & Filhos Ltda"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={editingClient.document || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, document: formatCpfCnpj(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Empresa / Razão Social</label>
                  <input
                    type="text"
                    value={editingClient.company || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Nome da empresa do cliente caso PJ"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp (Principal)</label>
                  <input
                    type="text"
                    value={editingClient.whatsapp || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, whatsapp: formatPhone(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone Fixo</label>
                  <input
                    type="text"
                    value={editingClient.phone || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: formatPhone(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="(11) 3333-3333"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editingClient.email || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="cliente@email.com"
                  />
                </div>

                {/* CEP Auto-lookup */}
                <div className="sm:col-span-2 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-blue-900 flex items-center gap-1">
                      <span>CEP da Obra / Serviço</span>
                      <span className="text-[10px] text-blue-600 font-normal">(Busca automática no Brasil)</span>
                    </label>
                    {loadingCep && (
                      <span className="text-[11px] text-blue-600 flex items-center gap-1 font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" /> Buscando endereço...
                      </span>
                    )}
                    {cepSuccess && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3 h-3" /> Endereço encontrado!
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editingClient.cep || ''}
                    onChange={(e) => handleCepChange(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 bg-white rounded-lg text-sm font-mono"
                    placeholder="Ex: 01310-100 (digite o CEP para preencher a rua)"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Logradouro / Rua</label>
                  <input
                    type="text"
                    value={editingClient.address || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Rua, Avenida ou Alameda"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={editingClient.number || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                    placeholder="123 ou S/N"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={editingClient.complement || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, complement: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Apto 45, Bloco B, Casa 2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={editingClient.neighborhood || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, neighborhood: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Bairro"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={editingClient.city || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, city: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={editingClient.state || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, state: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-bold text-center"
                      placeholder="SP"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Observações do Cliente</label>
                  <textarea
                    rows={2}
                    value={editingClient.notes || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Informações sobre horários permitidos de barulho, portaria, preferências..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
