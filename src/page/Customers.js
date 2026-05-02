import React, { useState } from 'react';
import { PlusSquare, Search, Trash2, Edit2, X, Users, Phone, Mail, Building, CheckCircle } from 'lucide-react';
import { addCustomer, updateCustomer, deleteCustomer } from '../supabase/services';
import { useAuth } from '../hooks/useAuth';
import { validateGSTIN, stateFromGSTIN, calcInvoice, fmtINR } from '../utils/helpers';
import toast from 'react-hot-toast';

const emptyForm = { name: '', gstin: '', phone: '', email: '', address: '' };

export default function Customers({ customers, invoices }) {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [gstinErr, setGstinErr] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(q.toLowerCase()) ||
    (c.phone || '').includes(q) ||
    (c.gstin || '').toLowerCase().includes(q.toLowerCase())
  );

  const custInvoices = (id) => invoices.filter(i => i.customerId === id);
  const custTotal = (id) => custInvoices(id).reduce((s, i) => s + calcInvoice(i.items).total, 0);

  const openNew = () => { setForm(emptyForm); setEditId(null); setGstinErr(''); setShowForm(true); };
  const openEdit = (c) => {
    setForm({ name: c.name, gstin: c.gstin || '', phone: c.phone || '', email: c.email || '', address: c.address || '' });
    setEditId(c.id); setGstinErr(''); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('Customer name required');
    const gv = validateGSTIN(form.gstin);
    if (!gv.valid) return toast.error(gv.msg);
    setSaving(true);
    try {
      if (editId) {
        await updateCustomer(user.id, editId, form);
        toast.success('Customer updated');
      } else {
        await addCustomer(user.id, form);
        toast.success('Customer added');
      }
      setShowForm(false);
    } catch (e) { toast.error('Failed: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try { await deleteCustomer(user.id, id); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-sub">{customers.length} customers in your directory</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}><PlusSquare size={14} /> Add Customer</button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(245,158,11,.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{editId ? 'Edit Customer' : 'New Customer'}</div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Full Name / Company *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Customer or company name" />
            </div>
            <div className="form-group">
              <label>GSTIN</label>
              <input
                value={form.gstin}
                onChange={e => {
                  const v = e.target.value.toUpperCase();
                  setForm(f => ({ ...f, gstin: v }));
                  const r = validateGSTIN(v);
                  setGstinErr(r.msg);
                }}
                placeholder="33AABCD1234E1ZX"
                className={gstinErr ? 'input-error' : ''}
              />
              {gstinErr && <div className="error-msg">{gstinErr}</div>}
              {form.gstin && !gstinErr && (
                <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={11} /> Valid · {stateFromGSTIN(form.gstin)}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Mobile number" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Address</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editId ? 'Update Customer' : 'Add Customer'}</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="search-wrap" style={{ marginBottom: 16 }}>
        <Search size={15} className="search-icon" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, phone, GSTIN..." />
      </div>

      {/* Customer List */}
      {filtered.length === 0 ? (
        <div className="empty-state"><Users size={40} /><p style={{ marginTop: 10 }}>No customers yet. Add your first customer!</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
                  {(c.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
                    {c.gstin && (
                      <span style={{ fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Building size={10} /> {c.gstin}
                      </span>
                    )}
                    {c.phone && (
                      <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Phone size={10} /> {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Mail size={10} /> {c.email}
                      </span>
                    )}
                  </div>
                  {c.address && <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 3 }}>{c.address}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>Total Business</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>{fmtINR(custTotal(c.id))}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{custInvoices(c.id).length} invoices</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)}><Edit2 size={13} /></button>
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
