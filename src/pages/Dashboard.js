import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, AlertTriangle, CheckCircle, Users, PlusSquare, FileText, IndianRupee } from 'lucide-react';
import { fmtINR, calcInvoice } from '../utils/helpers';

const S = {
  card: { background:'#141720', border:'1px solid #252a3d', borderRadius:14, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,.4)', position:'relative', overflow:'hidden' },
  cardHover: {},
  label: { fontSize:11, color:'#6b7490', fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px' },
  val: { fontSize:26, fontWeight:800, marginTop:6, letterSpacing:'-.5px' },
  sub: { fontSize:12, color:'#6b7490', marginTop:5 },
  icon: { width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 },
  tblWrap: { borderRadius:14, overflow:'hidden', border:'1px solid #252a3d', boxShadow:'0 2px 12px rgba(0,0,0,.4)' },
  th: { padding:'12px 16px', fontSize:11, fontWeight:700, color:'#6b7490', textTransform:'uppercase', letterSpacing:'.6px', textAlign:'left', borderBottom:'1px solid #252a3d', background:'#1a1e2d' },
  td: { padding:'13px 16px', fontSize:13, borderBottom:'1px solid rgba(37,42,58,.5)', color:'#edf0f7' },
  badge: (s) => ({ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:20, fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.3px',
    background: s==='paid'?'rgba(16,185,129,.12)':s==='overdue'?'rgba(239,68,68,.12)':'rgba(245,158,11,.12)',
    color: s==='paid'?'#10b981':s==='overdue'?'#ef4444':'#f59e0b',
    border: `1px solid ${s==='paid'?'rgba(16,185,129,.25)':s==='overdue'?'rgba(239,68,68,.25)':'rgba(245,158,11,.25)'}`
  }),
};

export default function Dashboard({ invoices, customers }) {
  const nav = useNavigate();

  const stats = useMemo(() => {
    const paid    = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending');
    const overdue = invoices.filter(i => i.status === 'overdue');
    const total      = invoices.reduce((s,i) => s + calcInvoice(i.items).total, 0);
    const collected  = paid.reduce((s,i) => s + calcInvoice(i.items).total, 0);
    const pendingAmt = pending.reduce((s,i) => s + calcInvoice(i.items).total, 0);
    const gst        = invoices.reduce((s,i) => s + calcInvoice(i.items).gstTotal, 0);
    return { total, collected, pendingAmt, gst, paid:paid.length, pending:pending.length, overdue:overdue.length };
  }, [invoices]);

  const monthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      const amt = invoices.filter(inv => (inv.date||'').startsWith(key)).reduce((s,inv) => s+calcInvoice(inv.items).total, 0);
      return { label, amt, isCurrent: i === 5 };
    });
  }, [invoices]);

  const maxAmt = Math.max(...monthly.map(m => m.amt), 1);
  const recent = invoices.slice(0, 6);

  return (
    <div style={{ position:'relative' }}>
      {/* Page header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#edf0f7', letterSpacing:'-.3px' }}>Dashboard</h1>
          <p style={{ fontSize:13, color:'#6b7490', marginTop:4 }}>Your business at a glance</p>
        </div>
        <button onClick={() => nav('/create')} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:'#f59e0b', color:'#000', boxShadow:'0 2px 14px rgba(245,158,11,.35)', transition:'all .15s' }}
          onMouseOver={e=>{e.currentTarget.style.background='#fbbf24';e.currentTarget.style.transform='translateY(-1px)'}}
          onMouseOut={e=>{e.currentTarget.style.background='#f59e0b';e.currentTarget.style.transform='none'}}>
          <PlusSquare size={15}/> New Invoice
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:22 }}>
        {[
          { icon:<IndianRupee size={20}/>, iconBg:'rgba(245,158,11,.12)', iconColor:'#f59e0b', label:'Total Revenue',  val:fmtINR(stats.total),      sub:`${invoices.length} invoices total`,    topLine:'rgba(245,158,11,.4)' },
          { icon:<CheckCircle size={20}/>, iconBg:'rgba(16,185,129,.12)',  iconColor:'#10b981', label:'Collected',      val:fmtINR(stats.collected),   sub:`${stats.paid} paid invoices`,          topLine:'rgba(16,185,129,.4)', valColor:'#10b981' },
          { icon:<Clock size={20}/>,       iconBg:'rgba(245,158,11,.1)',   iconColor:'#f59e0b', label:'Pending',        val:fmtINR(stats.pendingAmt),  sub:`${stats.pending} awaiting payment`,    topLine:'rgba(245,158,11,.3)' },
          { icon:<AlertTriangle size={20}/>,iconBg:'rgba(239,68,68,.1)',   iconColor:'#ef4444', label:'Overdue',        val:`${stats.overdue} invoices`, sub:'Immediate attention',               topLine:'rgba(239,68,68,.4)', valColor:stats.overdue>0?'#ef4444':undefined, smallVal:true },
        ].map((c,i) => (
          <div key={i} style={{ ...S.card }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${c.topLine}, transparent)` }}/>
            <div style={{ ...S.icon, background:c.iconBg }}><span style={{ color:c.iconColor }}>{c.icon}</span></div>
            <div style={S.label}>{c.label}</div>
            <div style={{ ...S.val, color:c.valColor||'#edf0f7', fontSize:c.smallVal?20:26 }}>{c.val}</div>
            <div style={S.sub}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:14, marginBottom:22 }}>
        {/* Bar chart */}
        <div style={{ ...S.card }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#edf0f7', marginBottom:18 }}>Monthly Revenue</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:120 }}>
            {monthly.map((m,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                <div style={{ fontSize:9, color:'#6b7490', fontWeight:600, textAlign:'center', minHeight:12 }}>
                  {m.amt>0 ? fmtINR(m.amt).replace('₹','') : ''}
                </div>
                <div style={{ width:'100%', borderRadius:'5px 5px 0 0', background: m.isCurrent ? '#f59e0b' : '#1f2438', border: `1px solid ${m.isCurrent?'rgba(245,158,11,.4)':'#252a3d'}`, height:`${Math.max((m.amt/maxAmt)*100, 4)}%`, minHeight:4, boxShadow: m.isCurrent?'0 0 12px rgba(245,158,11,.3)':'none', transition:'height .4s ease' }}/>
                <div style={{ fontSize:10, color: m.isCurrent?'#f59e0b':'#6b7490', fontWeight: m.isCurrent?700:400 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{ ...S.card }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#edf0f7', marginBottom:14 }}>Summary</div>
          {[
            { label:'GST Collected',    val:fmtINR(stats.gst), color:'#10b981' },
            { label:'Total Customers',  val:customers.length,  color:'#3b82f6' },
            { label:'Paid Invoices',    val:stats.paid,        color:'#10b981' },
            { label:'Pending Invoices', val:stats.pending,     color:'#f59e0b' },
            { label:'Overdue Invoices', val:stats.overdue,     color:'#ef4444' },
          ].map((r,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom: i<4?'1px solid #252a3d':'none' }}>
              <span style={{ color:'#6b7490', fontSize:13 }}>{r.label}</span>
              <span style={{ color:r.color, fontWeight:700, fontSize:14 }}>{r.val}</span>
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <button onClick={()=>nav('/customers')} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:8, border:'1px solid #2e3452', background:'transparent', color:'#6b7490', fontSize:12, fontWeight:600, cursor:'pointer' }}
              onMouseOver={e=>e.currentTarget.style.borderColor='#f59e0b'} onMouseOut={e=>e.currentTarget.style.borderColor='#2e3452'}>
              <Users size={13}/> Customers
            </button>
            <button onClick={()=>nav('/invoices')} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:8, border:'1px solid #2e3452', background:'transparent', color:'#6b7490', fontSize:12, fontWeight:600, cursor:'pointer' }}
              onMouseOver={e=>e.currentTarget.style.borderColor='#f59e0b'} onMouseOut={e=>e.currentTarget.style.borderColor='#2e3452'}>
              <FileText size={13}/> Invoices
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div style={{ ...S.tblWrap, background:'#141720' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #252a3d', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#141720' }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#edf0f7' }}>Recent Invoices</div>
          <button onClick={()=>nav('/invoices')} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'1px solid #2e3452', background:'transparent', color:'#6b7490', fontSize:12, fontWeight:600, cursor:'pointer' }}>View All →</button>
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign:'center', padding:'50px 20px', color:'#6b7490' }}>
            <FileText size={40} style={{ margin:'0 auto 12px', display:'block', color:'#404764' }}/>
            <p style={{ marginBottom:16 }}>No invoices yet</p>
            <button onClick={()=>nav('/create')} style={{ padding:'9px 20px', borderRadius:9, border:'none', background:'#f59e0b', color:'#000', fontWeight:600, cursor:'pointer', fontSize:13 }}>Create First Invoice</button>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Invoice No','Customer','Date','Amount','Status'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {recent.map((inv,i) => {
                const { total } = calcInvoice(inv.items);
                return (
                  <tr key={inv.id} style={{ background: i%2===0?'#141720':'rgba(20,23,32,.7)', cursor:'pointer' }} onClick={()=>nav('/invoices')}>
                    <td style={{ ...S.td, color:'#f59e0b', fontWeight:700 }}>{inv.invNo}</td>
                    <td style={{ ...S.td, fontWeight:500 }}>{inv.customer}</td>
                    <td style={{ ...S.td, color:'#6b7490', fontSize:12 }}>{inv.date}</td>
                    <td style={{ ...S.td, fontWeight:700 }}>{fmtINR(total)}</td>
                    <td style={S.td}><span style={S.badge(inv.status)}>{inv.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ s }) {
  const colors = { paid:'#10b981', pending:'#f59e0b', overdue:'#ef4444' };
  const bgs    = { paid:'rgba(16,185,129,.12)', pending:'rgba(245,158,11,.12)', overdue:'rgba(239,68,68,.12)' };
  const bords  = { paid:'rgba(16,185,129,.25)', pending:'rgba(245,158,11,.25)', overdue:'rgba(239,68,68,.25)' };
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:20, fontSize:10.5, fontWeight:700, textTransform:'uppercase', background:bgs[s]||bgs.pending, color:colors[s]||colors.pending, border:`1px solid ${bords[s]||bords.pending}` }}>{s}</span>;
}
