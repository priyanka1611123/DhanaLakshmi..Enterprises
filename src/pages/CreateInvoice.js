import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, Save, Eye } from 'lucide-react';
import { addInvoice } from '../supabase/services';
import { useAuth } from '../hooks/useAuth';
import { calcItem, calcInvoice, fmtINR, genInvNo, validateGSTIN, stateFromGSTIN, today, dueDate } from '../utils/helpers';
import InvoicePreviewModal from '../components/invoice/InvoicePreviewModal';
import toast from 'react-hot-toast';

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['nos', 'meter', 'kg', 'ltr', 'box', 'set', 'pair', 'hour', 'sqft', 'piece'];

const emptyItem = () => ({ desc: '', qty: 1, unit: 'nos', price: 0, gst: 18 });

export default function CreateInvoice({ invoices, customers, business }) {
  const { user } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    invNo: genInvNo(business?.prefix || 'DL', invoices.length + 1),
    date: today(),
    due: dueDate(today()),
    customerId: '',
    customer: '',
    customerGstin: '',
    customerAddress: '',
    status: 'pending',
    notes: '',
  });
  const [items, setItems] = useState([emptyItem()]);
  const [gstinError, setGstinError] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  // Auto-fill from customer select
  const selectCustomer = (id) => {
    const c = customers.find(x => x.id === id);
    if (c) {
      setForm(f => ({
        ...f,
        customerId: c.id,
        customer: c.name,
        customerGstin: c.gstin || '',
        customerAddress: c.address || '',
      }));
      setGstinError('');
    } else {
      setForm(f => ({ ...f, customerId: '', customer: '', customerGstin: '', customerAddress: '' }));
    }
  };

  const validateGst = (val) => {
    const r = validateGSTIN(val);
    setGstinError(r.msg);
    return r.valid;
  };

  const updItem = (i, k, v) => {
    setItems(prev => prev.map((it, idx) =>
      idx === i ? { ...it, [k]: ['qty', 'price', 'gst'].includes(k) ? Number(v) || 0 : v } : it
    ));
  };

  const { subtotal, gstTotal, total } = calcInvoice(items);

  const handleSave = async () => {
    if (!form.customer) return toast.error('Select or enter a customer');
    if (items.some(it => !it.desc)) return toast.error('Fill all item descriptions');
    if (gstinError) return toast.error('Fix GSTIN error first');
    setSaving(true);
    try {
      await addInvoice(user.id, { ...form, items });
      toast.success('Invoice saved!');
      nav('/invoices');
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <div className="page-title">Create Invoice</div>
          <div className="page-sub">Fill in details to generate GST invoice</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setPreview(true)}><Eye size={14} /> Preview</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 18, alignItems: 'start' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Invoice Details */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 16 }}>Invoice Details</div>
            <div className="grid-2">
              <div className="form-group">
                <label>Invoice Number</label>
                <input value={form.invNo} onChange={e => setForm(f => ({ ...f, invNo: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="form-group">
                <label>Invoice Date</label>
                <input type="date" value={form.date} onChange={e => {
                  const d = e.target.value;
                  setForm(f => ({ ...f, date: d, due: dueDate(d) }));
                }} />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 16 }}>Customer Details</div>
            <div className="form-group">
              <label>Select Saved Customer</label>
              <select value={form.customerId} onChange={e => selectCustomer(e.target.value)}>
                <option value="">-- Choose from directory --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Customer Name *</label>
              <input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} placeholder="Customer or company name" />
            </div>
            <div className="form-group">
              <label>Customer GSTIN</label>
              <input
                value={form.customerGstin}
                onChange={e => {
                  const v = e.target.value.toUpperCase();
                  setForm(f => ({ ...f, customerGstin: v }));
                  validateGst(v);
                }}
                placeholder="e.g. 33AABCD1234E1ZX"
                className={gstinError ? 'input-error' : ''}
              />
              {gstinError && <div className="error-msg">{gstinError}</div>}
              {form.customerGstin && !gstinError && (
                <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>
                  ✓ Valid · State: {stateFromGSTIN(form.customerGstin)}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea rows={2} value={form.customerAddress} onChange={e => setForm(f => ({ ...f, customerAddress: e.target.value }))} placeholder="Customer address" style={{ resize: 'none' }} />
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Notes / Terms</label>
              <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment terms, notes, etc." style={{ resize: 'none' }} />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Items */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: .5 }}>Line Items</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setItems(p => [...p, emptyItem()])}>
                <PlusCircle size={13} /> Add Row
              </button>
            </div>

            {items.map((it, i) => (
              <div key={i} style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px', marginBottom: 10 }}>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label>Item / Service Description</label>
                  <input value={it.desc} onChange={e => updItem(i, 'desc', e.target.value)} placeholder="e.g. Cotton Fabric, Consultation, etc." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1.2fr 32px', gap: 8, alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Qty</label>
                    <input type="number" min="0" value={it.qty} onChange={e => updItem(i, 'qty', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Unit</label>
                    <select value={it.unit} onChange={e => updItem(i, 'unit', e.target.value)}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Rate (₹)</label>
                    <input type="number" min="0" step="0.01" value={it.price} onChange={e => updItem(i, 'price', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>GST %</label>
                    <select value={it.gst} onChange={e => updItem(i, 'gst', e.target.value)}>
                      {GST_RATES.map(g => <option key={g} value={g}>{g}%</option>)}
                    </select>
                  </div>
                  <button
                    style={{ background: 'rgba(239,68,68,.15)', border: 'none', color: 'var(--red)', borderRadius: 7, width: 32, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => items.length > 1 && setItems(p => p.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', textAlign: 'right', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal: {fmtINR(it.qty * it.price)}</span>
                  <span>GST ({it.gst}%): {fmtINR(calcItem(it).gstAmt)}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>= {fmtINR(calcItem(it).total)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 16 }}>Invoice Summary</div>
            {[
              { label: 'Subtotal (before GST)', val: fmtINR(subtotal), color: 'var(--text)' },
              { label: 'Total GST', val: fmtINR(gstTotal), color: 'var(--green)' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>{r.label}</span>
                <span style={{ color: r.color, fontWeight: 600 }}>{r.val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', marginTop: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>Grand Total</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>{fmtINR(total)}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPreview(true)}><Eye size={13} /> Preview</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>
            <button className="btn btn-ghost w-full" style={{ marginTop: 8 }} onClick={() => nav('/invoices')}>Cancel</button>
          </div>
        </div>
      </div>

      {preview && (
        <InvoicePreviewModal
          inv={{ ...form, items }}
          business={business}
          onClose={() => setPreview(false)}
          onWhatsApp={() => {}}
          onEmail={() => {}}
        />
      )}
    </div>
  );
}
