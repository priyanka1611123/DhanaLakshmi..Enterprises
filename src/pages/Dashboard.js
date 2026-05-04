import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Clock, AlertTriangle, IndianRupee,
  PlusSquare, FileText, Users, TrendingUp, TrendingDown, BarChart2
} from 'lucide-react';
import { fmtINR, calcInvoice } from '../utils/helpers';
import { supabase } from '../supabase/config';
import { useAuth } from '../hooks/useAuth';

// ── shared inline styles ─────────────────────────────────────
const card = {
  background:'#141720', border:'1px solid #252a3d',
  borderRadius:14, padding:'20px 22px',
  boxShadow:'0 2px 14px rgba(0,0,0,.4)', position:'relative', overflow:'hidden'
};
const muted  = '#6b7490';
const accent = '#f59e0b';
const green  = '#10b981';
const red    = '#ef4444';
const blue   = '#3b82f6';
const text   = '#edf0f7';
const border = '#252a3d';

const badgeStyle = (s) => ({
  display:'inline-flex', alignItems:'center', padding:'3px 10px',
  borderRadius:20, fontSize:10.5, fontWeight:700, textTransform:'uppercase',
  background: s==='paid'?'rgba(16,185,129,.12)':s==='overdue'?'rgba(239,68,68,.12)':'rgba(245,158,11,.12)',
  color:       s==='paid'?green:s==='overdue'?red:accent,
  border:`1px solid ${s==='paid'?'rgba(16,185,129,.25)':s==='overdue'?'rgba(239,68,68,.25)':'rgba(245,158,11,.25)'}`
});

const th = { padding:'11px 16px', fontSize:11, fontWeight:700, color:muted, textTransform:'uppercase', letterSpacing:'.5px', textAlign:'left', borderBottom:`1px solid ${border}`, background:'#1a1e2d' };
const td = { padding:'12px 16px', fontSize:13, borderBottom:`1px solid rgba(37,42,58,.5)`, color:text };

