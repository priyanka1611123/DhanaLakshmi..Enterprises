import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Clock, AlertTriangle, CheckCircle,
  Users, PlusSquare, FileText, IndianRupee
} from 'lucide-react';
import { fmtINR, calcInvoice, fmtDate } from '../utils/helpers';

export default function Dashboard({ invoices, customers }) {
  const nav = useNavigate();

  const stats = useMemo(() => {
    const paid    = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending');
    const overdue = invoices.filter(i => i.status === 'overdue');
    const total   = invoices.reduce((s, i) => s + calcInvoice(i.items).total, 0);
    const collected = paid.reduce((s, i) => s + calcInvoice(i.items).total, 0);
    const pendingAmt = pending.reduce((s, i) => s + calcInvoice(i.items).total, 0);
    const gstCollected = invoices.reduce((s, i) => s + calcInvoice(i.items).gstTotal, 0);
    return { total, collected, pendingAmt, gstCollected, paid: paid.length, pending: pending.length, overdue: overdue.length };
  }, [invoices]);

  const recent = useMemo(() =>
    [...invoices].slice(0, 6),
    [invoices]
  );

  // Monthly revenue (last 6 months)
  const monthly = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      const amt = invoices
        .filter(inv => (inv.date || '').startsWith(key))
        .reduce((s, inv) => s + calcInvoice(inv.items).total, 0);
      months.push({ label, amt });
    }
    return months;
  }, [invoices]);

  const maxAmt = Math.max(...monthly.map(m => m.amt), 1);

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Your business at a glance</div>
        </div>
        <button className="btn btn-primary" onClick={() => nav('/create')}>
          <PlusSquare size={15} /> New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<IndianRupee size={20} />} iconBg="rgba(245,158,11,.12)" iconColor="var(--accent)"
          label="Total Revenue" value={fmtINR(stats.total)} sub={`${invoices.length} invoices total`} />
        <StatCard icon={<CheckCircle size={20} />} iconBg="rgba(16,185,129,.12)" iconColor="var(--green)"
          label="Collected" value={fmtINR(stats.collected)} sub={`${stats.paid} paid invoices`} />
        <StatCard icon={<Clock size={20} />} iconBg="rgba(245,158,11,.1)" iconColor="var(--accent)"
          label="Pending" value={fmtINR(stats.pendingAmt)} sub={`${stats.pending} awaiting payment`} />
        <StatCard icon={<AlertTriangle size={20} />} iconBg="rgba(239,68,68,.1)" iconColor="var(--red)"
          label="Overdue" value={`${stats.overdue} invoices`} sub="Immediate attention needed" valueStyle={{ color: 'var(--red)', fontSize: 20 }} />
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Chart */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>Monthly Revenue</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130 }}>
            {monthly.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>
                  {m.amt > 0 ? fmtINR(m.amt).replace('₹', '') : ''}
                </div>
                <div style={{
                  width: '100%', borderRadius: '5px 5px 0 0',
                  background: i === monthly.length - 1 ? 'var(--accent)' : 'var(--card2)',
                  border: '1px solid var(--border)',
                  height: `${Math.max((m.amt / maxAmt) * 100, 4)}%`,
                  transition: 'height .4s ease',
                  minHeight: 4
                }} />
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick info */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Summary</div>
          {[
            { label: 'GST Collected', value: fmtINR(stats.gstCollected), color: 'var(--green)' },
            { label: 'Total Customers', value: customers.length, color: 'var(--blue)' },
            { label: 'Paid Invoices', value: stats.paid, color: 'var(--green)' },
            { label: 'Pending Invoices', value: stats.pending, color: 'var(--accent)' },
            { label: 'Overdue Invoices', value: stats.overdue, color: 'var(--red)' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{r.label}</span>
              <span style={{ color: r.color, fontWeight: 700, fontSize: 14 }}>{r.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => nav('/customers')}>
              <Users size={13} /> Customers
            </button>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => nav('/invoices')}>
              <FileText size={13} /> Invoices
            </button>
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Recent Invoices</div>
          <button className="btn btn-ghost btn-sm" onClick={() => nav('/invoices')}>View All →</button>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} />
            <p style={{ marginTop: 10 }}>No invoices yet</p>
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => nav('/create')}>Create First Invoice</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(inv => {
                const { total } = calcInvoice(inv.items);
                return (
                  <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => nav('/invoices')}>
                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{inv.invNo}</td>
                    <td>{inv.customer}</td>
                    <td style={{ color: 'var(--muted)' }}>{inv.date}</td>
                    <td style={{ fontWeight: 600 }}>{fmtINR(total)}</td>
                    <td><StatusBadge s={inv.status} /></td>
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

function StatCard({ icon, iconBg, iconColor, label, value, sub, valueStyle }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={valueStyle}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

export function StatusBadge({ s }) {
  const map = { paid: 'badge-green', pending: 'badge-yellow', overdue: 'badge-red' };
  return <span className={`badge ${map[s] || 'badge-yellow'}`}>{s}</span>;
}
