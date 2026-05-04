import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Clock, AlertTriangle, IndianRupee,
  PlusSquare, FileText, Users, TrendingUp, TrendingDown, BarChart2
} from 'lucide-react';
import { fmtINR, calcInvoice } from '../utils/helpers';
import { supabase } from '../supabase/config';
import { useAuth } from '../hooks/useAuth';

export function StatusBadge({ s }) {
  const map = {
    paid:    { bg:'rgba(16,185,129,.15)',  color:'#10b981', border:'rgba(16,185,129,.3)'  },
    pending: { bg:'rgba(245,158,11,.15)',  color:'#f59e0b', border:'rgba(245,158,11,.3)'  },
    overdue: { bg:'rgba(239,68,68,.15)',   color:'#ef4444', border:'rgba(239,68,68,.3)'   },
  };
  const st = map[s] || map.pending;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'4px 11px',
      borderRadius:20, fontSize:10.5, fontWeight:800, textTransform:'uppercase',
      background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
      {s}
    </span>
  );
}

export default function Dashboard({ invoices, customers }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const [dailySales, setDailySales] = useState([]);
  const [dsLoaded,   setDsLoaded]   = useState(false);

  // ── Load daily sales ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase
      .from('daily_sales')
      .select('id, date, sale_amount, expense, category')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setDailySales(data);
        setDsLoaded(true);
      })
      .catch(() => setDsLoaded(true)); // table may not exist yet — fail silently
  }, [user]);

  // ── Invoice stats ─────────────────────────────────────────
  const inv = useMemo(() => {
    const paid    = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending');
    const overdue = invoices.filter(i => i.status === 'overdue');
    return {
      total:      invoices.reduce((s,i) => s + calcInvoice(i.items).total, 0),
      collected:  paid.reduce((s,i) => s + calcInvoice(i.items).total, 0),
      pendingAmt: pending.reduce((s,i) => s + calcInvoice(i.items).total, 0),
      gst:        invoices.reduce((s,i) => s + calcInvoice(i.items).gstTotal, 0),
      paid:       paid.length,
      pending:    pending.length,
      overdue:    overdue.length,
    };
  }, [invoices]);

  // ── Daily sales stats ─────────────────────────────────────
  const ds = useMemo(() => {
    const todayStr     = new Date().toISOString().split('T')[0];
    const monthStr     = todayStr.slice(0, 7);
    const todayRows    = dailySales.filter(r => r.date === todayStr);
    const monthRows    = dailySales.filter(r => (r.date||'').startsWith(monthStr));
    const totalSales   = dailySales.reduce((s,r) => s + Number(r.sale_amount||0), 0);
    const totalExpense = dailySales.reduce((s,r) => s + Number(r.expense||0),     0);
    const monthSales   = monthRows.reduce((s,r)  => s + Number(r.sale_amount||0), 0);
    const monthExpense = monthRows.reduce((s,r)  => s + Number(r.expense||0),     0);
    return {
      todaySales:   todayRows.reduce((s,r) => s + Number(r.sale_amount||0), 0),
      monthSales,   monthExpense,
      monthProfit:  monthSales - monthExpense,
      totalSales,   totalExpense,
      netProfit:    totalSales - totalExpense,
      count:        dailySales.length,
    };
  }, [dailySales]);

  // ── Monthly chart (from invoices) ─────────────────────────
  const monthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const amt = invoices
        .filter(x => (x.date||'').startsWith(key))
        .reduce((s,x) => s + calcInvoice(x.items).total, 0);
      return { lbl: d.toLocaleString('default',{month:'short'}), amt, cur: i === 5 };
    });
  }, [invoices]);

  const maxAmt   = Math.max(...monthly.map(m => m.amt), 1);
  const recent   = invoices.slice(0, 5);
  const recentDS = dailySales.slice(0, 5);

  // ── Helpers ───────────────────────────────────────────────
  const fmtDay = (d) => {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN',
      { day:'2-digit', month:'short', year:'2-digit' });
  };

  const S = {
    card: {
      background:'#141720', border:'1px solid #252a3d',
      borderRadius:16, padding:'20px 22px',
      boxShadow:'0 4px 20px rgba(0,0,0,.45)',
    },
    th: { padding:'11px 14px', fontSize:11, fontWeight:700, color:'#6b7490',
          textTransform:'uppercase', letterSpacing:'.5px', textAlign:'left',
          borderBottom:'1px solid #252a3d', background:'#1a1e2d' },
    td: (i) => ({ padding:'12px 14px', fontSize:13,
          borderBottom:'1px solid rgba(37,42,58,.4)',
          background: i%2===0 ? '#141720' : '#0f1219', color:'#edf0f7' }),
    btn: (color='#f59e0b', bg='rgba(245,158,11,.08)') => ({
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'8px 14px', borderRadius:8, border:`1px solid ${color}33`,
      background:bg, color:color, fontSize:12, fontWeight:600,
      cursor:'pointer', fontFamily:'inherit',
    }),
  };

  return (
    <div>

      {/* ── PAGE HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#edf0f7', letterSpacing:'-.3px' }}>
            Dashboard
          </h1>
          <p style={{ fontSize:13, color:'#6b7490', marginTop:4 }}>
            Welcome back — your business overview
          </p>
        </div>
        <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
          <button onClick={() => nav('/daily-sales')}
            style={{ ...S.btn('#10b981','rgba(16,185,129,.08)'), padding:'9px 16px', fontSize:13 }}>
            <TrendingUp size={15}/> Add Today's Sale
          </button>
          <button onClick={() => nav('/create')}
            style={{ display:'inline-flex', alignItems:'center', gap:7,
              padding:'9px 18px', borderRadius:9, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:700, background:'#f59e0b', color:'#000',
              boxShadow:'0 2px 16px rgba(245,158,11,.35)', fontFamily:'inherit' }}>
            <PlusSquare size={15}/> New Invoice
          </button>
        </div>
      </div>

      {/* ── ROW 1 — Invoice stat cards ── */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
        gap:14, marginBottom:16 }}>
        {[
          { icon:<IndianRupee size={20}/>, ibg:'rgba(245,158,11,.1)', ic:'#f59e0b',
            label:'Total Revenue',  val:fmtINR(inv.total),
            sub:`${invoices.length} invoices`, tl:'#f59e0b' },
          { icon:<CheckCircle size={20}/>,  ibg:'rgba(16,185,129,.1)',  ic:'#10b981',
            label:'Collected',      val:fmtINR(inv.collected),
            sub:`${inv.paid} paid`, vc:'#10b981', tl:'#10b981' },
          { icon:<Clock size={20}/>,        ibg:'rgba(245,158,11,.08)', ic:'#f59e0b',
            label:'Pending',        val:fmtINR(inv.pendingAmt),
            sub:`${inv.pending} invoices`, tl:'#f59e0b' },
          { icon:<AlertTriangle size={20}/>,ibg:'rgba(239,68,68,.1)',   ic:'#ef4444',
            label:'Overdue',        val:`${inv.overdue} invoices`,
            sub:'need attention', vc:inv.overdue>0?'#ef4444':undefined, tl:'#ef4444' },
        ].map((c,i) => (
          <div key={i} style={{ ...S.card, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
              background:`linear-gradient(90deg,transparent,${c.tl},transparent)` }}/>
            <div style={{ width:44, height:44, borderRadius:12, background:c.ibg,
              display:'flex', alignItems:'center', justifyContent:'center',
              marginBottom:14 }}>
              <span style={{ color:c.ic }}>{c.icon}</span>
            </div>
            <div style={{ fontSize:11, color:'#6b7490', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'.5px' }}>{c.label}</div>
            <div style={{ fontSize:24, fontWeight:800, color:c.vc||'#edf0f7',
              marginTop:5, letterSpacing:'-.5px' }}>{c.val}</div>
            <div style={{ fontSize:12, color:'#6b7490', marginTop:4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── ROW 2 — Daily Sales summary box ── */}
      <div style={{ ...S.card, marginBottom:16,
        borderColor:'rgba(16,185,129,.25)',
        background:'linear-gradient(135deg,rgba(16,185,129,.06) 0%,rgba(20,23,32,.0) 100%)' }}>

        <div style={{ display:'flex', alignItems:'center',
          justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:36, height:36, borderRadius:10,
              background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.25)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TrendingUp size={18} color="#10b981"/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#edf0f7' }}>
                Daily Sales & Profit / Loss
              </div>
              <div style={{ fontSize:11, color:'#6b7490', marginTop:1 }}>
                {dsLoaded ? `${ds.count} entries recorded` : 'Loading...'}
              </div>
            </div>
          </div>
          <button onClick={() => nav('/daily-sales')}
            style={{ ...S.btn('#10b981','rgba(16,185,129,.08)') }}>
            <TrendingUp size={13}/> Open Daily Sales →
          </button>
        </div>

        {/* 6 stat boxes */}
        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10 }}>
          {[
            { emoji:'📅', label:"Today's Sale",
              val: fmtINR(ds.todaySales),
              color: ds.todaySales > 0 ? '#f59e0b' : '#6b7490' },
            { emoji:'📆', label:'This Month Sale',
              val: fmtINR(ds.monthSales),
              color: ds.monthSales > 0 ? '#f59e0b' : '#6b7490' },
            { emoji:'💸', label:'Month Expense',
              val: fmtINR(ds.monthExpense),
              color: ds.monthExpense > 0 ? '#ef4444' : '#6b7490' },
            { emoji: ds.monthProfit >= 0 ? '📈' : '📉',
              label: ds.monthProfit >= 0 ? 'Month Profit' : 'Month Loss',
              val: fmtINR(Math.abs(ds.monthProfit)),
              color: ds.monthProfit >= 0 ? '#10b981' : '#ef4444',
              big: true },
            { emoji:'💰', label:'Total Sales',
              val: fmtINR(ds.totalSales),
              color: ds.totalSales > 0 ? '#3b82f6' : '#6b7490' },
            { emoji: ds.netProfit >= 0 ? '🏆' : '⚠️',
              label: ds.netProfit >= 0 ? 'Net Profit' : 'Net Loss',
              val: fmtINR(Math.abs(ds.netProfit)),
              color: ds.netProfit >= 0 ? '#10b981' : '#ef4444',
              big: true },
          ].map((s, i) => (
            <div key={i} style={{ background:'#141720', border:`1px solid #252a3d`,
              borderRadius:12, padding:'14px 16px',
              borderTop: s.big ? `2px solid ${s.color}` : '1px solid #252a3d' }}>
              <div style={{ fontSize:22, marginBottom:8 }}>{s.emoji}</div>
              <div style={{ fontSize:10.5, color:'#6b7490', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'.4px', marginBottom:5 }}>
                {s.label}
              </div>
              <div style={{ fontSize: s.big ? 18 : 16, fontWeight:800, color:s.color }}>
                {dsLoaded ? s.val : '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Alert messages */}
        {dsLoaded && ds.count === 0 && (
          <div style={{ marginTop:14, padding:'11px 16px',
            background:'rgba(245,158,11,.07)', border:'1px solid rgba(245,158,11,.2)',
            borderRadius:10, fontSize:13, color:'#f59e0b', display:'flex',
            alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>💡</span>
            <span>No daily sales yet. Click <strong>"Add Today's Sale"</strong> above to start tracking!</span>
          </div>
        )}
        {dsLoaded && ds.count > 0 && ds.monthProfit < 0 && (
          <div style={{ marginTop:14, padding:'11px 16px',
            background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)',
            borderRadius:10, fontSize:13, color:'#ef4444' }}>
            ⚠️ This month expenses exceed sales by <strong>{fmtINR(Math.abs(ds.monthProfit))}</strong> — review your costs!
          </div>
        )}
        {dsLoaded && ds.count > 0 && ds.monthProfit > 0 && (
          <div style={{ marginTop:14, padding:'11px 16px',
            background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.2)',
            borderRadius:10, fontSize:13, color:'#10b981' }}>
            🎉 This month profit is <strong>{fmtINR(ds.monthProfit)}</strong> — great work!
          </div>
        )}
      </div>

      {/* ── ROW 3 — Chart + Invoice Summary ── */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',
        gap:14, marginBottom:16 }}>

        {/* Bar Chart */}
        <div style={{ ...S.card }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#edf0f7', marginBottom:20 }}>
            Monthly Revenue (Invoices)
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:110 }}>
            {monthly.map((m, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column',
                alignItems:'center', gap:5 }}>
                <div style={{ fontSize:8.5, color:'#6b7490', textAlign:'center',
                  minHeight:12, lineHeight:1 }}>
                  {m.amt > 0
                    ? m.amt >= 100000
                      ? `${(m.amt/100000).toFixed(1)}L`
                      : `${Math.round(m.amt/1000)}K`
                    : ''}
                </div>
                <div style={{
                  width:'100%', minHeight:4,
                  borderRadius:'5px 5px 0 0',
                  background: m.cur ? '#f59e0b' : '#1f2438',
                  border:`1px solid ${m.cur?'rgba(245,158,11,.5)':'#252a3d'}`,
                  height:`${Math.max((m.amt/maxAmt)*100, 4)}%`,
                  boxShadow: m.cur ? '0 0 16px rgba(245,158,11,.4)' : 'none',
                  transition:'height .5s ease',
                }}/>
                <div style={{ fontSize:10, fontWeight: m.cur?700:400,
                  color: m.cur ? '#f59e0b' : '#6b7490' }}>{m.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Summary */}
        <div style={{ ...S.card }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#edf0f7', marginBottom:14 }}>
            Invoice Summary
          </div>
          {[
            { label:'GST Collected',    val:fmtINR(inv.gst), color:'#10b981' },
            { label:'Total Customers',  val:customers.length,color:'#3b82f6' },
            { label:'Paid Invoices',    val:inv.paid,        color:'#10b981' },
            { label:'Pending Invoices', val:inv.pending,     color:'#f59e0b' },
            { label:'Overdue Invoices', val:inv.overdue,     color:'#ef4444' },
          ].map((r, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', padding:'10px 0',
              borderBottom: i<4 ? '1px solid #252a3d' : 'none' }}>
              <span style={{ color:'#6b7490', fontSize:13 }}>{r.label}</span>
              <span style={{ color:r.color, fontWeight:700, fontSize:15 }}>{r.val}</span>
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <button onClick={()=>nav('/customers')} style={{ ...S.btn(), flex:1, justifyContent:'center' }}>
              <Users size={13}/> Customers
            </button>
            <button onClick={()=>nav('/invoices')} style={{ ...S.btn(), flex:1, justifyContent:'center' }}>
              <FileText size={13}/> Invoices
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 4 — Recent tables ── */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>

        {/* Recent Invoices */}
        <div style={{ borderRadius:16, overflow:'hidden',
          border:'1px solid #252a3d', boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
          <div style={{ padding:'14px 18px', background:'#141720',
            borderBottom:'1px solid #252a3d',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#edf0f7' }}>
              Recent Invoices
            </div>
            <button onClick={()=>nav('/invoices')}
              style={{ fontSize:12, color:'#f59e0b', background:'none',
                border:'none', cursor:'pointer', fontWeight:600, fontFamily:'inherit' }}>
              View All →
            </button>
          </div>
          {recent.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px',
              color:'#6b7490', background:'#141720' }}>
              <FileText size={36} style={{ margin:'0 auto 12px', display:'block', color:'#404764' }}/>
              <p style={{ marginBottom:14 }}>No invoices yet</p>
              <button onClick={()=>nav('/create')}
                style={{ padding:'8px 18px', borderRadius:8, border:'none',
                  background:'#f59e0b', color:'#000', fontWeight:600,
                  cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
                Create First Invoice
              </button>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={S.th}>Invoice</th>
                <th style={S.th}>Customer</th>
                <th style={S.th}>Amount</th>
                <th style={S.th}>Status</th>
              </tr></thead>
              <tbody>
                {recent.map((r, i) => {
                  const { total } = calcInvoice(r.items);
                  return (
                    <tr key={r.id} style={{ cursor:'pointer' }}
                      onClick={() => nav('/invoices')}>
                      <td style={{ ...S.td(i), color:'#f59e0b', fontWeight:700 }}>{r.invNo}</td>
                      <td style={S.td(i)}>{r.customer}</td>
                      <td style={{ ...S.td(i), fontWeight:700 }}>{fmtINR(total)}</td>
                      <td style={S.td(i)}><StatusBadge s={r.status}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Daily Sales */}
        <div style={{ borderRadius:16, overflow:'hidden',
          border:'1px solid #252a3d', boxShadow:'0 4px 20px rgba(0,0,0,.4)' }}>
          <div style={{ padding:'14px 18px', background:'#141720',
            borderBottom:'1px solid #252a3d',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#edf0f7' }}>
              Recent Daily Sales
            </div>
            <button onClick={()=>nav('/daily-sales')}
              style={{ fontSize:12, color:'#10b981', background:'none',
                border:'none', cursor:'pointer', fontWeight:600, fontFamily:'inherit' }}>
              View All →
            </button>
          </div>
          {!dsLoaded ? (
            <div style={{ textAlign:'center', padding:40, color:'#6b7490', background:'#141720' }}>
              Loading...
            </div>
          ) : recentDS.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px',
              color:'#6b7490', background:'#141720' }}>
              <BarChart2 size={36} style={{ margin:'0 auto 12px', display:'block', color:'#404764' }}/>
              <p style={{ marginBottom:14 }}>No daily sales yet</p>
              <button onClick={()=>nav('/daily-sales')}
                style={{ padding:'8px 18px', borderRadius:8, border:'none',
                  background:'#10b981', color:'#000', fontWeight:600,
                  cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
                Add Today's Sale
              </button>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={S.th}>Date</th>
                <th style={S.th}>Sale</th>
                <th style={S.th}>Expense</th>
                <th style={S.th}>Profit/Loss</th>
              </tr></thead>
              <tbody>
                {recentDS.map((r, i) => {
                  const profit = Number(r.sale_amount||0) - Number(r.expense||0);
                  return (
                    <tr key={r.id} style={{ cursor:'pointer' }}
                      onClick={() => nav('/daily-sales')}>
                      <td style={{ ...S.td(i), fontSize:12 }}>{fmtDay(r.date)}</td>
                      <td style={{ ...S.td(i), color:'#f59e0b', fontWeight:700 }}>
                        {fmtINR(Number(r.sale_amount||0))}
                      </td>
                      <td style={{ ...S.td(i), color:'#ef4444', fontSize:12 }}>
                        {fmtINR(Number(r.expense||0))}
                      </td>
                      <td style={{ ...S.td(i), color: profit>=0?'#10b981':'#ef4444',
                        fontWeight:700 }}>
                        {profit >= 0 ? '▲ ' : '▼ '}{fmtINR(Math.abs(profit))}
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
