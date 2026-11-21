'use strict';
const PDFDocument = require('pdfkit');

const money = pence => `GBP ${(pence / 100).toFixed(2)}`;

function document(title, lines) {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ margin: 55 });
    const chunks = [];
    pdf.on('data', chunk => chunks.push(chunk));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
    pdf.fontSize(20).text('Kel Kamara');
    pdf.moveDown().fontSize(18).text(title);
    pdf.moveDown().fontSize(11);
    for (const line of lines) pdf.text(String(line)).moveDown(0.7);
    pdf.end();
  });
}

function invoicePdf(invoice) {
  return document(`Invoice #${invoice.id}`, [
    `Bill to: ${invoice.firstName} ${invoice.lastName}`,
    `Email: ${invoice.email}`,
    `Due: ${invoice.dueDate}`,
    `Amount: ${money(invoice.amountPence)}`,
    `Description:\n${invoice.description}`,
    `Payment instructions:\n${invoice.paymentInstructions}`,
    ...(invoice.paymentLink ? [`Payment link: ${invoice.paymentLink}`] : []),
  ]);
}

function agreementPdf(agreement) {
  return document(agreement.title, [
    `Client: ${agreement.firstName} ${agreement.lastName}`,
    agreement.body,
    'Client signature: ______________________________',
    'Date: ______________________________',
  ]);
}

function paymentCsv(payments) {
  const cell = value => {
    let text = String(value == null ? '' : value);
    if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const rows = [
    ['Client', 'Email', 'Date', 'Amount (GBP)', 'Method', 'Invoice', 'Details'],
    ...payments.map(p => [
      `${p.firstName} ${p.lastName}`, p.email, p.paidDate,
      (p.amountPence / 100).toFixed(2), p.method, p.invoiceId || '', p.details,
    ]),
  ];
  return Buffer.from('\ufeff' + rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n', 'utf8');
}

module.exports = { invoicePdf, agreementPdf, paymentCsv };
