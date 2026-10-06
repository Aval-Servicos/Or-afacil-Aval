import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { NewBudgetView } from './components/NewBudgetView';
import { BudgetListView } from './components/BudgetListView';
import { BudgetDetailView } from './components/BudgetDetailView';
import { BudgetReviewModal } from './components/BudgetReviewModal';
import { ClientsView } from './components/ClientsView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { AuthModal } from './components/AuthModal';
import { Budget, Client, BudgetStatus } from './types/budget';
import {
  fetchBudgets,
  fetchClients,
  saveBudget,
  deleteBudget,
  saveClient,
  deleteClient,
  generateNextBudgetNumber,
} from './services/firestoreService';

function MainApp() {
  const { user, companySettings, loading: authLoading } = useAuth();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Active states
  const [reviewBudget, setReviewBudget] = useState<Budget | null>(null);
  const [detailBudget, setDetailBudget] = useState<Budget | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Load clients and budgets whenever user changes
  const loadData = async (uid: string) => {
    setLoadingData(true);
    try {
      const [fetchedBudgets, fetchedClients] = await Promise.all([
        fetchBudgets(uid),
        fetchClients(uid),
      ]);

      // Seed with João da Silva if clients list is empty (test case)
      if (fetchedClients.length === 0) {
        const seedClient = await saveClient(uid, {
          name: 'João da Silva',
          document: '123.456.789-00',
          phone: '(11) 98765-4321',
          whatsapp: '(11) 98765-4321',
          email: 'joao.silva@email.com',
          cep: '01310-100',
          address: 'Rua Augusta',
          number: '500',
          complement: 'Apto 12',
          neighborhood: 'Consolação',
          city: 'São Paulo',
          state: 'SP',
          notes: 'Cliente teste oficial para orçamento de troca de torneira de cozinha.',
        });
        setClients([seedClient]);
      } else {
        setClients(fetchedClients);
      }

      setBudgets(fetchedBudgets);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData(user.uid);
    } else {
      setBudgets([]);
      setClients([]);
      setLoadingData(false);
    }
  }, [user]);

  // Handlers for Budgets
  const handleSaveBudget = async (updated: Budget) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      const saved = await saveBudget(user.uid, updated);
      setBudgets((prev) => {
        const idx = prev.findIndex((b) => b.id === saved.id);
        if (idx !== -1) {
          const clone = [...prev];
          clone[idx] = saved;
          return clone;
        }
        return [saved, ...prev];
      });
      setReviewBudget(null);
      setDetailBudget(saved);
      setCurrentView('budget-detail');
    } catch (err) {
      console.error('Failed to save budget:', err);
      alert('Erro ao salvar orçamento. Por favor, tente novamente.');
    }
  };

  const handleDuplicateBudget = async (original: Budget) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      const nextNumber = await generateNextBudgetNumber(user.uid);
      const duplicate: Partial<Budget> = {
        ...original,
        id: undefined,
        budgetNumber: nextNumber,
        title: `${original.title} (Cópia)`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const saved = await saveBudget(user.uid, duplicate);
      setBudgets((prev) => [saved, ...prev]);
      setDetailBudget(saved);
      setCurrentView('budget-detail');
    } catch (err) {
      console.error('Failed to duplicate budget:', err);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!user) return;
    try {
      await deleteBudget(user.uid, budgetId);
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
      if (detailBudget?.id === budgetId) {
        setDetailBudget(null);
        setCurrentView('budgets');
      }
    } catch (err) {
      console.error('Failed to delete budget:', err);
    }
  };

  const handleStatusChange = async (budgetId: string, newStatus: BudgetStatus) => {
    if (!user) return;
    try {
      const budget = budgets.find((b) => b.id === budgetId);
      if (budget) {
        const updated = await saveBudget(user.uid, { ...budget, status: newStatus });
        setBudgets((prev) => prev.map((b) => (b.id === budgetId ? updated : b)));
        if (detailBudget?.id === budgetId) {
          setDetailBudget(updated);
        }
      }
    } catch (err) {
      console.error('Failed to change budget status:', err);
    }
  };

  // Handlers for Clients
  const handleSaveClient = async (clientData: Partial<Client>): Promise<Client | void> => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      const saved = await saveClient(user.uid, clientData);
      setClients((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx !== -1) {
          const clone = [...prev];
          clone[idx] = saved;
          return clone;
        }
        return [saved, ...prev];
      });
      return saved;
    } catch (err) {
      console.error('Failed to save client:', err);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!user) return;
    try {
      await deleteClient(user.uid, clientId);
      setClients((prev) => prev.filter((c) => c.id !== clientId));
    } catch (err) {
      console.error('Failed to delete client:', err);
    }
  };

  // Titles for header
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Visão geral e métricas de desempenho comercial' };
      case 'new-budget':
        return { title: 'Novo Orçamento com IA', subtitle: 'Geração inteligente de propostas com pesquisa Google' };
      case 'budgets':
        return { title: 'Histórico de Orçamentos', subtitle: 'Propostas emitidas, valores e status de aprovação' };
      case 'clients':
        return { title: 'Cadastro de Clientes', subtitle: 'Base de contatos, CPF/CNPJ e endereços com busca por CEP' };
      case 'settings':
        return { title: 'Configurações da Empresa', subtitle: 'Dados cadastrais, logotipo e parâmetros de preços' };
      case 'budget-detail':
        return {
          title: detailBudget?.budgetNumber || 'Detalhes da Proposta',
          subtitle: detailBudget?.title || 'Visualização do orçamento profissional',
        };
      default:
        return { title: 'OrçaFácil IA', subtitle: 'Sistema de Orçamentos' };
    }
  };

  const headerMeta = getHeaderTitle();

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          if (view !== 'budget-detail') setDetailBudget(null);
          setCurrentView(view);
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        budgetCount={budgets.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          onNewBudget={() => {
            setDetailBudget(null);
            setCurrentView('new-budget');
          }}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {authLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : currentView === 'dashboard' ? (
            <DashboardView
              budgets={budgets}
              companySettings={companySettings}
              onNewBudget={() => setCurrentView('new-budget')}
              onOpenBudget={(b) => {
                setDetailBudget(b);
                setCurrentView('budget-detail');
              }}
              onViewAllBudgets={() => setCurrentView('budgets')}
            />
          ) : currentView === 'new-budget' ? (
            <NewBudgetView
              clients={clients}
              onOpenReview={(b) => setReviewBudget(b)}
              onSaveClient={handleSaveClient}
            />
          ) : currentView === 'budgets' ? (
            <BudgetListView
              budgets={budgets}
              companySettings={companySettings}
              onOpenBudget={(b) => {
                setDetailBudget(b);
                setCurrentView('budget-detail');
              }}
              onEditBudget={(b) => setReviewBudget(b)}
              onDuplicateBudget={handleDuplicateBudget}
              onDeleteBudget={handleDeleteBudget}
              onStatusChange={handleStatusChange}
              onNewBudget={() => setCurrentView('new-budget')}
            />
          ) : currentView === 'clients' ? (
            <ClientsView
              clients={clients}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
              onNewBudgetForClient={(c) => {
                setCurrentView('new-budget');
              }}
            />
          ) : currentView === 'settings' ? (
            <CompanySettingsView />
          ) : currentView === 'budget-detail' && detailBudget ? (
            <BudgetDetailView
              budget={detailBudget}
              companySettings={companySettings}
              onBack={() => setCurrentView('budgets')}
              onEdit={(b) => setReviewBudget(b)}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <DashboardView
              budgets={budgets}
              companySettings={companySettings}
              onNewBudget={() => setCurrentView('new-budget')}
              onOpenBudget={(b) => {
                setDetailBudget(b);
                setCurrentView('budget-detail');
              }}
              onViewAllBudgets={() => setCurrentView('budgets')}
            />
          )}
        </main>
      </div>

      {/* Human Review Modal (Section 8: REVISÃO HUMANA) */}
      {reviewBudget && companySettings && (
        <BudgetReviewModal
          budget={reviewBudget}
          companySettings={companySettings}
          isOpen={!!reviewBudget}
          onClose={() => setReviewBudget(null)}
          onSave={handleSaveBudget}
          onPreviewDocument={(b) => {
            setDetailBudget(b);
            setReviewBudget(null);
            setCurrentView('budget-detail');
          }}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
