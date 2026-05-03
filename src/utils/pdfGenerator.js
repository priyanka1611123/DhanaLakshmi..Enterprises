import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calcItem, calcInvoice, fmtINR, numToWords } from './helpers';

export const generatePDF = (inv, business) => {
  try {
    // ✅ FORCE FIX (this is key)
    business = business || {};

    if (!inv || !inv.items) {
      console.error("Invalid invoice data", inv);
      alert("Invoice data missing");
      return;
    }

    if (!business) {
      console.warn("Business is null, using defaults");
      business = {};
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, M = 14;

    const { subtotal, gstTotal, total } = calcInvoice(inv.items);

    // ── Header ─────────────────────────────
    doc.setFillColor(15, 17, 23);
    doc.rect(0, 0, W, 42, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(245, 158, 11);
    doc.text(business?.name || 'DL ENTERPRISES', M, 16);

    doc.setFontSize(8);
    doc.setTextColor(140, 146, 164);
    doc.text(business?.tagline || 'Quality · Trust · Excellence', M, 22);

    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text([
      business?.address || '',
      `GSTIN: ${business?.gstin || '-'}`,
      `Phone: ${business?.phone || ''} | Email: ${business?.email || ''}`
    ], M, 29);

    // ── Invoice title ──────────────────────
    doc.setFontSize(26);
    doc.setTextColor(245, 158, 11);
    doc.text('INVOICE', W - M, 18, { align: 'right' });

    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text(`#${inv.invNo || '-'}`, W - M, 26, { align: 'right' });
    doc.text(`Date: ${inv.date || '-'}   Due: ${inv.due || '-'}`, W - M, 32, { align: 'right' });

    // ── Status badge ───────────────────────
    const statusColors = {
      paid: [16, 185, 129],
      pending: [245, 158, 11],
      overdue: [239, 68, 68]
    };

    const sc = statusColors[inv.status] || statusColors.pending;
    doc.setFillColor(...sc);
    doc.roundedRect(W - M - 22, 34, 22, 7, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text((inv.status || 'pending').toUpperCase(), W - M - 11, 39, { align: 'center' });

    // ── Customer ───────────────────────────
    let y = 50;

    doc.setFillColor(245, 245, 245);
    doc.rect(M, y, 90, 30, 'F');

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('BILL TO', M + 3, y + 6);

    doc.setFontSize(10);
    doc.setTextColor(15, 17, 23);
    doc.text(inv.customer || '', M + 3, y + 14);

    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    if (inv.customerGstin) doc.text(`GSTIN: ${inv.customerGstin}`, M + 3, y + 20);
    if (inv.customerAddress) doc.text(inv.customerAddress, M + 3, y + 26, { maxWidth: 80 });

    // ── Items Table ────────────────────────
    y = 86;

    const tableRows = (inv.items || []).map((it, i) => {
      const r = calcItem(it);
      return [
        i + 1,
        it.desc || '',
        `${it.qty || 0}`,
        fmtINR(it.price || 0),
        `${it.gst || 0}%`,
        fmtINR(r.gstAmt),
        fmtINR(r.total)
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['#', 'Description', 'Qty', 'Rate', 'GST%', 'GST Amt', 'Amount']],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 17, 23],
        textColor: [245, 158, 11],
        fontSize: 8
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: M, right: M }
    });

    y = doc.lastAutoTable.finalY + 6;

    // ── Totals ─────────────────────────────
    const totX = W - M - 65;

    doc.setFillColor(245, 245, 245);
    doc.rect(totX, y, 65, 28, 'F');

    const row = (label, value, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.text(label, totX + 4, y + 6);
      doc.text(value, totX + 60, y + 6, { align: 'right' });
      y += 7;
    };

    row('Subtotal', fmtINR(subtotal));
    row('GST Total', fmtINR(gstTotal));
    row('Grand Total', fmtINR(total), true);

    // ── Words ──────────────────────────────
    y += 5;
    doc.setFontSize(8);
    doc.text(`Amount in words: ${numToWords(total)}`, M, y);

    // ── Footer ─────────────────────────────
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'This is a computer-generated invoice.',
      W / 2,
      doc.internal.pageSize.height - 5,
      { align: 'center' }
    );

    // ── Save ───────────────────────────────
    doc.save(`${(inv.invNo || 'invoice').replace(/\//g, '-')}.pdf`);

  } catch (err) {
    console.error("PDF ERROR:", err);
    alert("PDF generation failed. Check console.");
  }
};
