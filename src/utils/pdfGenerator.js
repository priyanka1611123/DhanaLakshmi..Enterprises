import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calcItem, calcInvoice, fmtINR, numToWords } from './helpers';

export const generatePDF = (inv, business = {}) => {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W   = 210;
    const M   = 14;
    const PH  = 297;
    const { subtotal, gstTotal, total } = calcInvoice(inv.items || []);

    // helpers
    const sc  = (r,g,b) => doc.setTextColor(r,g,b);
    const sf  = (r,g,b) => doc.setFillColor(r,g,b);
    const sd  = (r,g,b) => doc.setDrawColor(r,g,b);
    const bt  = (sz,r,g,b) => { doc.setFont('helvetica','bold');   doc.setFontSize(sz); sc(r,g,b); };
    const nt  = (sz,r,g,b) => { doc.setFont('helvetica','normal'); doc.setFontSize(sz); sc(r,g,b); };

    // ── HEADER ──────────────────────────────────────
    sf(15,17,23); doc.rect(0,0,W,44,'F');

    bt(20,245,158,11);
    doc.text((business.name||'DL ENTERPRISES').toUpperCase(), M, 15);

    nt(8,140,146,164);
    doc.text(business.tagline||'Quality · Trust · Excellence', M, 22);

    nt(7.5,180,185,195);
    const det = [
      business.address||'',
      business.gstin ? 'GSTIN: '+business.gstin : '',
      business.phone ? 'Ph: '+business.phone : '',
      business.email || ''
    ].filter(Boolean).join('   |   ');
    doc.text(det, M, 29);

    bt(24,245,158,11);
    doc.text('INVOICE', W-M, 17, {align:'right'});

    nt(8.5,200,205,215);
    doc.text('# '+(inv.invNo||''),    W-M, 26, {align:'right'});
    doc.text('Date: '+(inv.date||''), W-M, 32, {align:'right'});
    doc.text('Due:  '+(inv.due||''),  W-M, 38, {align:'right'});

    // status pill
    const pc = inv.status==='paid'?[16,185,129]:inv.status==='overdue'?[239,68,68]:[245,158,11];
    sf(...pc);
    doc.roundedRect(W-M-26,39,26,7,2,2,'F');
    bt(7,255,255,255);
    doc.text((inv.status||'pending').toUpperCase(), W-M-13, 44, {align:'center'});

    // ── BILL TO ─────────────────────────────────────
    let y = 52;
    sf(245,246,248); sd(225,228,232);
    doc.rect(M, y, 88, 28, 'FD');

    bt(7,120,125,135); doc.text('BILL TO', M+3, y+6);
    bt(10,20,22,30);   doc.text(inv.customer||'', M+3, y+14);
    nt(8,80,85,95);
    let by2 = y+20;
    if(inv.customerGstin)   { doc.text('GSTIN: '+inv.customerGstin, M+3, by2); by2+=5; }
    if(inv.customerAddress) { doc.text(doc.splitTextToSize(inv.customerAddress,82), M+3, by2); }

    // invoice details box
    const rx = W/2+4, rw = W/2-M-4;
    sf(245,246,248); sd(225,228,232);
    doc.rect(rx, y, rw, 28, 'FD');
    bt(7,120,125,135); doc.text('INVOICE DETAILS', rx+3, y+6);
    nt(8.5,40,45,55);
    doc.text('Invoice No : '+(inv.invNo||''), rx+3, y+13);
    doc.text('Date       : '+(inv.date||''),  rx+3, y+19);
    doc.text('Due Date   : '+(inv.due||''),   rx+3, y+25);

    // ── ITEMS TABLE ──────────────────────────────────
    y = 88;
    const rows = (inv.items||[]).map((it,i) => {
      const r = calcItem(it);
      return [
        String(i+1),
        it.desc||'',
        (it.qty||0)+' '+(it.unit||''),
        fmtINR(it.price),
        (it.gst||0)+'%',
        fmtINR(r.gstAmt),
        fmtINR(r.total),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['#','Description','Qty','Rate','GST%','GST Amt','Amount']],
      body: rows,
      theme: 'striped',
      headStyles:          { fillColor:[15,17,23], textColor:[245,158,11], fontStyle:'bold', fontSize:8 },
      bodyStyles:          { fontSize:8.5, textColor:[30,35,45] },
      alternateRowStyles:  { fillColor:[250,251,252] },
      columnStyles: {
        0: { cellWidth:8,  halign:'center' },
        1: { cellWidth:62 },
        2: { cellWidth:22 },
        3: { cellWidth:24, halign:'right' },
        4: { cellWidth:14, halign:'center' },
        5: { cellWidth:24, halign:'right' },
        6: { cellWidth:26, halign:'right', fontStyle:'bold' },
      },
      margin: { left:M, right:M },
    });

    y = doc.lastAutoTable.finalY + 8;

    // ── TOTALS ───────────────────────────────────────
    const totW=70, totX=W-M-totW;
    sf(248,249,250); sd(218,220,226);
    doc.rect(totX, y, totW, 20, 'FD');

    nt(8.5,60,65,75);
    doc.text('Subtotal',       totX+3,       y+8);
    doc.text(fmtINR(subtotal), totX+totW-3,  y+8, {align:'right'});

    nt(8.5,16,120,80);
    doc.text('GST Total',      totX+3,       y+15);
    doc.text(fmtINR(gstTotal), totX+totW-3,  y+15, {align:'right'});

    sf(15,17,23);
    doc.rect(totX, y+20, totW, 12, 'F');
    bt(10,245,158,11);
    doc.text('GRAND TOTAL',   totX+3,       y+28);
    doc.text(fmtINR(total),   totX+totW-3,  y+28, {align:'right'});

    y += 36;

    // ── AMOUNT IN WORDS ──────────────────────────────
    sf(15,17,23);
    doc.rect(M, y, W-M*2, 10, 'F');
    doc.setFont('helvetica','italic'); doc.setFontSize(7.5); sc(210,215,225);
    const wl = doc.splitTextToSize('Amount in words: '+numToWords(total), W-M*2-6);
    doc.text(wl, M+3, y+6.5);
    y += 14;

    // ── NOTES ────────────────────────────────────────
    if(inv.notes && inv.notes.trim()) {
      sf(255,251,235); sd(245,200,100);
      doc.rect(M, y, W-M*2, 14, 'FD');
      bt(7.5,120,90,20); doc.text('Notes:', M+3, y+6);
      nt(8,60,65,75);
      doc.text(doc.splitTextToSize(inv.notes, W-M*2-22), M+22, y+6);
      y += 18;
    }

    // ── BANK DETAILS ─────────────────────────────────
    if(business.bank && business.bank.trim()) {
      sf(240,248,255); sd(180,210,240);
      doc.rect(M, y, 90, 24, 'FD');
      bt(7.5,20,80,140); doc.text('BANK DETAILS', M+3, y+6);
      nt(8,30,35,50);
      doc.text('Bank : '+(business.bank||''),    M+3, y+12);
      doc.text('A/C  : '+(business.account||''), M+3, y+17);
      doc.text('IFSC : '+(business.ifsc||''),    M+3, y+22);
      y += 28;
    }

    // ── SIGNATURE ────────────────────────────────────
    const sigY = PH - 38;
    const sigX = W - M - 55;
    sd(160,165,175);
    doc.line(sigX, sigY, sigX+55, sigY);
    nt(8,100,105,115);
    doc.text('Authorised Signatory',         sigX+27, sigY+5,  {align:'center'});
    bt(8,60,65,75);
    doc.text(business.name||'DL Enterprises', sigX+27, sigY+11, {align:'center'});

    // ── FOOTER ───────────────────────────────────────
    sf(15,17,23);
    doc.rect(0, PH-12, W, 12, 'F');
    nt(7,140,146,164);
    doc.text(
      'This is a computer-generated invoice  ·  No physical signature required  ·  Thank you for your business!',
      W/2, PH-5, {align:'center'}
    );

    // ── DOWNLOAD ─────────────────────────────────────
    const fname = ((inv.invNo||'Invoice').replace(/\//g,'-'))+'.pdf';
    doc.save(fname);

  } catch(err) {
    console.error('PDF error:', err);
    alert('Could not generate PDF: '+err.message);
  }
};
