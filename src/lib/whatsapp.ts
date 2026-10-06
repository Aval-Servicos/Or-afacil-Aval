import { Budget, CompanySettings } from '../types/budget';
import { formatBRL } from './pdfGenerator';

export function generateWhatsAppMessage(budget: Budget, company: CompanySettings): string {
  const clientName = budget.clientName || 'Cliente';
  const companyName = company.name || 'Nossa Empresa';

  let msg = `Olá, ${clientName}!\n\n`;
  msg += `Segue o orçamento solicitado:\n\n`;
  msg += `📋 *Orçamento nº ${budget.budgetNumber || 'ORC-2026-000001'}*\n`;
  msg += `🔧 *Serviço:* ${budget.title}\n\n`;

  if (budget.materialsSubtotal > 0) {
    msg += `📦 Materiais: ${formatBRL(budget.materialsSubtotal)}\n`;
  }
  if (budget.laborSubtotal > 0) {
    msg += `🛠️ Mão de obra: ${formatBRL(budget.laborSubtotal)}\n`;
  }
  if (budget.displacementFee > 0) {
    msg += `🚗 Deslocamento: ${formatBRL(budget.displacementFee)}\n`;
  }
  if (budget.discount > 0) {
    msg += `🏷️ Desconto: -${formatBRL(budget.discount)}\n`;
  }

  msg += `\n💰 *TOTAL: ${formatBRL(budget.total)}*\n\n`;
  msg += `⏳ *Validade:* ${budget.validityDays || 15} dias.\n`;
  if (budget.executionDays) {
    msg += `📅 *Prazo de execução estimado:* ${budget.executionDays} dias úteis.\n`;
  }
  if (budget.paymentTerms) {
    msg += `💳 *Condições de pagamento:* ${budget.paymentTerms}\n`;
  }

  msg += `\nAtenciosamente,\n*${companyName}*\n`;
  if (company.phone || company.whatsapp) {
    msg += `Contato: ${company.whatsapp || company.phone}\n`;
  }

  return msg;
}

export function openWhatsAppChat(phone: string | undefined, message: string) {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(message);
  
  if (cleanPhone) {
    // If phone doesn't have country code (e.g. 11 digits in Brazil like 11999999999), add 55
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${fullPhone}?text=${encodedMsg}`, '_blank');
  } else {
    // Open web.whatsapp.com with message only
    window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, '_blank');
  }
}
