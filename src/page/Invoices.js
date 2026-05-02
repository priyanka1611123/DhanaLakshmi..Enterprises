import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, PlusSquare, Download, MessageCircle,
  Trash2, Eye, Filter, FileText, Mail
} from 'lucide-react';
import { deleteInvoice, updateInvoice } from '../supabase/services';
import { useAuth } from '../hooks/useAuth';
import { calcInvoice, fmtINR, whatsappMsg, fmtDate } from '../utils/helpers';
import { generatePDF } from '../utils/pdfGenerator';
import { StatusBadge } from './Dashboard';
import InvoicePreviewModal from '../components/invoice/InvoicePreviewModal';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';

export default function Invoices({ invoices, customers, business }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewInv, setViewInv] = useState(null);
  const [delId, setDelId] = useState(null);

  const filtered = useMemo(() => {
    return invoices.filter(i => {
      const match = (i.customer || '').toLowerCase().includes(q.toLowerCase()) ||
        (i.invNo || '').toLowerCase().includes(q.toLowerCase());
      const st = filter === 'all' || i.status === filter;
      return match && st;
    });
  }, [invoices, q, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice permanently?')) return;
    try {
      await deleteInvoice(user.id, id);
      toast.success('Invoice deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleStatus = async (inv, status) => {
    try {
      await updateInvoice(user.id, inv.id, { status });
      toast.success(`Marked as ${status}`);
    } catch { toast.error('Update failed'); }
  };

  const handleWhatsApp = (inv) => {
    const { total } = calcInvoice(inv.items);
    const cust = customers.find(c => c.id === inv.customerId);
    const phone = cust?.phone?.replace(/\D/g, '') || '';
    const msg = whatsappMsg(inv, total);
    window.open(phone
      ? `https://wa.me/91${phone}?text=${msg}`
      : `https://wa.me/?text=${msg}`, '_blank');
  };

  const handleEmail = async (inv) => {
    const { total } = calcInvoice(inv.items);
    const cust = customers.find(c => c.id === inv.customerId);
    if (!cust?.email) return toast.error('No email for this customer');
    // EmailJS – configure in Settings
    if (!business?.emailjsServiceId) return toast.error('Configure EmailJS in Settings first');
    try {
      await emailjs.send(
        business.emailjsServiceId,
        business.emailjsTemplateId,
        {
          to_name: inv.customer,
          to_email: cust.email,
          inv_no: inv.invNo,
          inv_date: inv.date,
          inv_due: inv.due,
          total: fmtINR(total),
          company: business.name || 'DL Enterprises',
        },
        business.emailjsPublicKey
      );
      toast.success(`Email sent to ${cust.email}`);
    } catch { toast.error('Email send failed. Check EmailJS config.'); }
  };

  const totals = useMemo(() => {
    const t = filtered.reduce((s, i) => s + calcInvoice(i.items).total, 0);
    return t;
  }, [filtered]);

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <div className="page-title">Invoices</div>
          <div className="page-sub">{filtered.length} invoices · Total {fmtINR(totals)}</div>
        </div>
        <button className="btn btn-primary" onClick={() => nav('/create')}>
          <PlusSquare size={15} /> New Invoice
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} className="search-icon" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search invoice or customer..." />
        </div>
        <div className="pill-tabs">
          {['all', 'paid', 'pending', 'overdue'].map(f => (
            <button key={f} className={`pill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>GST</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                <FileText size={32} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--muted2)' }} />
                No invoices found
              </td></tr>
            )}
            {filtered.map(inv => {
              const { total, gstTotal } = calcInvoice(inv.items);
              return (
                <tr key={inv.id}>
                  <td>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => setViewInv(inv)}>{inv.invNo}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{inv.customer}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>{inv.date}</td>
                  <td style={{ color: inv.status === 'overdue' ? 'var(--red)' : 'var(--muted)', fontSize: 12 }}>{inv.due}</td>
                  <td style={{ fontWeight: 700 }}>{fmtINR(total)}</td>
                  <td style={{ color: 'var(--green)', fontSize: 12 }}>{fmtINR(gstTotal)}</td>
                  <td>
                    <select
                      value={inv.status}
                      onChange={e => handleStatus(inv, e.target.value)}
                      style={{ width: 'auto', fontSize: 11, padding: '5px 8px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 6 }}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Preview" onClick={() => setViewInv(inv)}><Eye size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Download PDF" onClick={() => generatePDF(inv, business)}><Download size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="WhatsApp" style={{ color: '#25d366' }} onClick={() => handleWhatsApp(inv)}><MessageCircle size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Email" onClick={() => handleEmail(inv)}><Mail size={13} /></button>
                      <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => handleDelete(inv.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewInv && (
        <InvoicePreviewModal
          inv={viewInv}
          business={business}
          onClose={() => setViewInv(null)}
          onWhatsApp={() => handleWhatsApp(viewInv)}
          onEmail={() => handleEmail(viewInv)}
        />
      )}
    </div>
  );
}
