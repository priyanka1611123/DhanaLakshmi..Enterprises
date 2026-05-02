import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusSquare, Users, Settings, LogOut, Building2 } from 'lucide-react';
import { logoutUser } from '../../supabase/services';
import toast from 'react-hot-toast';

const NAV = [
  { path:'/',          icon:LayoutDashboard, label:'Dashboard' },
  { path:'/invoices',  icon:FileText,        label:'Invoices' },
  { path:'/create',    icon:PlusSquare,      label:'Create Invoice' },
  { path:'/customers', icon:Users,           label:'Customers' },
  { path:'/settings',  icon:Settings,        label:'Settings' },
];

export default function Sidebar({ user, business }) {
  const nav = useNavigate();
  const loc = useLocation();

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Logged out');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <Building2 size={18} color="var(--accent)" />
          <div className="logo-name">{business?.name || 'DL Enterprises'}</div>
        </div>
        <div className="logo-tagline">Invoice Management</div>
      </div>
      <nav className="nav-section">
        {NAV.map(({ path, icon: Icon, label }) => (
          <div key={path} className={`nav-item${loc.pathname === path ? ' active' : ''}`} onClick={() => nav(path)}>
            <Icon size={17} /><span>{label}</span>
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ fontSize:11, color:'var(--muted)', marginBottom:10 }}>
          Signed in as
          <span style={{ color:'var(--accent)', display:'block', fontWeight:600, marginTop:2 }}>
            {user?.email}
          </span>
        </div>
        <button className="btn btn-ghost btn-sm w-full" onClick={handleLogout}>
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
