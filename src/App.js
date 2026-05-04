import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { subscribeInvoices, subscribeCustomers, getSettings, dbSettingsToForm } from './supabase/services';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import Customers from './pages/Customers';
import DailySales from './pages/DailySales';
import Settings from './pages/Settings';
import './styles/global.css';

const CRIT = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0a0c12;--card:#141720;--card2:#1a1e2d;
    --border:#252a3d;--border2:#2e3452;--accent:#f59e0b;
    --text:#edf0f7;--muted:#6b7490;--muted2:#404764;
    --green:#10b981;--red:#ef4444;--blue:#3b82f6;
  }
  html,body,#root{height:100%;background:#0a0c12!important;color:#edf0f7!important;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    font-size:14px;-webkit-font-smoothing:antialiased;}
  .app-layout{display:flex;min-height:100vh;background:#0a0c12;}
  .main-content{margin-left:210px;padding:28px 30px;min-height:100vh;
    background:#0a0c12;flex:1;position:relative;z-index:1;width:calc(100% - 210px);}
  @media(max-width:768px){
    .main-content{margin-left:0!important;padding:72px 14px 24px!important;width:100%!important;}
  }
  input,select,textarea{width:100%;background:#1a1e2d;border:1px solid #252a3d;
    color:#edf0f7;padding:10px 13px;border-radius:9px;font-size:13px;font-family:inherit;outline:none;}
  input:focus,select:focus,textarea:focus{border-color:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.1);}
  input::placeholder,textarea::placeholder{color:#404764;}
  select option{background:#1a1e2d;color:#edf0f7;}
  table{width:100%;border-collapse:collapse;}
  th{padding:12px 16px;font-size:11px;font-weight:700;color:#6b7490;text-transform:uppercase;
    letter-spacing:.6px;text-align:left;border-bottom:1px solid #252a3d;background:#1a1e2d;}
  td{padding:12px 16px;font-size:13px;border-bottom:1px solid rgba(37,42,58,.5);
    color:#edf0f7;background:#141720;}
  tbody tr:nth-child(even) td{background:#0f1219;}
  tbody tr:hover td{background:rgba(245,158,11,.04)!important;}
  tr:last-child td{border-bottom:none;}
  *{scrollbar-width:thin;scrollbar-color:#2e3452 transparent;}
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-thumb{background:#2e3452;border-radius:4px;}
  @keyframes spin{to{transform:rotate(360deg)}}
`;

function inject() {
  if (document.getElementById('dl-crit')) return;
  const s = document.createElement('style');
  s.id = 'dl-crit'; s.textContent = CRIT;
  document.head.insertBefore(s, document.head.firstChild);
}

function AppInner() {
  const { user, loading } = useAuth();
  const [invoices,  setInvoices]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [business,  setBusiness]  = useState(null);

  useEffect(() => { inject(); }, []);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeInvoices(user.id,  setInvoices);
    const u2 = subscribeCustomers(user.id, setCustomers);
    getSettings(user.id).then(d => d && setBusiness(dbSettingsToForm(d)));
    return () => { u1(); u2(); };
  }, [user]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0a0c12' }}>
      <div style={{ width:40, height:40, border:'3px solid #252a3d', borderTopColor:'#f59e0b', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <div style={{ position:'fixed', pointerEvents:'none', zIndex:0, width:'500px', height:'500px', top:'-120px', left:'28%', borderRadius:'50%', background:'radial-gradient(circle,rgba(245,158,11,.05) 0%,transparent 65%)', filter:'blur(60px)' }}/>
      <div style={{ position:'fixed', pointerEvents:'none', zIndex:0, width:'350px', height:'350px', bottom:'5%', right:'5%', borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,.04) 0%,transparent 65%)', filter:'blur(60px)' }}/>
      <div className="app-layout">
        <Sidebar user={user} business={business} />
        <main className="main-content">
          <Routes>
            <Route path="/"            element={<Dashboard    invoices={invoices} customers={customers} />} />
            <Route path="/invoices"    element={<Invoices     invoices={invoices} customers={customers} business={business} />} />
            <Route path="/create"      element={<CreateInvoice invoices={invoices} customers={customers} business={business} />} />
            <Route path="/customers"   element={<Customers    customers={customers} invoices={invoices} />} />
            <Route path="/daily-sales" element={<DailySales />} />
            <Route path="/settings"    element={<Settings     onUpdate={setBusiness} />} />
            <Route path="*"            element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style:{ background:'#1a1e2d', color:'#edf0f7', border:'1px solid #2e3452', borderRadius:10, fontSize:13, boxShadow:'0 8px 30px rgba(0,0,0,.5)' },
        success:{ iconTheme:{ primary:'#10b981', secondary:'#000' } },
        error:{   iconTheme:{ primary:'#ef4444', secondary:'#000' } },
      }}/>
      <AppInner />
    </AuthProvider>
  );
}
