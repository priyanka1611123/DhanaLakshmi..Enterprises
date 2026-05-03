import React from 'react';
import { X, Download, MessageCircle, Mail, Printer } from 'lucide-react';
import { calcItem, calcInvoice, fmtINR, numToWords } from '../../utils/helpers';
import { generatePDF } from '../../utils/pdfGenerator';

export default function InvoicePreviewModal({ inv, business, onClose, onWhatsApp, onEmail }) {
  const { subtotal, gstTotal, total, rows } = calcInvoice(inv.items);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 760 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Invoice Preview</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-green btn-sm" onClick={() => generatePDF(inv, business || {})}><Download size={13} /> PDF</button>
            <button className="btn btn-blue btn-sm" onClick={onEmail}><Mail size={13} /> Email</button>
            <button className="btn btn-sm" style={{ background: 'rgba(37,211,102,.12)', color: '#25d366', border: '1px solid rgba(37,211,102,.3)' }} onClick={onWhatsApp}><MessageCircle size={13} /> WhatsApp</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={13} /></button>
          </div>
        </div>

        {/* Invoice Preview */}
        <div id="invoice-preview" style={{
          background: '#fff', color: '#111', padding: '36px',
          borderRadius: 10, fontFamily: 'sans-serif', fontSize: 13
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', letterSpacing: 1 }}>
                {business?.name || 'DL ENTERPRISES'}
              </div>
              {business?.tagline && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{business.tagline}</div>}
              <div style={{ fontSize: 11, color: '#555', marginTop: 8, lineHeight: 1.8 }}>
                {business?.address && <div>{business.address}</div>}
                {business?.gstin && <div>GSTIN: {business.gstin}</div>}
                {business?.phone && <div>Ph: {business.phone}</div>}
                {business?.email && <div>{business.email}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: 2 }}>INVOICE</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginTop: 6 }}>{inv.invNo}</div>
              <div style={{ fontSize: 11, color: '#777', marginTop: 4 }}>Date: {inv.date}</div>
              <div style={{ fontSize: 11, color: '#777' }}>Due: {inv.due}</div>
              <div style={{
                display: 'inline-block', marginTop: 8, padding: '3px 12px',
                borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                background: inv.status === 'paid' ? '#dcfce7' : inv.status === 'overdue' ? '#fee2e2' : '#fef9c3',
                color: inv.status === 'paid' ? '#166534' : inv.status === 'overdue' ? '#991b1b' : '#854d0e'
              }}>{inv.status}</div>
            </div>
          </div>

          {/* Bill To */}
          <div style={{ background: '#f8f8f8', padding: '12px 16px', borderRadius: 8, marginBottom: 20, borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#888', letterSpacing: 1, marginBottom: 5 }}>BILL TO</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{inv.customer}</div>
            {inv.customerGstin && <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>GSTIN: {inv.customerGstin}</div>}
            {inv.customerAddress && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{inv.customerAddress}</div>}
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
            <thead>
              <tr style={{ background: '#111', color: '#f59e0b' }}>
                {['#', 'Description', 'Qty', 'Rate', 'GST%', 'GST Amt', 'Total'].map((h, i) => (
                  <th key={i} style={{ padding: '9px 10px', textAlign: i > 1 ? 'right' : 'left', fontWeight: 700, fontSize: 10, letterSpacing: .5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, i) => {
                const r = calcItem(it);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                    <td style={{ padding: '8px 10px', color: '#888' }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{it.desc}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{it.qty} {it.unit}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtINR(it.price)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{it.gst}%</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#059669' }}>{fmtINR(r.gstAmt)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{fmtINR(r.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <div style={{ width: 240 }}>
              {[
                { label: 'Subtotal', val: fmtINR(subtotal), color: '#333' },
                { label: 'GST Total', val: fmtINR(gstTotal), color: '#059669' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee', color: '#555', fontSize: 12 }}>
                  <span>{r.label}</span><span style={{ color: r.color, fontWeight: 600 }}>{r.val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #111', marginTop: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>Grand Total</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#f59e0b' }}>{fmtINR(total)}</span>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div style={{ background: '#111', color: '#e5e5e5', padding: '8px 14px', borderRadius: 6, fontSize: 11, marginBottom: 14 }}>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Amount in words: </span>{numToWords(total)}
          </div>

          {/* Notes */}
          {inv.notes && (
            <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 6, fontSize: 11, color: '#555', marginBottom: 14 }}>
              <strong>Notes:</strong> {inv.notes}
            </div>
          )}

          {/* Bank Details */}
          {business?.bank && (
            <div style={{ padding: '10px 14px', background: '#f0f9ff', borderRadius: 6, fontSize: 11, color: '#333' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Bank Details</div>
              <div>Bank: {business.bank}</div>
              <div>A/C No: {business.account}</div>
              <div>IFSC: {business.ifsc}</div>
            </div>
          )}

          <div style={{ marginTop: 20, fontSize: 10, color: '#aaa', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: 12 }}>
            Thank you for your business! · This is a computer-generated invoice.
          </div>
        </div>
      </div>
    </div>
  );
}
