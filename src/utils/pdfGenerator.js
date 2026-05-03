import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calcItem, calcInvoice, fmtINR, numToWords } from './helpers';

export const generatePDF = (inv, business = {}) => {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W  = 210;
    const M  = 14;
    const PH = 297;
    const { subtotal, gstTotal, total } = calcInvoice(inv.items || []);

    // ── Shorthand helpers ─────────────────────────
    const sc = (r,g,b)     => doc.setTextColor(r,g,b);
    const sf = (r,g,b)     => doc.setFillColor(r,g,b);
    const sd = (r,g,b)     => doc.setDrawColor(r,g,b);
    const bt = (sz,r,g,b)  => { doc.setFont('helvetica','bold');   doc.setFontSize(sz); sc(r,g,b); };
    const nt = (sz,r,g,b)  => { doc.setFont('helvetica','normal'); doc.setFontSize(sz); sc(r,g,b); };

    // ── HEADER BAND ──────────────────────────────
    sf(15,17,23);
    doc.rect(0, 0, W, 44, 'F');

    bt(20, 245,158,11);
    doc.text((business.name || 'DL ENTERPRISES').toUpperCase(), M, 15);

    nt(8, 140,146,164);
    doc.text(business.tagline || 'Quality · Trust · Excellence', M, 22);

    nt(7.5, 175,180,190);
    const detArr = [
      business.address || '',
      business.gstin   ? 'GSTIN: ' + business.gstin : '',
      business.phone   ? 'Ph: '    + business.phone  : '',
      business.email   || '',
    ].filter(Boolean);
    if (detArr.length) doc.text(detArr.join('   |   '), M, 29);

    bt(24, 245,158,11);
    doc.text('INVOICE', W - M, 17, { align: 'right' });

    nt(8.5, 195,200,210);
    doc.text('# ' + (inv.invNo || ''),     W - M, 26, { align: 'right' });
    doc.text('Date: ' + (inv.date || ''),  W - M, 32, { align: 'right' });
    doc.text('Due:  ' + (inv.due  || ''),  W - M, 38, { align: 'right' });

    // status pill
    const pc = inv.status === 'paid'    ? [16,185,129]
             : inv.status === 'overdue' ? [239,68,68]
             :                            [245,158,11];
    sf(...pc);
    doc.roundedRect(W - M - 26, 39, 26, 7, 2, 2, 'F');
    bt(7, 255,255,255);
    doc.text((inv.status || 'pending').toUpperCase(), W - M - 13, 44, { align: 'center' });

    // ── BILL TO ──────────────────────────────────
    let y = 52;
    sf(245,246,248); sd(220,223,228);
    doc.rect(M, y, 88, 28, 'FD');

    bt(7, 120,125,135);
    doc.text('BILL TO', M + 3, y + 6);

    bt(10, 20,22,30);
    doc.text(String(inv.customer || ''), M + 3, y + 14);

    nt(8, 80,85,95);
    let billY = y + 20;
    if (inv.customerGstin) {
      doc.text('GSTIN: ' + inv.customerGstin, M + 3, billY);
      billY += 5;
    }
    if (inv.customerAddress) {
      const lines = doc.splitTextToSize(String(inv.customerAddress), 82);
      doc.text(lines, M + 3, billY);
    }

    // ── INVOICE DETAILS BOX ──────────────────────
    const rx = W / 2 + 4;
    const rw = W / 2 - M - 4;
    sf(245,246,248); sd(220,223,228);
    doc.rect(rx, y, rw, 28, 'FD');

    bt(7, 120,125,135);
    doc.text('INVOICE DETAILS', rx + 3, y + 6);

    nt(8.5, 40,45,55);
    doc.text('Invoice No : ' + (inv.invNo || ''), rx + 3, y + 13);
    doc.text('Date       : ' + (inv.date  || ''), rx + 3, y + 19);
    doc.text('Due Date   : ' + (inv.due   || ''), rx + 3, y + 25);

    // ── ITEMS TABLE ──────────────────────────────
    y = 88;
    const rows = (inv.items || []).map((it, i) => {
      const r = calcItem(it);
      return [
        String(i + 1),
        String(it.desc || ''),
        String(it.qty || 0) + ' ' + String(it.unit || ''),
        fmtINR(it.price),
        String(it.gst || 0) + '%',
        fmtINR(r.gstAmt),
        fmtINR(r.total),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['#', 'Description', 'Qty', 'Rate', 'GST%', 'GST Amt', 'Amount']],
      body: rows.length > 0 ? rows : [['1', 'No items', '', '', '', '', '']],
      theme: 'striped',
      headStyles: {
        fillColor:  [15, 17, 23],
        textColor:  [245, 158, 11],
        fontStyle:  'bold',
        fontSize:   8,
      },
      bodyStyles: {
        fontSize:   8.5,
        textColor:  [30, 35, 45],
      },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        1: { cellWidth: 62 },
        2: { cellWidth: 22 },
        3: { cellWidth: 24, halign: 'right' },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: M, right: M },
    });

    y = doc.lastAutoTable.finalY + 8;

    // ── TOTALS ───────────────────────────────────
    const totW = 70;
    const totX = W - M - totW;

    sf(248,249,250); sd(215,218,224);
    doc.rect(totX, y, totW, 20, 'FD');

    nt(8.5, 60,65,75);
    doc.text('Subtotal',        totX + 3,        y + 8);
    doc.text(fmtINR(subtotal),  totX + totW - 3, y + 8,  { align: 'right' });

    nt(8.5, 16,120,80);
    doc.text('GST Total',       totX + 3,        y + 15);
    doc.text(fmtINR(gstTotal),  totX + totW - 3, y + 15, { align: 'right' });

    sf(15,17,23);
    doc.rect(totX, y + 20, totW, 12, 'F');
    bt(10, 245,158,11);
    doc.text('GRAND TOTAL',     totX + 3,        y + 28);
    doc.text(fmtINR(total),     totX + totW - 3, y + 28, { align: 'right' });

    y += 36;

    // ── AMOUNT IN WORDS ──────────────────────────
    sf(15,17,23);
    doc.rect(M, y, W - M * 2, 10, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    sc(210,215,225);
    const wordLines = doc.splitTextToSize('Amount in words: ' + numToWords(total), W - M * 2 - 6);
    doc.text(wordLines, M + 3, y + 6.5);
    y += 14;

    // ── NOTES ────────────────────────────────────
    if (inv.notes && String(inv.notes).trim()) {
      sf(255,251,235); sd(240,195,95);
      doc.rect(M, y, W - M * 2, 14, 'FD');
      bt(7.5, 120,90,20);
      doc.text('Notes:', M + 3, y + 6);
      nt(8, 60,65,75);
      const nl = doc.splitTextToSize(String(inv.notes), W - M * 2 - 22);
      doc.text(nl, M + 22, y + 6);
      y += 18;
    }

    // ── BANK DETAILS ─────────────────────────────
    if (business.bank && String(business.bank).trim()) {
      sf(240,248,255); sd(175,208,240);
      doc.rect(M, y, 90, 24, 'FD');
      bt(7.5, 20,80,140);
      doc.text('BANK DETAILS', M + 3, y + 6);
      nt(8, 30,35,50);
      doc.text('Bank : ' + String(business.bank    || ''), M + 3, y + 12);
      doc.text('A/C  : ' + String(business.account || ''), M + 3, y + 17);
      doc.text('IFSC : ' + String(business.ifsc    || ''), M + 3, y + 22);
      y += 28;
    }

    // ── SIGNATURE ────────────────────────────────
    const sigY = PH - 38;
    const sigX = W - M - 55;
    sd(155,160,170);
    doc.line(sigX, sigY, sigX + 55, sigY);
    nt(8, 100,105,115);
    doc.text('Authorised Signatory', sigX + 27, sigY + 6,  { align: 'center' });
    bt(8, 60,65,75);
    doc.text(String(business.name || 'DL Enterprises'), sigX + 27, sigY + 12, { align: 'center' });

    // ── FOOTER ───────────────────────────────────
    sf(15,17,23);
    doc.rect(0, PH - 12, W, 12, 'F');
    nt(7, 140,146,164);
    doc.text(
      'This is a computer-generated invoice  ·  Thank you for your business!',
      W / 2, PH - 5, { align: 'center' }
    );

    // ── DOWNLOAD via Blob (most reliable) ────────
    const filename = String(inv.invNo || 'Invoice').replace(/\//g, '-') + '.pdf';

    // Method: output as blob and create download link
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link    = document.createElement('a');
    link.href     = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL after short delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);

  } catch (err) {
    console.error('PDF generation failed:', err);
    alert('PDF Error: ' + err.message + '\n\nCheck browser console for details.');
  }
};
