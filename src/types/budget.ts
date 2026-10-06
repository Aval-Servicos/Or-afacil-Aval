export type ItemType = 'material' | 'labor' | 'other';
export type PriceConfidence = 'Alta' | 'Média' | 'Baixa';
export type PriceSourceType = 'pesquisado' | 'estimado' | 'manual';
export type BudgetStatus = 'draft' | 'sent' | 'pending' | 'approved' | 'rejected' | 'expired' | 'canceled';
export type MarginApplication = 'total' | 'materials_labor';

export interface CompanySettings {
  id?: string;
  userId: string;
  name: string;
  tradeName?: string;
  cnpj?: string;
  ie?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  logoUrl?: string;
  responsibleName?: string;
  responsibleRole?: string;
  defaultMargin: number; // e.g. 20 for 20%
  defaultHourlyRate: number; // e.g. 70
  defaultDisplacementFee: number; // e.g. 50
  defaultTaxPercent: number; // e.g. 6
  maxDiscountPercent: number; // e.g. 15
  defaultExecutionDays: number; // e.g. 2
  defaultValidityDays: number; // e.g. 15
  marginApplication: MarginApplication;
  paymentTerms: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id?: string;
  userId: string;
  name: string;
  document?: string;
  company?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  type: ItemType;
  description: string;
  quantity: number;
  unit: string; // 'un', 'm', 'm²', 'm³', 'kg', 'h', 'diária', 'serviço'
  unitPrice: number;
  total: number;
  sourceType: PriceSourceType;
  priceRange?: string; // e.g. "R$ 89,90 a R$ 249,90"
  sourceName?: string; // e.g. "Mercado Livre / Leroy Merlin"
  sourceUrl?: string;
  sourceDate?: string;
  notes?: string;
}

export interface ResearchSource {
  title: string;
  uri?: string;
  priceFound?: string;
  priceRange?: string;
  notes?: string;
  sourceType?: string;
  date?: string;
}

export interface Budget {
  id?: string;
  userId: string;
  budgetNumber: string; // e.g. "ORC-2026-000001"
  title: string;
  promptDescription: string;
  serviceDescription: string;
  serviceLocation: string; // e.g. "São Paulo - SP"
  clientId?: string;
  clientName: string;
  clientDocument?: string;
  clientPhone?: string;
  clientWhatsapp?: string;
  clientEmail?: string;
  clientAddress?: string;
  status: BudgetStatus;
  items: BudgetItem[];
  sources: ResearchSource[];
  materialsSubtotal: number;
  laborSubtotal: number;
  otherSubtotal: number;
  displacementFee: number;
  discount: number;
  additionalFees: number;
  profitMarginPercent: number;
  profitMarginValue: number;
  total: number;
  executionDays: number;
  validityDays: number;
  paymentTerms: string;
  notes: string;
  terms: string;
  confidenceLevel: PriceConfidence;
  confidenceReason?: string;
  responsibleName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  field: string;
  placeholder?: string;
  suggestedAnswers?: string[];
  userAnswer?: string;
}

export interface AiEstimationResponse {
  needsClarification: boolean;
  questions?: ClarificationQuestion[];
  estimatedBudget?: Partial<Budget>;
  sources?: ResearchSource[];
  confidenceLevel: PriceConfidence;
  confidenceReason?: string;
  serviceSummary?: string;
}