function StatCard({ iconBg, iconColor, icon, label, value, sub, valColor, topLine }) {
  return (
    <div style={{ ...card }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${topLine||accent},transparent)`, opacity:.7 }}/>
      <div style={{ width:44, height:44, borderRadius:12, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
        <span style={{ color:iconColor }}>{icon}</span>
      </div>
      <div style={{ fontSize:11, color:muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color:valColor||text, marginTop:5, letterSpacing:'-.5px' }}>{value}</div>
      <div style={{ fontSize:12, color:muted, marginTop:4 }}>{sub}</div>
    </div>
  );
}

export function StatusBadge({ s }) {
  return <span style={badgeStyle(s)}>{s}</span>;
}

export default function Dashboard({ invoices, customers }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const [dailySales, setDailySales] = useState([]);

  // Load daily sales for dashboard
  useEffect(() => {
    if (!user) return;
    supabase.from('daily_sales').select('*').eq('user_id', user.id)
      .then(({ data }) => setDailySales(data || []));
  }, [user]);

  // Invoice stats
  const inv = useMemo(() => {
    const paid    = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending');
    const overdue = invoices.filter(i => i.status === 'overdue');
    const total      = invoices.reduce((s,i) => s+calcInvoice(i.items).total, 0);
    const collected  = paid.reduce((s,i) => s+calcInvoice(i.items).total, 0);
    const pendingAmt = pending.reduce((s,i) => s+calcInvoice(i.items).total, 0);
    const gst        = invoices.reduce((s,i) => s+calcInvoice(i.items).gstTotal, 0);
    return { total, collected, pendingAmt, gst, paid:paid.length, pending:pending.length, overdue:overdue.length };
  }, [invoices]);

  // Daily sales stats
  const ds = useMemo(() => {
    const totalSales   = dailySales.reduce((s,r) => s+Number(r.sale_amount||0), 0);
    const totalExpense = dailySales.reduce((s,r) => s+Number(r.expense||0),     0);
    const profit       = totalSales - totalExpense;
    // Today
    const todayStr     = new Date().toISOString().split('T')[0];
    const todayRows    = dailySales.filter(r => r.date === todayStr);
    const todaySales   = todayRows.reduce((s,r) => s+Number(r.sale_amount||0), 0);
    // This month
    const monthStr     = todayStr.slice(0,7);
    const monthRows    = dailySales.filter(r => r.date.startsWith(monthStr));
    const monthSales   = monthRows.reduce((s,r) => s+Number(r.sale_amount||0), 0);
    const monthExpense = monthRows.reduce((s,r) => s+Number(r.expense||0),     0);
    const monthProfit  = monthSales - monthExpense;
    return { totalSales, totalExpense, profit, todaySales, monthSales, monthExpense, monthProfit };
  }, [dailySales]);

  // Monthly revenue chart (from invoices)
  const monthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length:6 }, (_,i) => {
      const d   = new Date(now.getFullYear(), now.getMonth()-(5-i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const lbl = d.toLocaleString('default', { month:'short' });
      const amt = invoices.filter(x => (x.date||'').startsWith(key)).reduce((s,x) => s+calcInvoice(x.items).total, 0);
      return { lbl, amt, cur: i===5 };
    });
  }, [invoices]);

  const maxAmt = Math.max(...monthly.map(m=>m.amt), 1);
  const recent = invoices.slice(0, 5);

  // Recent daily entries (last 5)
  const recentDaily = useMemo(() =>
    [...dailySales].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5)
  , [dailySales]);

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:text, letterSpacing:'-.3px' }}>Dashboard</h1>
          <p style={{ fontSize:13, color:muted, marginTop:4 }}>Welcome back — here's your business overview</p>
        </div>
        <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
          <button onClick={()=>nav('/daily-sales')}
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:9, border:`1px solid ${border}`, cursor:'pointer', fontSize:13, fontWeight:600, background:'rgba(16,185,129,.08)', color:green, fontFamily:'inherit' }}>
            <TrendingUp size={14}/> Add Today's Sale
          </button>
          <button onClick={()=>nav('/create')}
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:accent, color:'#000', boxShadow:'0 2px 14px rgba(245,158,11,.3)', fontFamily:'inherit' }}>
            <PlusSquare size={14}/> New Invoice
          </button>
        </div>
      </div>

      {/* ── ROW 1: Invoice stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:14 }}>
        <StatCard icon={<IndianRupee size={19}/>} iconBg="rgba(245,158,11,.1)"  iconColor={accent} label="Total Revenue"  value={fmtINR(inv.total)}      sub={`${invoices.length} invoices`}         topLine={accent}/>
        <StatCard icon={<CheckCircle size={19}/>} iconBg="rgba(16,185,129,.1)"  iconColor={green}  label="Collected"      value={fmtINR(inv.collected)}  sub={`${inv.paid} paid`}     valColor={green} topLine={green}/>
        <StatCard icon={<Clock size={19}/>}        iconBg="rgba(245,158,11,.08)" iconColor={accent} label="Pending"        value={fmtINR(inv.pendingAmt)} sub={`${inv.pending} invoices`}               topLine={accent}/>
        <StatCard icon={<AlertTriangle size={19}/>}iconBg="rgba(239,68,68,.1)"   iconColor={red}    label="Overdue"        value={`${inv.overdue}`}       sub="need attention"  valColor={inv.overdue>0?red:text} topLine={red}/>
      </div>

      {/* ── ROW 2: Daily Sales stats ── */}
      <div style={{ ...card, marginBottom:14, borderColor:'rgba(16,185,129,.2)', background:'rgba(16,185,129,.04)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <TrendingUp size={18} color={green}/>
            <span style={{ fontSize:14, fontWeight:700, color:text }}>Daily Sales Tracker</span>
            <span style={{ fontSize:10, padding:'2px 7px', borderRadius:10, background:'rgba(16,185,129,.15)', color:green, fontWeight:700 }}>LIVE</span>
          </div>
          <button onClick={()=>nav('/daily-sales')}
            style={{ fontSize:12, color:accent, background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'inherit' }}>
            View All →
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10 }}>
          {[
            { label:"Today's Sales",    value: fmtINR(ds.todaySales),    color: accent,                       icon:'📅' },
            { label:'This Month Sales', value: fmtINR(ds.monthSales),    color: accent,                       icon:'📆' },
            { label:'Month Expense',    value: fmtINR(ds.monthExpense),  color: red,                          icon:'💸' },
            { label:'Month Profit/Loss',value: fmtINR(Math.abs(ds.monthProfit)), color: ds.monthProfit>=0?green:red, icon: ds.monthProfit>=0?'📈':'📉' },
            { label:'Total Sales Ever', value: fmtINR(ds.totalSales),    color: blue,                         icon:'💰' },
            { label:'Net Profit Ever',  value: fmtINR(Math.abs(ds.profit)), color: ds.profit>=0?green:red,    icon: ds.profit>=0?'🏆':'⚠️' },
          ].map((s,i) => (
            <div key={i} style={{ background:'#141720', border:`1px solid ${border}`, borderRadius:10, padding:'12px 14px' }}>
              <div style={{ fontSize:16, marginBottom:5 }}>{s.icon}</div>
              <div style={{ fontSize:10, color:muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        {ds.monthProfit < 0 && (
          <div style={{ marginTop:12, padding:'9px 13px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:9, fontSize:12, color:red }}>
            ⚠️ This month expenses exceed sales by {fmtINR(Math.abs(ds.monthProfit))} — review your costs!
          </div>
        )}
        {ds.monthProfit > 0 && ds.monthSales > 0 && (
          <div style={{ marginTop:12, padding:'9px 13px', background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.2)', borderRadius:9, fontSize:12, color:green }}>
            🎉 Great! This month profit is {fmtINR(ds.monthProfit)} — keep it up!
          </div>
        )}
      </div>

      {/* ── ROW 3: Chart + Summary ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:14, marginBottom:14 }}>
        {/* Bar chart */}
        <div style={{ ...card }}>
          <div style={{ fontSize:14, fontWeight:700, color:text, marginBottom:18 }}>Monthly Revenue (Invoices)</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:110 }}>
            {monthly.map((m,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ fontSize:8.5, color:muted, textAlign:'center', minHeight:11 }}>
                  {m.amt>0 ? (m.amt>=100000 ? `${(m.amt/100000).toFixed(1)}L` : `${(m.amt/1000).toFixed(0)}K`) : ''}
                </div>
                <div style={{ width:'100%', borderRadius:'4px 4px 0 0', minHeight:4, transition:'height .4s',
                  background: m.cur ? accent : '#1f2438',
                  border:`1px solid ${m.cur?'rgba(245,158,11,.4)':'#252a3d'}`,
                  height:`${Math.max((m.amt/maxAmt)*100,4)}%`,
                  boxShadow: m.cur?'0 0 14px rgba(245,158,11,.3)':'none'
                }}/>
                <div style={{ fontSize:9.5, color:m.cur?accent:muted, fontWeight:m.cur?700:400 }}>{m.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice summary */}
        <div style={{ ...card }}>
          <div style={{ fontSize:14, fontWeight:700, color:text, marginBottom:14 }}>Invoice Summary</div>
          {[
            { label:'GST Collected',    val:fmtINR(inv.gst),      color:green },
            { label:'Total Customers',  val:customers.length,     color:blue  },
            { label:'Paid Invoices',    val:inv.paid,             color:green },
            { label:'Pending Invoices', val:inv.pending,          color:accent},
            { label:'Overdue Invoices', val:inv.overdue,          color:red   },
          ].map((r,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:i<4?`1px solid ${border}`:'none' }}>
              <span style={{ color:muted, fontSize:13 }}>{r.label}</span>
              <span style={{ color:r.color, fontWeight:700, fontSize:14 }}>{r.val}</span>
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <button onClick={()=>nav('/customers')} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px', borderRadius:8, border:`1px solid ${border}`, background:'transparent', color:muted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              <Users size={13}/> Customers
            </button>
            <button onClick={()=>nav('/invoices')} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px', borderRadius:8, border:`1px solid ${border}`, background:'transparent', color:muted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              <FileText size={13}/> Invoices
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 4: Recent Invoices + Recent Daily Sales ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>

        {/* Recent invoices table */}
        <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${border}`, boxShadow:'0 2px 12px rgba(0,0,0,.4)' }}>
          <div style={{ padding:'14px 18px', background:'#141720', borderBottom:`1px solid ${border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, fontSize:14, color:text }}>Recent Invoices</div>
            <button onClick={()=>nav('/invoices')} style={{ fontSize:12, color:accent, background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'inherit' }}>View All →</button>
          </div>
          {recent.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:muted, background:'#141720' }}>
              <FileText size={36} style={{ margin:'0 auto 10px', display:'block', color:'#404764' }}/>
              <p style={{ marginBottom:14 }}>No invoices yet</p>
              <button onClick={()=>nav('/create')} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:accent, color:'#000', fontWeight:600, cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Create First Invoice</button>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={th}>Invoice</th>
                <th style={th}>Customer</th>
                <th style={th}>Amount</th>
                <th style={th}>Status</th>
              </tr></thead>
              <tbody>
                {recent.map((inv, i) => {
                  const { total } = calcInvoice(inv.items);
                  return (
                    <tr key={inv.id} style={{ cursor:'pointer' }} onClick={()=>nav('/invoices')}>
                      <td style={{ ...td, color:accent, fontWeight:700, background:i%2===0?'#141720':'#0f1219' }}>{inv.invNo}</td>
                      <td style={{ ...td, background:i%2===0?'#141720':'#0f1219' }}>{inv.customer}</td>
                      <td style={{ ...td, fontWeight:700, background:i%2===0?'#141720':'#0f1219' }}>{fmtINR(total)}</td>
                      <td style={{ ...td, background:i%2===0?'#141720':'#0f1219' }}><StatusBadge s={inv.status}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent daily sales */}
        <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${border}`, boxShadow:'0 2px 12px rgba(0,0,0,.4)' }}>
          <div style={{ padding:'14px 18px', background:'#141720', borderBottom:`1px solid ${border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, fontSize:14, color:text }}>Recent Daily Sales</div>
            <button onClick={()=>nav('/daily-sales')} style={{ fontSize:12, color:green, background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'inherit' }}>View All →</button>
          </div>
          {recentDaily.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:muted, background:'#141720' }}>
              <BarChart2 size={36} style={{ margin:'0 auto 10px', display:'block', color:'#404764' }}/>
              <p style={{ marginBottom:14 }}>No daily sales yet</p>
              <button onClick={()=>nav('/daily-sales')} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:green, color:'#000', fontWeight:600, cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Add Today's Sale</button>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={th}>Date</th>
                <th style={th}>Sale</th>
                <th style={th}>Expense</th>
                <th style={th}>Profit</th>
              </tr></thead>
              <tbody>
                {recentDaily.map((r,i) => {
                  const profit = Number(r.sale_amount||0) - Number(r.expense||0);
                  const bg = i%2===0?'#141720':'#0f1219';
                  return (
                    <tr key={r.id} style={{ cursor:'pointer' }} onClick={()=>nav('/daily-sales')}>
                      <td style={{ ...td, background:bg, fontSize:12 }}>
                        {new Date(r.date+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}
                      </td>
                      <td style={{ ...td, background:bg, color:accent, fontWeight:700 }}>{fmtINR(Number(r.sale_amount||0))}</td>
                      <td style={{ ...td, background:bg, color:red, fontSize:12 }}>{fmtINR(Number(r.expense||0))}</td>
                      <td style={{ ...td, background:bg, color:profit>=0?green:red, fontWeight:700 }}>
                        {profit>=0?'▲':'▼'} {fmtINR(Math.abs(profit))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
