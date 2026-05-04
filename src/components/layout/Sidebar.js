import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, PlusSquare,
  Users, Settings, LogOut, Building2,
  Menu, X, TrendingUp
} from 'lucide-react';
import { logoutUser } from '../../supabase/services';
import toast from 'react-hot-toast';

const NAV = [
  { path:'/',            icon:LayoutDashboard, label:'Dashboard'       },
  { path:'/invoices',    icon:FileText,        label:'Invoices'        },
  { path:'/create',      icon:PlusSquare,      label:'Create Invoice'  },
  { path:'/customers',   icon:Users,           label:'Customers'       },
  { path:'/daily-sales', icon:TrendingUp,      label:'Daily Sales', badge:'NEW' },
  { path:'/settings',    icon:Settings,        label:'Settings'        },
];

export default function Sidebar({ user, business }) {
  const nav            = useNavigate();
  const loc            = useLocation();
  const [open, setOpen] = useState(false);

  // Close drawer when route changes
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logoutUser();
    toast.success('Logged out');
  };

  // ── Shared nav list ──────────────────────────────────────
  const NavList = () => (
    <>
      {NAV.map(({ path, icon:Icon, label, badge }) => {
        const active = loc.pathname === path;
        return (
          <div key={path}
            onClick={() => { nav(path); setOpen(false); }}
            style={{
              display:'flex', alignItems:'center', gap:11,
              padding:'13px 18px', cursor:'pointer',
              fontSize:13.5, fontWeight:500,
              color: active ? '#f59e0b' : '#6b7490',
              borderLeft:`3px solid ${active ? '#f59e0b' : 'transparent'}`,
              background: active ? 'rgba(245,158,11,.09)' : 'transparent',
              transition:'all .15s', userSelect:'none',
              WebkitTapHighlightColor:'transparent',
            }}>
            <Icon size={17} style={{ flexShrink:0 }}/>
            <span style={{ flex:1 }}>{label}</span>
            {badge && (
              <span style={{ fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:8,
                background:'rgba(16,185,129,.15)', color:'#10b981', letterSpacing:.3 }}>
                {badge}
              </span>
            )}
          </div>
        );
      })}
    </>
  );

  // ── Logo block ───────────────────────────────────────────
  const Logo = ({ showClose }) => (
    <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid #252a3d', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9,
            background:'rgba(245,158,11,.12)', border:'1px solid rgba(245,158,11,.25)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Building2 size={18} color="#f59e0b"/>
          </div>
          <div>
            <div style={{ fontSize:13.5, fontWeight:800, color:'#f59e0b', lineHeight:1.2 }}>
              {business?.name || 'DL Enterprises'}
            </div>
            <div style={{ fontSize:10, color:'#6b7490', marginTop:2 }}>Invoice Management</div>
          </div>
        </div>
        {showClose && (
          <button onClick={() => setOpen(false)}
            style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.3)',
              borderRadius:8, color:'#ef4444', cursor:'pointer',
              padding:'6px 8px', display:'flex', alignItems:'center', flexShrink:0 }}>
            <X size={18}/>
          </button>
        )}
      </div>
    </div>
  );

  // ── Footer ───────────────────────────────────────────────
  const Footer = () => (
    <div style={{ padding:'14px 18px', borderTop:'1px solid #252a3d', flexShrink:0 }}>
      <div style={{ fontSize:11, color:'#6b7490', marginBottom:10 }}>
        Signed in as
        <div style={{ color:'#f59e0b', fontWeight:700, marginTop:2,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:11 }}>
          {user?.email}
        </div>
      </div>
      <button onClick={handleLogout}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center',
          gap:7, padding:'10px', borderRadius:9, border:'1px solid #2e3452',
          background:'transparent', color:'#6b7490', fontSize:13, fontWeight:600,
          cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
        <LogOut size={14}/> Sign Out
      </button>
    </div>
  );

  return (
    <>
      {/* ══ DESKTOP SIDEBAR ══ */}
      <aside
  className="desktop-sidebar"
  style={{
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  }}
>
        <Logo showClose={false}/>
        <nav style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          <NavList/>
        </nav>
        <Footer/>
      </aside>

      {/* ══ MOBILE TOPBAR ══ */}
      <div className="mobile-topbar">
        {/* Hamburger */}
        <button onClick={() => setOpen(true)}
          style={{ background:'rgba(245,158,11,.12)', border:'1px solid rgba(245,158,11,.3)',
            borderRadius:9, color:'#f59e0b', cursor:'pointer',
            padding:'9px 11px', display:'flex', alignItems:'center',
            WebkitTapHighlightColor:'transparent' }}>
          <Menu size={22}/>
        </button>

        {/* Business name center */}
        <div style={{ fontSize:16, fontWeight:800, color:'#f59e0b', letterSpacing:'.2px' }}>
          {business?.name || 'DL Enterprises'}
        </div>

        {/* Right spacer (keeps name centered) */}
        <div style={{ width:44 }}/>
      </div>

      {/* ══ DARK OVERLAY ══ */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position:'fixed', inset:0,
            background:'rgba(0,0,0,.78)',
            zIndex:250,
            backdropFilter:'blur(4px)',
            WebkitBackdropFilter:'blur(4px)',
          }}
        />
      )}

      {/* ══ MOBILE DRAWER ══ */}
      <aside style={{
        position:'fixed', top:0, left:0, bottom:0,
        width:265,
        background:'#141720',
        borderRight:'1px solid #252a3d',
        display:'flex', flexDirection:'column',
        zIndex:300,
        boxShadow:'8px 0 40px rgba(0,0,0,.8)',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform .28s cubic-bezier(.4,0,.2,1)',
        willChange:'transform',
      }}>
        <Logo showClose={true}/>
        <nav style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          <NavList/>
        </nav>
        <Footer/>
      </aside>
    </>
  );
}
