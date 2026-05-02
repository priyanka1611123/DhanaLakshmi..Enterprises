import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { calcItem, calcInvoice, fmtINR, numToWords } from './helpers';

export const generatePDF = (inv, business = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 14;
  const { subtotal, gstTotal, total } = calcInvoice(inv.items);

  // ── Header band ──────────────────────────────────
  doc.setFillColor(15, 17, 23);
  doc.rect(0, 0, W, 42, 'F');

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(245, 158, 11);
  doc.text(business.name || 'DL ENTERPRISES', M, 16);

  // Tagline
  doc.setFontSize(8);
  doc.setTextColor(140, 146, 164);
  doc.text(business.tagline || 'Quality · Trust · Excellence', M, 22);

  // Company details
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text([
    business.address || 'Chennai, Tamil Nadu',
    `GSTIN: ${business.gstin || 'YOUR GSTIN HERE'}`,
    `Phone: ${business.phone || ''}  |  Email: ${business.email || ''}`
  ], M, 29);

  // INVOICE label (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(245, 158, 11);
  doc.text('INVOICE', W - M, 18, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`#${inv.invNo}`, W - M, 26, { align: 'right' });
  doc.text(`Date: ${inv.date}   Due: ${inv.due}`, W - M, 32, { align: 'right' });

  // Status badge
  const statusColors = { paid: [16, 185, 129], pending: [245, 158, 11], overdue: [239, 68, 68] };
  const sc = statusColors[inv.status] || statusColors.pending;
  doc.setFillColor(...sc);
  doc.roundedRect(W - M - 22, 34, 22, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text((inv.status || 'pending').toUpperCase(), W - M - 11, 39, { align: 'center' });

  // ── Bill To / Ship To ─────────────────────────────
  let y = 50;
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, (W - M * 2) / 2 - 4, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('BILL TO', M + 3, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 17, 23);
  doc.text(inv.customer || '', M + 3, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  if (inv.customerGstin) doc.text(`GSTIN: ${inv.customerGstin}`, M + 3, y + 20);
  if (inv.customerAddress) doc.text(inv.customerAddress, M + 3, y + 26, { maxWidth: 80 });

  // ── Items Table ───────────────────────────────────
  y = 86;
  const tableRows = (inv.items || []).map((it, i) => {
    const r = calcItem(it);
    return [
      i + 1,
      it.desc,
      `${it.qty} ${it.unit || ''}`,
      fmtINR(it.price),
      `${it.gst}%`,
      fmtINR(r.gstAmt),
      fmtINR(r.total)
    ];
  });

  doc.autoTable({
    startY: y,
    head: [['#', 'Description', 'Qty', 'Rate', 'GST%', 'GST Amt', 'Amount']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 17, 23],
      textColor: [245, 158, 11],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 65 },
      2: { cellWidth: 20 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: M, right: M }
  });

  y = doc.lastAutoTable.finalY + 6;

  // ── Totals ────────────────────────────────────────
  const totX = W - M - 65;
  doc.setFillColor(245, 245, 245);
  doc.rect(totX, y, 65, 30, 'F');

  const totRow = (label, value, bold = false, color = [30, 30, 30]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 8.5);
    doc.setTextColor(...color);
    doc.text(label, totX + 4, y + 5);
    doc.text(value, totX + 63, y + 5, { align: 'right' });
    y += 7;
  };

  totRow('Subtotal', fmtINR(subtotal));
  totRow('GST Total', fmtINR(gstTotal), false, [16, 120, 80]);
  doc.setDrawColor(200, 200, 200);
  doc.line(totX + 2, y - 1, totX + 63, y - 1);
  totRow('GRAND TOTAL', fmtINR(total), true, [245, 158, 11]);

  // ── Amount in words ───────────────────────────────
  y += 4;
  doc.setFillColor(15, 17, 23);
  doc.rect(M, y, W - M * 2, 10, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 220, 220);
  doc.text(`Amount in words: ${numToWords(total)}`, M + 3, y + 6.5);

  // ── Notes ─────────────────────────────────────────
  if (inv.notes) {
    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Notes:', M, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text(inv.notes, M, y + 5, { maxWidth: W - M * 2 });
    y += 14;
  }

  // ── Bank Details ──────────────────────────────────
  if (business.bank) {
    y += 6;
    doc.setFillColor(248, 248, 248);
    doc.rect(M, y, 80, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('BANK DETAILS', M + 3, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text([
      `Bank: ${business.bank || ''}`,
      `A/C: ${business.account || ''}`,
      `IFSC: ${business.ifsc || ''}`,
    ], M + 3, y + 12);
  }

  // ── Signature ─────────────────────────────────────
  const sigX = W - M - 50;
  const sigY = doc.internal.pageSize.height - 30;
  doc.setDrawColor(150, 150, 150);
  doc.line(sigX, sigY + 10, sigX + 50, sigY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Authorised Signatory', sigX + 25, sigY + 15, { align: 'center' });
  doc.text(business.name || 'DL Enterprises', sigX + 25, sigY + 20, { align: 'center' });

  // ── Footer ────────────────────────────────────────
  doc.setFillColor(15, 17, 23);
  doc.rect(0, doc.internal.pageSize.height - 10, W, 10, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 146, 164);
  doc.text(
    'This is a computer-generated invoice. No signature required.',
    W / 2,
    doc.internal.pageSize.height - 4,
    { align: 'center' }
  );

  doc.save(`${inv.invNo.replace(/\//g, '-')}.pdf`);
};
