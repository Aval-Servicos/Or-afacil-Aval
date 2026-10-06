import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CompanySettings, Client, Budget } from '../types/budget';

export const DEFAULT_SETTINGS = (userId = 'default'): CompanySettings => ({
  userId,
  name: 'Minha Empresa de Serviços',
  tradeName: 'Minha Empresa Prestadora de Serviços Ltda',
  cnpj: '00.000.000/0001-00',
  ie: 'Isento',
  phone: '(11) 3333-4444',
  whatsapp: '(11) 99999-8888',
  email: 'contato@minhaempresa.com.br',
  website: 'www.minhaempresa.com.br',
  cep: '01310-100',
  address: 'Avenida Paulista',
  number: '1000',
  complement: 'Sala 101',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  responsibleName: 'João Carlos Oliveira',
  responsibleRole: 'Responsável Técnico',
  defaultMargin: 20,
  defaultHourlyRate: 70,
  defaultDisplacementFee: 50,
  defaultTaxPercent: 6,
  maxDiscountPercent: 15,
  defaultExecutionDays: 2,
  defaultValidityDays: 15,
  marginApplication: 'total',
  paymentTerms: 'À vista com 5% de desconto via Pix ou até 3x no cartão de crédito',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export async function fetchCompanySettings(userId: string): Promise<CompanySettings> {
  const path = `users/${userId}/settings/company`;
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'company');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CompanySettings;
    }
    // Return default settings if none created yet
    const defaults = DEFAULT_SETTINGS(userId);
    await setDoc(docRef, defaults);
    return defaults;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveCompanySettings(userId: string, settings: Partial<CompanySettings>): Promise<CompanySettings> {
  const path = `users/${userId}/settings/company`;
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'company');
    const existingSnap = await getDoc(docRef);
    const existing = existingSnap.exists() ? existingSnap.data() as CompanySettings : DEFAULT_SETTINGS(userId);

    const updated: CompanySettings = {
      ...existing,
      ...settings,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, updated);
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchClients(userId: string): Promise<Client[]> {
  const path = `users/${userId}/clients`;
  try {
    const collRef = collection(db, 'users', userId, 'clients');
    const snap = await getDocs(collRef);
    const clients: Client[] = [];
    snap.forEach((d) => {
      clients.push({ id: d.id, ...(d.data() as Client) });
    });
    // Sort by name
    return clients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveClient(userId: string, clientData: Partial<Client>): Promise<Client> {
  const clientId = clientData.id || `client-${Date.now()}`;
  const path = `users/${userId}/clients/${clientId}`;
  try {
    const docRef = doc(db, 'users', userId, 'clients', clientId);
    const now = new Date().toISOString();
    const client: Client = {
      id: clientId,
      userId,
      name: clientData.name || 'Cliente sem nome',
      document: clientData.document || '',
      company: clientData.company || '',
      phone: clientData.phone || '',
      whatsapp: clientData.whatsapp || '',
      email: clientData.email || '',
      cep: clientData.cep || '',
      address: clientData.address || '',
      number: clientData.number || '',
      complement: clientData.complement || '',
      neighborhood: clientData.neighborhood || '',
      city: clientData.city || '',
      state: clientData.state || '',
      notes: clientData.notes || '',
      createdAt: clientData.createdAt || now,
      updatedAt: now,
    };
    await setDoc(docRef, client);
    return client;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteClient(userId: string, clientId: string): Promise<void> {
  const path = `users/${userId}/clients/${clientId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'clients', clientId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchBudgets(userId: string): Promise<Budget[]> {
  const path = `users/${userId}/budgets`;
  try {
    const collRef = collection(db, 'users', userId, 'budgets');
    const q = query(collRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const budgets: Budget[] = [];
    snap.forEach((d) => {
      budgets.push({ id: d.id, ...(d.data() as Budget) });
    });
    return budgets;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchBudgetById(userId: string, budgetId: string): Promise<Budget | null> {
  const path = `users/${userId}/budgets/${budgetId}`;
  try {
    const docRef = doc(db, 'users', userId, 'budgets', budgetId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Budget) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveBudget(userId: string, budgetData: Partial<Budget>): Promise<Budget> {
  const budgetId = budgetData.id || `orc-${Date.now()}`;
  const path = `users/${userId}/budgets/${budgetId}`;
  try {
    const docRef = doc(db, 'users', userId, 'budgets', budgetId);
    const now = new Date().toISOString();

    const budget: Budget = {
      id: budgetId,
      userId,
      budgetNumber: budgetData.budgetNumber || `ORC-${new Date().getFullYear()}-000001`,
      title: budgetData.title || 'Orçamento de Serviço',
      promptDescription: budgetData.promptDescription || '',
      serviceDescription: budgetData.serviceDescription || '',
      serviceLocation: budgetData.serviceLocation || 'São Paulo - SP',
      clientId: budgetData.clientId || '',
      clientName: budgetData.clientName || 'Cliente',
      clientDocument: budgetData.clientDocument || '',
      clientPhone: budgetData.clientPhone || '',
      clientWhatsapp: budgetData.clientWhatsapp || '',
      clientEmail: budgetData.clientEmail || '',
      clientAddress: budgetData.clientAddress || '',
      status: budgetData.status || 'draft',
      items: budgetData.items || [],
      sources: budgetData.sources || [],
      materialsSubtotal: Number(budgetData.materialsSubtotal) || 0,
      laborSubtotal: Number(budgetData.laborSubtotal) || 0,
      otherSubtotal: Number(budgetData.otherSubtotal) || 0,
      displacementFee: Number(budgetData.displacementFee) || 0,
      discount: Number(budgetData.discount) || 0,
      additionalFees: Number(budgetData.additionalFees) || 0,
      profitMarginPercent: Number(budgetData.profitMarginPercent) || 0,
      profitMarginValue: Number(budgetData.profitMarginValue) || 0,
      total: Number(budgetData.total) || 0,
      executionDays: Number(budgetData.executionDays) || 1,
      validityDays: Number(budgetData.validityDays) || 15,
      paymentTerms: budgetData.paymentTerms || '',
      notes: budgetData.notes || '',
      terms: budgetData.terms || '',
      confidenceLevel: budgetData.confidenceLevel || 'Alta',
      confidenceReason: budgetData.confidenceReason || '',
      responsibleName: budgetData.responsibleName || '',
      createdAt: budgetData.createdAt || now,
      updatedAt: now,
    };

    await setDoc(docRef, budget);
    return budget;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBudget(userId: string, budgetId: string): Promise<void> {
  const path = `users/${userId}/budgets/${budgetId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'budgets', budgetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function generateNextBudgetNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  try {
    const budgets = await fetchBudgets(userId);
    const thisYearBudgets = budgets.filter(b => b.budgetNumber && b.budgetNumber.includes(`ORC-${year}-`));
    const nextNum = thisYearBudgets.length + 1;
    return `ORC-${year}-${String(nextNum).padStart(6, '0')}`;
  } catch {
    return `ORC-${year}-000001`;
  }
}
