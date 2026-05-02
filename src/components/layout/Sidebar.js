import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusSquare,
  Users,
  Settings,
  LogOut,
  Building2
} from 'lucide-react';

import { logoutUser } from '../../supabase/services';
import toast from 'react-hot-toast';

const NAV = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/invoices', icon: FileText, label: 'Invoices' },
  { path: '/create', icon: PlusSquare, label: 'Create Invoice' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ user, business }) {
  const nav = useNavigate();
  const loc = useLocation();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('Logged out');
      nav('/login'); // redirect after logout
    } catch (err) {
      console.error(err);
      toast.error('Logout failed');
    }
  };

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 210,
        background: '#141720',
        borderRight: '1px solid #252a3d',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        boxShadow: '4px 0 30px rgba(0,0,0,.4)'
      }}
    >
      {/* Logo */}
      <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid #252a3d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'rgba(245,158,11,.12)',
              border: '1px solid rgba(245,158,11,.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Building2 size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b' }}>
            {business?.name || 'DL Enterprises'}
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#6b7490', marginLeft: 39 }}>
          Invoice Management
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = loc.pathname.startsWith(path);

          return (
            <div
              key={path}
              onClick={() => nav(path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 18px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                color: active ? '#f59e0b' : '#6b7490',
                borderLeft: `3px solid ${active ? '#f59e0b' : 'transparent'}`,
                background: active ? 'rgba(245,158,11,.08)' : 'transparent',
                transition: 'all .15s'
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid #252a3d' }}>
        <div style={{ fontSize: 11, color: '#6b7490', marginBottom: 10 }}>
          Signed in as
          <div
            style={{
              color: '#f59e0b',
              fontWeight: 600,
              marginTop: 2,
              fontSize: 11,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {user?.email}
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            padding: '8px',
            borderRadius: 8,
            border: '1px solid #2e3452',
            background: 'transparent',
            color: '#6b7490',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
