import React, { useState } from 'react';
import { PlusSquare, Search, Trash2, Edit2, X, Users, Phone, Mail, Building, CheckCircle } from 'lucide-react';
import { addCustomer, updateCustomer, deleteCustomer } from '../supabase/services';
import { useAuth } from '../hooks/useAuth';
import { validateGSTIN, stateFromGSTIN, calcInvoice, fmtINR } from '../utils/helpers';
import toast from 'react-hot-toast';

const S = {
  card: { background:'#141720', border:'1px solid #252a3d', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 12px rgba(0,0,0,.4)' },
  inp: { width:'100%', background:'#1a1e2d', border:'1px solid #252a3d', color:'#edf0f7', padding:'10px 13px', borderRadius:9, fontSize:13, fontFamily:'inherit', outline:'none' },
  label: { display:'block', fontSize:11, color:'#6b7490', fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' },
  fg: { marginBottom:14 },
};

const empty = { name:'', gstin:'', phone:'', email:'', address:'' };

export default function Customers({ customers, invoices }) {
  const { user }  = useAuth();
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(empty);
  const [gstinErr, setGstinErr] = useState('');
  const [saving, setSaving]     = useState(false);

  const filtered = customers.filter(c =>
    (c.name||'').toLowerCase().includes(q.toLowerCase()) ||
    (c.phone||'').includes(q) || (c.gstin||'').toLowerCase().includes(q.toLowerCase())
  );

  const custInvs  = id => invoices.filter(i => i.customerId===id);
  const custTotal = id => custInvs(id).reduce((s,i) => s+calcInvoice(i.items).total, 0);

  const openNew  = () => { setForm(empty); setEditId(null); setGstinErr(''); setShowForm(true); };
  const openEdit = c  => { setForm({ name:c.name, gstin:c.gstin||'', phone:c.phone||'', email:c.email||'', address:c.address||'' }); setEditId(c.id); setGstinErr(''); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name) return toast.error('Customer name required');
    if (!validateGSTIN(form.gstin).valid) return toast.error(validateGSTIN(form.gstin).msg);
    setSaving(true);
    try {
      if (editId) { await updateCustomer(user.id, editId, form); toast.success('Customer updated'); }
      else        { await addCustomer(user.id, form);            toast.success('Customer added'); }
      setShowForm(false);
    } catch(e) { toast.error('Failed: '+e.message); }
    setSaving(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this customer?')) return;
    try { await deleteCustomer(user.id, id); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const focusStyle = e => e.target.style.borderColor='#f59e0b';
  const blurStyle  = e => e.target.style.borderColor='#252a3d';

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#edf0f7' }}>Customers</h1>
          <p style={{ fontSize:13, color:'#6b7490', marginTop:4 }}>{customers.length} customers in your directory</p>
        </div>
        <button onClick={openNew} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:'#f59e0b', color:'#000', boxShadow:'0 2px 14px rgba(245,158,11,.35)' }}>
          <PlusSquare size={15}/> Add Customer
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div style={{ ...S.card, marginBottom:20, borderColor:'rgba(245,158,11,.3)', background:'#141720' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#f59e0b' }}>{editId?'Edit Customer':'New Customer'}</div>
            <button onClick={()=>setShowForm(false)} style={{ background:'transparent', border:'1px solid #2e3452', borderRadius:7, color:'#6b7490', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><X size={14}/></button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { key:'name',    label:'Customer Name *', placeholder:'Full name or company' },
              { key:'phone',   label:'Phone',           placeholder:'Mobile number' },
              { key:'email',   label:'Email',           placeholder:'email@example.com' },
            ].map(f => (
              <div key={f.key} style={S.fg}>
                <label style={S.label}>{f.label}</label>
                <input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={S.inp} onFocus={focusStyle} onBlur={blurStyle}/>
              </div>
            ))}
            <div style={S.fg}>
              <label style={S.label}>GSTIN</label>
              <input value={form.gstin} onChange={e=>{const v=e.target.value.toUpperCase();setForm(p=>({...p,gstin:v}));setGstinErr(validateGSTIN(v).msg)}}
                placeholder="33AABCD1234E1ZX" style={{ ...S.inp, borderColor:gstinErr?'#ef4444':'#252a3d' }} onFocus={focusStyle} onBlur={blurStyle}/>
              {gstinErr && <div style={{ fontSize:11, color:'#ef4444', marginTop:4 }}>{gstinErr}</div>}
              {form.gstin && !gstinErr && <div style={{ fontSize:11, color:'#10b981', marginTop:4, display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={11}/> Valid · {stateFromGSTIN(form.gstin)}</div>}
            </div>
            <div style={{ ...S.fg, gridColumn:'span 2' }}>
              <label style={S.label}>Address</label>
              <input value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} placeholder="Full address" style={S.inp} onFocus={focusStyle} onBlur={blurStyle}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:9 }}>
            <button onClick={handleSave} disabled={saving} style={{ padding:'9px 20px', borderRadius:9, border:'none', background:'#f59e0b', color:'#000', fontWeight:600, cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
              {saving?'Saving...':(editId?'Update Customer':'Add Customer')}
            </button>
            <button onClick={()=>setShowForm(false)} style={{ padding:'9px 16px', borderRadius:9, border:'1px solid #2e3452', background:'transparent', color:'#6b7490', fontWeight:600, cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position:'relative', marginBottom:16 }}>
        <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#6b7490', pointerEvents:'none' }}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name, phone or GSTIN..." style={{ ...S.inp, paddingLeft:38 }} onFocus={focusStyle} onBlur={blurStyle}/>
      </div>

      {/* Customer list */}
      {filtered.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#6b7490' }}>
          <Users size={44} style={{ margin:'0 auto 14px', display:'block', color:'#404764' }}/>
          <p>No customers yet. Add your first customer!</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ ...S.card, display:'flex', justifyContent:'space-between', alignItems:'center', transition:'border-color .15s' }}
              onMouseOver={e=>e.currentTarget.style.borderColor='#2e3452'} onMouseOut={e=>e.currentTarget.style.borderColor='#252a3d'}>
              <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                <div style={{ width:46, height:46, borderRadius:'50%', background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#f59e0b', flexShrink:0 }}>
                  {(c.name||'?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:'#edf0f7' }}>{c.name}</div>
                  <div style={{ display:'flex', gap:14, marginTop:5, flexWrap:'wrap' }}>
                    {c.gstin && <span style={{ fontSize:11, color:'#10b981', display:'flex', alignItems:'center', gap:3 }}><Building size={10}/> {c.gstin}</span>}
                    {c.phone && <span style={{ fontSize:11, color:'#6b7490', display:'flex', alignItems:'center', gap:3 }}><Phone size={10}/> {c.phone}</span>}
                    {c.email && <span style={{ fontSize:11, color:'#6b7490', display:'flex', alignItems:'center', gap:3 }}><Mail size={10}/> {c.email}</span>}
                  </div>
                  {c.address && <div style={{ fontSize:11, color:'#404764', marginTop:3 }}>{c.address}</div>}
                </div>
              </div>
              <div style={{ display:'flex', gap:18, alignItems:'center' }}>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, color:'#6b7490', marginBottom:3 }}>Total Business</div>
                  <div style={{ fontSize:16, fontWeight:800, color:'#10b981' }}>{fmtINR(custTotal(c.id))}</div>
                  <div style={{ fontSize:11, color:'#6b7490' }}>{custInvs(c.id).length} invoices</div>
                </div>
                <div style={{ display:'flex', gap:7 }}>
                  <button onClick={()=>openEdit(c)} style={{ padding:'7px', borderRadius:7, border:'1px solid #2e3452', background:'transparent', color:'#6b7490', cursor:'pointer', display:'flex', alignItems:'center' }} onMouseOver={e=>{e.currentTarget.style.borderColor='#f59e0b';e.currentTarget.style.color='#f59e0b'}} onMouseOut={e=>{e.currentTarget.style.borderColor='#2e3452';e.currentTarget.style.color='#6b7490'}}><Edit2 size={13}/></button>
                  <button onClick={()=>handleDelete(c.id)} style={{ padding:'7px', borderRadius:7, border:'1px solid rgba(239,68,68,.25)', background:'rgba(239,68,68,.08)', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center' }}><Trash2 size={13}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
