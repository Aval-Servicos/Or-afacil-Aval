import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Budget, CompanySettings } from '../types/budget';

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatDateBR(dateString?: string): string {
  if (!dateString) return new Date().toLocaleDateString('pt-BR');
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

export function generateBudgetPDF(budget: Budget, company: CompanySettings): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Colors
  const primaryColor: [number, number, number] = [15, 44, 89]; // #0f2c59 Deep Navy
  const secondaryColor: [number, number, number] = [70, 90, 120];
  const accentColor: [number, number, number] = [23, 118, 204];

  // Header background banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Try to render logo if present
  if (company.logoUrl && company.logoUrl.startsWith('data:image/')) {
    try {
      doc.addImage(company.logoUrl, 'PNG', pageWidth - 30, 4, 18, 18);
    } catch {
      // Ignore logo format errors gracefully
    }
  }

  // Company Name and Header Info
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(company.name || 'OrçaFácil IA', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const companySub = [
    company.tradeName ? `${company.tradeName}` : '',
    company.cnpj ? `CNPJ: ${company.cnpj}` : '',
    company.phone || company.whatsapp ? `Tel: ${company.whatsapp || company.phone}` : '',
    company.email ? `E-mail: ${company.email}` : '',
  ].filter(Boolean).join(' | ');

  doc.text(companySub || 'Prestação de Serviços Especializados', 14, 18);

  const addressLine = [
    company.address,
    company.number ? `nº ${company.number}` : '',
    company.neighborhood,
    company.city && company.state ? `${company.city} - ${company.state}` : company.city,
    company.cep ? `CEP: ${company.cep}` : '',
  ].filter(Boolean).join(', ');

  if (addressLine) {
    doc.text(addressLine, 14, 23);
  }

  y = 36;

  // Budget Number and Status Badge
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'F');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`ORÇAMENTO: ${budget.budgetNumber || 'ORC-2026-000001'}`, 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Emissão: ${formatDateBR(budget.createdAt)}   |   Validade: ${budget.validityDays || 15} dias   |   Local: ${budget.serviceLocation || 'São Paulo - SP'}`,
    18,
    y + 12
  );

  y += 22;

  // Client Details Box
  doc.setDrawColor(220, 225, 235);
  doc.setFillColor(252, 253, 255);
  doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DADOS DO CLIENTE', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);

  const clientLine1 = `Nome: ${budget.clientName || 'Cliente'}   ${budget.clientDocument ? `|   CPF/CNPJ: ${budget.clientDocument}` : ''}`;
  doc.text(clientLine1, 18, y + 12);

  const clientLine2 = `Telefone / WhatsApp: ${budget.clientWhatsapp || budget.clientPhone || 'Não informado'}   ${budget.clientEmail ? `|   E-mail: ${budget.clientEmail}` : ''}`;
  doc.text(clientLine2, 18, y + 17);

  if (budget.clientAddress) {
    doc.text(`Endereço da Obra/Serviço: ${budget.clientAddress}`, 18, y + 21);
  }

  y += 30;

  // Scope / Service Description
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('ESCOPO DO SERVIÇO', 14, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  const splitDesc = doc.splitTextToSize(budget.serviceDescription || budget.title, pageWidth - 28);
  doc.text(splitDesc, 14, y);
  y += splitDesc.length * 4.2 + 4;

  // Separate materials and labor
  const materials = budget.items.filter(i => i.type === 'material');
  const labor = budget.items.filter(i => i.type === 'labor');
  const otherItems = budget.items.filter(i => i.type === 'other');

  // Table 1: MATERIAIS
  if (materials.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('1. MATERIAIS E FORNECIMENTO', 14, y);
    y += 2;

    const materialsRows = materials.map((item, idx) => [
      String(idx + 1),
      item.description,
      String(item.quantity),
      item.unit || 'un',
      formatBRL(item.unitPrice),
      formatBRL(item.total),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Descrição do Material', 'Qtd', 'Unid.', 'Valor Unit.', 'Total']],
      body: materialsRows,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 65, 115],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 24, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-ignore
    y = doc.lastAutoTable.finalY + 6;
  }

  // Table 2: MÃO DE OBRA / SERVIÇOS
  if (labor.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('2. SERVIÇOS E MÃO DE OBRA', 14, y);
    y += 2;

    const laborRows = labor.map((item, idx) => [
      String(idx + 1),
      item.description,
      String(item.quantity),
      item.unit || 'un',
      formatBRL(item.unitPrice),
      formatBRL(item.total),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Etapa / Serviço', 'Qtd', 'Unid.', 'Valor Unit.', 'Total']],
      body: laborRows,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 65, 115],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 24, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    // @ts-ignore
    y = doc.lastAutoTable.finalY + 6;
  }

  // Summary and Total Card
  if (y > 220) {
    doc.addPage();
    y = 15;
  }

  const summaryBoxWidth = 85;
  const summaryBoxX = pageWidth - 14 - summaryBoxWidth;

  doc.setFillColor(248, 250, 253);
  doc.setDrawColor(215, 222, 235);
  doc.roundedRect(summaryBoxX, y, summaryBoxWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RESUMO FINANCEIRO', summaryBoxX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  let sumY = y + 12;
  const printSumRow = (label: string, value: string, isNeg = false) => {
    doc.text(label, summaryBoxX + 4, sumY);
    doc.text(value, summaryBoxX + summaryBoxWidth - 4, sumY, { align: 'right' });
    sumY += 5;
  };

  printSumRow('Subtotal Materiais:', formatBRL(budget.materialsSubtotal));
  printSumRow('Subtotal Mão de Obra:', formatBRL(budget.laborSubtotal));
  if (budget.displacementFee > 0) {
    printSumRow('Taxa de Deslocamento:', formatBRL(budget.displacementFee));
  }
  if (budget.discount > 0) {
    printSumRow('Desconto:', `- ${formatBRL(budget.discount)}`);
  }

  // Total Bar Highlight
  doc.setFillColor(15, 44, 89);
  doc.rect(summaryBoxX, y + 32, summaryBoxWidth, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('VALOR TOTAL:', summaryBoxX + 4, y + 38.5);
  doc.text(formatBRL(budget.total), summaryBoxX + summaryBoxWidth - 4, y + 38.5, { align: 'right' });

  // Execution and Payment details on the left side
  const leftBoxWidth = summaryBoxX - 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('CONDIÇÕES GERAIS', 14, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`Prazo estimado de execução: ${budget.executionDays || 1} dias úteis`, 14, y + 12);
  doc.text(`Condições de pagamento: ${budget.paymentTerms || 'Conforme alinhamento comercial'}`, 14, y + 17);

  if (budget.notes) {
    doc.text('Observações:', 14, y + 23);
    const splitNotes = doc.splitTextToSize(budget.notes, leftBoxWidth);
    doc.text(splitNotes, 14, y + 27);
  }

  y += 48;

  // Terms and conditions
  if (budget.terms) {
    if (y > 245) {
      doc.addPage();
      y = 15;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('TERMOS E CONDIÇÕES', 14, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);
    const splitTerms = doc.splitTextToSize(budget.terms, pageWidth - 28);
    doc.text(splitTerms, 14, y);
    y += splitTerms.length * 3.5 + 8;
  }

  // Signature Block
  if (y > 255) {
    doc.addPage();
    y = 20;
  }

  const signY = Math.max(y + 8, 255);
  doc.setDrawColor(180, 180, 180);
  doc.line(pageWidth / 2 - 40, signY, pageWidth / 2 + 40, signY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text(
    company.responsibleName || budget.responsibleName || company.name,
    pageWidth / 2,
    signY + 4.5,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text(
    company.responsibleRole ? `${company.responsibleRole} - ${company.name}` : company.name,
    pageWidth / 2,
    signY + 8.5,
    { align: 'center' }
  );

  return doc;
}
