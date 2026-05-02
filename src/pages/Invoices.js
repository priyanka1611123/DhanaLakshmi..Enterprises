import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlusSquare, Download, MessageCircle, Trash2, Eye, FileText, Mail } from 'lucide-react';
import { deleteInvoice, updateInvoice } from '../supabase/services';
import { useAuth } from '../hooks/useAuth';
import { calcInvoice, fmtINR, whatsappMsg } from '../utils/helpers';
import { generatePDF } from '../utils/pdfGenerator';
import { StatusBadge } from './Dashboard';
import InvoicePreviewModal from '../components/invoice/InvoicePreviewModal';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';

const btn = (extra={}) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:8, border:'1px solid #2e3452', background:'transparent', color:'#6b7490', fontSize:11.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s', ...extra });

export default function Invoices({ invoices, customers, business }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [q, setQ]           = useState('');
  const [filter, setFilter] = useState('all');
  const [viewInv, setViewInv] = useState(null);

  const filtered = useMemo(() => invoices.filter(i => {
    const m = (i.customer||'').toLowerCase().includes(q.toLowerCase()) || (i.invNo||'').toLowerCase().includes(q.toLowerCase());
    return m && (filter==='all' || i.status===filter);
  }), [invoices, q, filter]);

  const totals = useMemo(() => filtered.reduce((s,i) => s+calcInvoice(i.items).total, 0), [filtered]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice permanently?')) return;
    try { await deleteInvoice(user.id, id); toast.success('Invoice deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const handleStatus = async (inv, status) => {
    try { await updateInvoice(user.id, inv.id, { status }); toast.success(`Marked as ${status}`); }
    catch { toast.error('Update failed'); }
  };

  const handleWhatsApp = (inv) => {
    const { total } = calcInvoice(inv.items);
    const cust = customers.find(c => c.id === inv.customerId);
    const phone = cust?.phone?.replace(/\D/g,'') || '';
    const msg = whatsappMsg(inv, total);
    window.open(phone ? `https://wa.me/91${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank');
  };

  const handleEmail = async (inv) => {
    const { total } = calcInvoice(inv.items);
    const cust = customers.find(c => c.id === inv.customerId);
    if (!cust?.email) return toast.error('No email for this customer');
    if (!business?.emailjsServiceId) return toast.error('Configure EmailJS in Settings first');
    try {
      await emailjs.send(business.emailjsServiceId, business.emailjsTemplateId,
        { to_name:inv.customer, to_email:cust.email, inv_no:inv.invNo, inv_date:inv.date, inv_due:inv.due, total:fmtINR(total), company:business.name||'DL Enterprises' },
        business.emailjsPublicKey);
      toast.success(`Email sent to ${cust.email}`);
    } catch { toast.error('Email send failed. Check EmailJS config.'); }
  };

  const th = { padding:'12px 16px', fontSize:11, fontWeight:700, color:'#6b7490', textTransform:'uppercase', letterSpacing:'.6px', textAlign:'left', borderBottom:'1px solid #252a3d', background:'#1a1e2d' };
  const td = { padding:'12px 16px', fontSize:13, borderBottom:'1px solid rgba(37,42,58,.5)', color:'#edf0f7' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#edf0f7' }}>Invoices</h1>
          <p style={{ fontSize:13, color:'#6b7490', marginTop:4 }}>{filtered.length} invoices · Total {fmtINR(totals)}</p>
        </div>
        <button onClick={()=>nav('/create')} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:'#f59e0b', color:'#000', boxShadow:'0 2px 14px rgba(245,158,11,.35)' }}>
          <PlusSquare size={15}/> New Invoice
        </button>
      </div>

      {/* Search + Filter */}
      <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ flex:1, minWidth:220, position:'relative' }}>
          <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#6b7490', pointerEvents:'none' }}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search invoice or customer..." style={{ width:'100%', background:'#1a1e2d', border:'1px solid #252a3d', color:'#edf0f7', padding:'10px 13px 10px 38px', borderRadius:9, fontSize:13, fontFamily:'inherit', outline:'none' }} onFocus={e=>e.target.style.borderColor='#f59e0b'} onBlur={e=>e.target.style.borderColor='#252a3d'}/>
        </div>
        <div style={{ display:'flex', gap:7 }}>
          {['all','paid','pending','overdue'].map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:'7px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', border:'1px solid', borderColor:filter===f?'#f59e0b':'#2e3452', background:filter===f?'#f59e0b':'transparent', color:filter===f?'#000':'#6b7490', fontFamily:'inherit', transition:'all .15s' }}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid #252a3d', boxShadow:'0 2px 12px rgba(0,0,0,.4)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Invoice No','Customer','Date','Due Date','Amount','GST','Status','Actions'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length===0 && (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#6b7490', background:'#141720' }}>
                <FileText size={32} style={{ margin:'0 auto 10px', display:'block', color:'#404764' }}/>
                No invoices found
              </td></tr>
            )}
            {filtered.map((inv,i) => {
              const { total, gstTotal } = calcInvoice(inv.items);
              return (
                <tr key={inv.id} style={{ background:i%2===0?'#141720':'rgba(20,23,32,.7)' }}>
                  <td style={{ ...td, color:'#f59e0b', fontWeight:700, cursor:'pointer' }} onClick={()=>setViewInv(inv)}>{inv.invNo}</td>
                  <td style={{ ...td, fontWeight:500 }}>{inv.customer}</td>
                  <td style={{ ...td, color:'#6b7490', fontSize:12 }}>{inv.date}</td>
                  <td style={{ ...td, color:inv.status==='overdue'?'#ef4444':'#6b7490', fontSize:12 }}>{inv.due}</td>
                  <td style={{ ...td, fontWeight:700 }}>{fmtINR(total)}</td>
                  <td style={{ ...td, color:'#10b981', fontSize:12 }}>{fmtINR(gstTotal)}</td>
                  <td style={td}>
                    <select value={inv.status} onChange={e=>handleStatus(inv,e.target.value)}
                      style={{ width:'auto', fontSize:11, padding:'5px 8px', background:'#1a1e2d', border:'1px solid #252a3d', borderRadius:6, color:'#edf0f7', cursor:'pointer', fontFamily:'inherit' }}>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </td>
                  <td style={td}>
                    <div style={{ display:'flex', gap:5 }}>
                      <button style={btn()} title="View" onClick={()=>setViewInv(inv)}><Eye size={13}/></button>
                      <button style={btn()} title="PDF" onClick={()=>generatePDF(inv,business)}><Download size={13}/></button>
                      <button style={btn({ color:'#25d366', borderColor:'rgba(37,211,102,.3)', background:'rgba(37,211,102,.06)' })} title="WhatsApp" onClick={()=>handleWhatsApp(inv)}><MessageCircle size={13}/></button>
                      <button style={btn()} title="Email" onClick={()=>handleEmail(inv)}><Mail size={13}/></button>
                      <button style={btn({ color:'#ef4444', borderColor:'rgba(239,68,68,.3)', background:'rgba(239,68,68,.06)' })} title="Delete" onClick={()=>handleDelete(inv.id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewInv && <InvoicePreviewModal inv={viewInv} business={business} onClose={()=>setViewInv(null)} onWhatsApp={()=>handleWhatsApp(viewInv)} onEmail={()=>handleEmail(viewInv)}/>}
    </div>
  );
}
