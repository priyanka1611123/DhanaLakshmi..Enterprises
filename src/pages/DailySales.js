import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, PlusCircle, Trash2,
  Calendar, IndianRupee, ShoppingBag, BarChart2,
  ChevronDown, ChevronUp, Search, Filter
} from 'lucide-react';
import { supabase } from '../supabase/config';
import { useAuth } from '../hooks/useAuth';
import { fmtINR } from '../utils/helpers';
import toast from 'react-hot-toast';

// ── Style constants ───────────────────────────────────────────
const C = {
  bg:     '#0a0c12', card:   '#141720', card2:  '#1a1e2d',
  border: '#252a3d', border2:'#2e3452', accent: '#f59e0b',
  text:   '#edf0f7', muted:  '#6b7490', green:  '#10b981',
  red:    '#ef4444', blue:   '#3b82f6', purple: '#8b5cf6',
};
const card  = { background:C.card,  border:`1px solid ${C.border}`,  borderRadius:14, padding:'20px 22px', boxShadow:'0 2px 14px rgba(0,0,0,.4)' };
const card2 = { background:C.card2, border:`1px solid ${C.border2}`, borderRadius:10, padding:'14px 16px' };
const inp   = { width:'100%', background:C.card2, border:`1px solid ${C.border}`, color:C.text, padding:'10px 13px', borderRadius:9, fontSize:13, fontFamily:'inherit', outline:'none' };
const lbl   = { display:'block', fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' };
const pbtn  = (extra={}) => ({ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', background:C.accent, color:'#000', boxShadow:'0 2px 14px rgba(245,158,11,.3)', ...extra });
const gbtn  = (extra={}) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:8, border:`1px solid ${C.border2}`, cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit', background:'transparent', color:C.muted, ...extra });

const today = () => new Date().toISOString().split('T')[0];
const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};
const fmtDay = (d) => {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { weekday:'long' });
};

// ── Supabase helpers ──────────────────────────────────────────
const fetchSales = async (uid) => {
  const { data, error } = await supabase
    .from('daily_sales')
    .select('*')
    .eq('user_id', uid)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
};

const addSale = async (uid, entry) => {
  const { error } = await supabase.from('daily_sales').insert({
    user_id:     uid,
    date:        entry.date,
    sale_amount: Number(entry.saleAmount) || 0,
    expense:     Number(entry.expense)    || 0,
    category:    entry.category           || 'General',
    note:        entry.note               || '',
  });
  if (error) throw error;
};

const deleteSale = async (uid, id) => {
  const { error } = await supabase.from('daily_sales').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
};

const CATEGORIES = ['General','Helmet Sales','Accessories','Service','Online Order','Wholesale','Other'];

// ── Main Component ────────────────────────────────────────────
export default function DailySales() {
  const { user }          = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [searchDate,  setSearchDate]  = useState('');
  const [expandedDate, setExpandedDate] = useState(null);

  const [form, setForm] = useState({
    date: today(), saleAmount: '', expense: '', category: 'Helmet Sales', note: ''
  });

  useEffect(() => {
    if (!user) return;
    loadSales();
  }, [user]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await fetchSales(user.id);
      setSales(data);
    } catch (e) {
      toast.error('Failed to load sales');
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.date)        return toast.error('Pick a date');
    if (!form.saleAmount)  return toast.error('Enter sale amount');
    setSaving(true);
    try {
      await addSale(user.id, form);
      toast.success('Sale entry added!');
      setForm({ date: today(), saleAmount: '', expense: '', category: 'Helmet Sales', note: '' });
      setShowForm(false);
      await loadSales();
    } catch(e) { toast.error('Failed: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await deleteSale(user.id, id);
      toast.success('Deleted');
      await loadSales();
    } catch { toast.error('Delete failed'); }
  };

  // ── Filtered sales ──────────────────────────────────────────
  const filtered = useMemo(() => {
    return sales.filter(s => {
      const monthOk = !filterMonth || s.date.startsWith(filterMonth);
      const dateOk  = !searchDate  || s.date === searchDate;
      return monthOk && dateOk;
    });
  }, [sales, filterMonth, searchDate]);

  // ── Grouped by date ─────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(s => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return Object.entries(map).sort((a,b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // ── Summary stats ───────────────────────────────────────────
  const stats = useMemo(() => {
    const totalSales   = filtered.reduce((s,r) => s + Number(r.sale_amount||0), 0);
    const totalExpense = filtered.reduce((s,r) => s + Number(r.expense||0),     0);
    const profit       = totalSales - totalExpense;
    const avgDaily     = grouped.length > 0 ? totalSales / grouped.length : 0;
    const bestDay      = grouped.reduce((best, [date, rows]) => {
      const dayTotal = rows.reduce((s,r) => s+Number(r.sale_amount||0), 0);
      return dayTotal > best.amt ? { date, amt: dayTotal } : best;
    }, { date: '', amt: 0 });
    return { totalSales, totalExpense, profit, avgDaily, bestDay, days: grouped.length };
  }, [filtered, grouped]);

  // ── Month options ────────────────────────────────────────────
  const months = useMemo(() => {
    const set = new Set(sales.map(s => s.date.slice(0,7)));
    return Array.from(set).sort((a,b) => b.localeCompare(a));
  }, [sales]);

  return (
    <div style={{ position:'relative' }}>

      {/* Page Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.text, letterSpacing:'-.3px' }}>Daily Sales</h1>
          <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>Track daily sales, expenses and profit/loss</p>
        </div>
        <button style={pbtn()} onClick={() => setShowForm(s => !s)}>
          <PlusCircle size={15}/> Add Today's Sale
        </button>
      </div>

      {/* ── ADD ENTRY FORM ── */}
      {showForm && (
        <div style={{ ...card, marginBottom:20, borderColor:'rgba(245,158,11,.3)', position:'relative' }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.accent, marginBottom:18 }}>📝 New Sales Entry</div>
          <form onSubmit={handleAdd}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14 }}>
              {/* Date */}
              <div>
                <label style={lbl}>Date *</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(p=>({...p, date:e.target.value}))}
                  style={inp} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
              {/* Sale Amount */}
              <div>
                <label style={lbl}>Sale Amount (₹) *</label>
                <input type="number" min="0" step="0.01" value={form.saleAmount}
                  onChange={e => setForm(p=>({...p, saleAmount:e.target.value}))}
                  placeholder="e.g. 50000" style={inp}
                  onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
              {/* Expense */}
              <div>
                <label style={lbl}>Expense / Cost (₹)</label>
                <input type="number" min="0" step="0.01" value={form.expense}
                  onChange={e => setForm(p=>({...p, expense:e.target.value}))}
                  placeholder="e.g. 10000" style={inp}
                  onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
              {/* Category */}
              <div>
                <label style={lbl}>Category</label>
                <select value={form.category} onChange={e => setForm(p=>({...p, category:e.target.value}))}
                  style={inp} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Note */}
              <div style={{ gridColumn:'span 2' }}>
                <label style={lbl}>Note (optional)</label>
                <input value={form.note} onChange={e => setForm(p=>({...p, note:e.target.value}))}
                  placeholder="e.g. Sold 5 helmets, special order..." style={inp}
                  onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
            </div>

            {/* Live P&L preview */}
            {(form.saleAmount || form.expense) && (
              <div style={{ ...card2, marginTop:14, display:'flex', gap:20, flexWrap:'wrap' }}>
                <div><div style={{ fontSize:11, color:C.muted }}>Sale</div><div style={{ fontSize:15, fontWeight:700, color:C.accent }}>{fmtINR(Number(form.saleAmount)||0)}</div></div>
                <div><div style={{ fontSize:11, color:C.muted }}>Expense</div><div style={{ fontSize:15, fontWeight:700, color:C.red }}>{fmtINR(Number(form.expense)||0)}</div></div>
                <div>
                  <div style={{ fontSize:11, color:C.muted }}>Profit / Loss</div>
                  <div style={{ fontSize:15, fontWeight:700, color: (Number(form.saleAmount)||0)-(Number(form.expense)||0)>=0 ? C.green : C.red }}>
                    {(Number(form.saleAmount)||0)-(Number(form.expense)||0) >= 0 ? '▲ ' : '▼ '}
                    {fmtINR(Math.abs((Number(form.saleAmount)||0)-(Number(form.expense)||0)))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button type="submit" style={pbtn({ opacity: saving?.6:1 })} disabled={saving}>
                {saving ? 'Saving...' : '✓ Save Entry'}
              </button>
              <button type="button" style={gbtn()} onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── SUMMARY STATS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:22 }}>
        {[
          { icon:<ShoppingBag size={18}/>, iconBg:'rgba(245,158,11,.1)', iconColor:C.accent, label:'Total Sales',    val:fmtINR(stats.totalSales),   sub:`${stats.days} days` },
          { icon:<TrendingDown size={18}/>,iconBg:'rgba(239,68,68,.1)',  iconColor:C.red,    label:'Total Expenses', val:fmtINR(stats.totalExpense), sub:'all costs' },
          { icon: stats.profit>=0
              ? <TrendingUp size={18}/>
              : <TrendingDown size={18}/>,
            iconBg: stats.profit>=0?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)',
            iconColor: stats.profit>=0?C.green:C.red,
            label: stats.profit>=0?'Net Profit':'Net Loss',
            val: fmtINR(Math.abs(stats.profit)),
            sub: stats.profit>=0?'🎉 Profit!':'⚠️ Loss',
            valColor: stats.profit>=0?C.green:C.red,
          },
          { icon:<BarChart2 size={18}/>, iconBg:'rgba(59,130,246,.1)', iconColor:C.blue, label:'Avg / Day', val:fmtINR(stats.avgDaily), sub:'daily average' },
        ].map((s,i) => (
          <div key={i} style={{ ...card, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${s.iconColor},transparent)`, opacity:.6 }}/>
            <div style={{ width:38, height:38, borderRadius:10, background:s.iconBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
              <span style={{ color:s.iconColor }}>{s.icon}</span>
            </div>
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px' }}>{s.label}</div>
            <div style={{ fontSize:20, fontWeight:800, color:s.valColor||C.text, marginTop:4 }}>{s.val}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Best day callout */}
      {stats.bestDay.date && (
        <div style={{ ...card2, marginBottom:18, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', borderColor:'rgba(245,158,11,.3)', background:'rgba(245,158,11,.05)' }}>
          <div style={{ fontSize:22 }}>🏆</div>
          <div>
            <div style={{ fontSize:12, color:C.muted, fontWeight:600 }}>BEST SALES DAY</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>
              {fmtDate(stats.bestDay.date)} ({fmtDay(stats.bestDay.date)})
            </div>
          </div>
          <div style={{ marginLeft:'auto' }}>
            <div style={{ fontSize:18, fontWeight:800, color:C.accent }}>{fmtINR(stats.bestDay.amt)}</div>
          </div>
        </div>
      )}

      {/* ── FILTERS ── */}
      <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        {/* Search by date */}
        <div style={{ position:'relative', flex:1, minWidth:160 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:C.muted, pointerEvents:'none' }}/>
          <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)}
            style={{ ...inp, paddingLeft:34 }}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        {/* Filter by month */}
        <div style={{ position:'relative', minWidth:160 }}>
          <Filter size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:C.muted, pointerEvents:'none' }}/>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            style={{ ...inp, paddingLeft:34, width:'auto', minWidth:160 }}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}>
            <option value="">All Months</option>
            {months.map(m => {
              const [y,mo] = m.split('-');
              const label = new Date(y, mo-1).toLocaleString('en-IN',{month:'long',year:'numeric'});
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>
        </div>
        {(filterMonth || searchDate) && (
          <button style={gbtn({ color:C.red, borderColor:'rgba(239,68,68,.3)' })} onClick={() => { setFilterMonth(''); setSearchDate(''); }}>
            ✕ Clear Filter
          </button>
        )}
      </div>

      {/* ── SALES LIST grouped by date ── */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:C.muted }}>
          <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTopColor:C.accent, borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 14px' }}/>
          Loading sales data...
        </div>
      ) : grouped.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:C.muted }}>
          <div style={{ fontSize:48, marginBottom:14 }}>📊</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>No sales entries yet</div>
          <div style={{ fontSize:13, marginBottom:20 }}>Click "Add Today's Sale" to record your first entry</div>
          <button style={pbtn()} onClick={() => setShowForm(true)}>
            <PlusCircle size={15}/> Add First Entry
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {grouped.map(([date, rows]) => {
            const daySales   = rows.reduce((s,r) => s+Number(r.sale_amount||0), 0);
            const dayExpense = rows.reduce((s,r) => s+Number(r.expense||0),     0);
            const dayProfit  = daySales - dayExpense;
            const isExpanded = expandedDate === date;

            return (
              <div key={date} style={{ ...card, padding:0, overflow:'hidden' }}>
                {/* Date header row */}
                <div
                  onClick={() => setExpandedDate(isExpanded ? null : date)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', cursor:'pointer', background: isExpanded?'rgba(245,158,11,.05)':'transparent', transition:'background .15s', flexWrap:'wrap', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:42, height:42, borderRadius:11, background:'rgba(245,158,11,.1)', border:`1px solid rgba(245,158,11,.2)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:C.accent, lineHeight:1 }}>
                        {new Date(date+'T00:00:00').getDate()}
                      </div>
                      <div style={{ fontSize:8, color:C.muted, lineHeight:1, marginTop:1 }}>
                        {new Date(date+'T00:00:00').toLocaleString('en-IN',{month:'short'})}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{fmtDate(date)}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                        {fmtDay(date)} · {rows.length} {rows.length===1?'entry':'entries'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:11, color:C.muted }}>Sales</div>
                      <div style={{ fontSize:15, fontWeight:800, color:C.accent }}>{fmtINR(daySales)}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:11, color:C.muted }}>Expense</div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.red }}>{fmtINR(dayExpense)}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:11, color:C.muted }}>P / L</div>
                      <div style={{ fontSize:15, fontWeight:800, color: dayProfit>=0?C.green:C.red }}>
                        {dayProfit >= 0 ? '▲ ' : '▼ '}{fmtINR(Math.abs(dayProfit))}
                      </div>
                    </div>
                    <div style={{ color:C.muted }}>
                      {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </div>
                  </div>
                </div>

                {/* Expanded entries */}
                {isExpanded && (
                  <div style={{ borderTop:`1px solid ${C.border}` }}>
                    {rows.map((row, ri) => (
                      <div key={row.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderBottom: ri<rows.length-1?`1px solid rgba(37,42,58,.4)`:'none', background:ri%2===0?'transparent':'rgba(26,30,45,.4)', flexWrap:'wrap', gap:10 }}>
                        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                          {/* Category badge */}
                          <div style={{ padding:'4px 10px', borderRadius:20, fontSize:10.5, fontWeight:700, background:'rgba(139,92,246,.12)', color:C.purple, border:`1px solid rgba(139,92,246,.25)`, whiteSpace:'nowrap' }}>
                            {row.category}
                          </div>
                          {row.note && (
                            <div style={{ fontSize:12, color:C.muted, fontStyle:'italic' }}>
                              "{row.note}"
                            </div>
                          )}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:11, color:C.muted }}>Sale</div>
                            <div style={{ fontSize:13, fontWeight:700, color:C.accent }}>{fmtINR(Number(row.sale_amount)||0)}</div>
                          </div>
                          {Number(row.expense) > 0 && (
                            <div style={{ textAlign:'right' }}>
                              <div style={{ fontSize:11, color:C.muted }}>Expense</div>
                              <div style={{ fontSize:13, fontWeight:600, color:C.red }}>{fmtINR(Number(row.expense)||0)}</div>
                            </div>
                          )}
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:11, color:C.muted }}>Profit</div>
                            <div style={{ fontSize:13, fontWeight:700, color: (Number(row.sale_amount||0)-Number(row.expense||0))>=0?C.green:C.red }}>
                              {fmtINR(Number(row.sale_amount||0)-Number(row.expense||0))}
                            </div>
                          </div>
                          <button onClick={() => handleDelete(row.id)}
                            style={{ padding:'6px 8px', borderRadius:7, border:`1px solid rgba(239,68,68,.25)`, background:'rgba(239,68,68,.08)', color:C.red, cursor:'pointer', display:'flex', alignItems:'center' }}>
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Day total bar */}
                    <div style={{ padding:'12px 18px', background:'rgba(245,158,11,.04)', display:'flex', justifyContent:'flex-end', gap:24, flexWrap:'wrap' }}>
                      <span style={{ fontSize:12, color:C.muted }}>Day Total →</span>
                      <span style={{ fontSize:13, fontWeight:700, color:C.accent }}>Sales: {fmtINR(daySales)}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:C.red }}>Exp: {fmtINR(dayExpense)}</span>
                      <span style={{ fontSize:13, fontWeight:800, color: dayProfit>=0?C.green:C.red }}>
                        {dayProfit>=0?'Profit':'Loss'}: {fmtINR(Math.abs(dayProfit))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
