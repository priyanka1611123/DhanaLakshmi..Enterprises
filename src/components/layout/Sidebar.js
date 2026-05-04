import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, PlusSquare,
  Users, Settings, LogOut, Building2,
  Menu, X, TrendingUp
} from 'lucide-react';
import { logoutUser } from '../../supabase/services';
import toast from 'react-hot-toast';

const NAV = [
  { path:'/',            icon:LayoutDashboard, label:'Dashboard'      },
  { path:'/invoices',    icon:FileText,        label:'Invoices'       },
  { path:'/create',      icon:PlusSquare,      label:'Create Invoice' },
  { path:'/customers',   icon:Users,           label:'Customers'      },
  { path:'/daily-sales', icon:TrendingUp,      label:'Daily Sales'    },
  { path:'/settings',    icon:Settings,        label:'Settings'       },
];

export default function Sidebar({ user, business }) {
  const nav  = useNavigate();
  const loc  = useLocation();
  const [open, setOpen] = useState(false);

  const handleNav = (path) => { nav(path); setOpen(false); };
  const handleLogout = async () => {
    await logoutUser();
    toast.success('Logged out');
    setOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid #252a3d' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'rgba(245,158,11,.12)', border:'1px solid rgba(245,158,11,.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Building2 size={17} color="#f59e0b"/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:'#f59e0b', letterSpacing:'.3px', lineHeight:1.2 }}>
                {business?.name || 'DL Enterprises'}
              </div>
              <div style={{ fontSize:9.5, color:'#6b7490', marginTop:1 }}>Invoice Management</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="mobile-close-x"
            style={{ background:'none', border:'none', color:'#6b7490', cursor:'pointer', padding:4, display:'none' }}>
            <X size={20}/>
          </button>
        </div>
      </div>

      <nav style={{ flex:1, padding:'10px 0', overflowY:'auto' }}>
        {NAV.map(({ path, icon:Icon, label }) => {
          const active = loc.pathname === path;
          return (
            <div key={path} onClick={() => handleNav(path)}
              style={{ display:'flex', alignItems:'center', gap:11, padding:'12px 18px', cursor:'pointer', fontSize:13, fontWeight:500, color:active?'#f59e0b':'#6b7490', borderLeft:`3px solid ${active?'#f59e0b':'transparent'}`, background:active?'rgba(245,158,11,.08)':'transparent', transition:'all .15s' }}>
              <Icon size={17} style={{ flexShrink:0 }}/>
              <span>{label}</span>
              {path==='/daily-sales' && (
                <span style={{ marginLeft:'auto', fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:10, background:'rgba(16,185,129,.15)', color:'#10b981' }}>NEW</span>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding:'14px 18px', borderTop:'1px solid #252a3d' }}>
        <div style={{ fontSize:11, color:'#6b7490', marginBottom:10 }}>
          Signed in as
          <div style={{ color:'#f59e0b', fontWeight:600, marginTop:2, fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.email}
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px', borderRadius:8, border:'1px solid #2e3452', background:'transparent', color:'#6b7490', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          <LogOut size={13}/> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        .desktop-sidebar {
          position:fixed; top:0; left:0; bottom:0; width:210px;
          background:#141720; border-right:1px solid #252a3d;
          display:flex; flex-direction:column; z-index:100;
          box-shadow:4px 0 30px rgba(0,0,0,.4);
        }
        .mobile-topbar {
          display:none; position:fixed; top:0; left:0; right:0; height:56px;
          background:#141720; border-bottom:1px solid #252a3d;
          z-index:200; align-items:center; justify-content:space-between;
          padding:0 16px; box-shadow:0 2px 12px rgba(0,0,0,.4);
        }
        .mobile-menu-btn {
          background:rgba(245,158,11,.1); border:1px solid rgba(245,158,11,.25);
          border-radius:8px; color:#f59e0b; cursor:pointer;
          padding:7px 9px; display:flex; align-items:center;
        }
        .mobile-biz { font-size:15px; font-weight:800; color:#f59e0b; }
        .mobile-drawer {
          display:none; position:fixed; top:0; left:0; bottom:0; width:260px;
          background:#141720; border-right:1px solid #252a3d;
          flex-direction:column; z-index:300;
          box-shadow:6px 0 40px rgba(0,0,0,.7);
          transform:translateX(-100%); transition:transform .25s ease;
        }
        .mobile-drawer.open { transform:translateX(0); }
        .drawer-overlay {
          display:none; position:fixed; inset:0;
          background:rgba(0,0,0,.7); z-index:250; backdrop-filter:blur(3px);
        }
        .drawer-overlay.open { display:block; }
        @media (max-width:768px) {
          .desktop-sidebar { display:none !important; }
          .mobile-topbar   { display:flex !important; }
          .mobile-drawer   { display:flex !important; }
          .mobile-close-x  { display:flex !important; }
          .main-content    { margin-left:0 !important; padding-top:70px !important; }
        }
      `}</style>

      <aside className="desktop-sidebar"><SidebarContent /></aside>

      <div className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setOpen(true)}><Menu size={20}/></button>
        <div className="mobile-biz">{business?.name || 'DL Enterprises'}</div>
        <div style={{ width:36 }}/>
      </div>

      <div className={`drawer-overlay${open?' open':''}`} onClick={() => setOpen(false)}/>

      <aside className={`mobile-drawer${open?' open':''}`}>
        <div style={{ position:'absolute', top:14, right:14, zIndex:10 }}>
          <button onClick={() => setOpen(false)}
            style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:8, color:'#ef4444', cursor:'pointer', padding:'6px 8px', display:'flex', alignItems:'center' }}>
            <X size={18}/>
          </button>
        </div>
        <SidebarContent />
      </aside>
    </>
  );
}
