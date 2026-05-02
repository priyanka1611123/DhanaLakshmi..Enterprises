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
import Settings from './pages/Settings';
import './styles/global.css';

// Inject critical base styles directly — guarantees they load even if CSS file has issues
const CRITICAL_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#0a0c12; --bg2:#0f1219; --card:#141720; --card2:#1a1e2d; --card3:#1f2438;
    --border:#252a3d; --border2:#2e3452; --accent:#f59e0b; --accent2:#fbbf24;
    --text:#edf0f7; --text2:#b0b8cc; --muted:#6b7490; --muted2:#404764;
    --green:#10b981; --red:#ef4444; --blue:#3b82f6;
    --sidebar-w:210px;
    --shadow-sm:0 2px 8px rgba(0,0,0,.4);
    --shadow-md:0 4px 20px rgba(0,0,0,.5);
  }
  html,body,#root { height:100%; background:var(--bg); color:var(--text);
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    font-size:14px; -webkit-font-smoothing:antialiased; }
  .app-layout { display:flex; min-height:100vh; }
  .main { margin-left:var(--sidebar-w); padding:28px 30px; min-height:100vh; flex:1; position:relative; z-index:1; }
  .sidebar { position:fixed;top:0;left:0;bottom:0;width:var(--sidebar-w);background:var(--card);border-right:1px solid var(--border);display:flex;flex-direction:column;z-index:100;box-shadow:4px 0 24px rgba(0,0,0,.3); }
`;

function injectStyles() {
  if (document.getElementById('dl-critical')) return;
  const s = document.createElement('style');
  s.id = 'dl-critical';
  s.textContent = CRITICAL_STYLES;
  document.head.insertBefore(s, document.head.firstChild);
}

function AppInner() {
  const { user, loading } = useAuth();
  const [invoices,  setInvoices]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [business,  setBusiness]  = useState(null);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    if (!user) return;
    const unsubInv  = subscribeInvoices(user.id,  setInvoices);
    const unsubCust = subscribeCustomers(user.id, setCustomers);
    getSettings(user.id).then(data => data && setBusiness(dbSettingsToForm(data)));
    return () => { unsubInv(); unsubCust(); };
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
      <div className="app-layout">
        {/* Background glow orbs */}
        <div style={{ position:'fixed', pointerEvents:'none', zIndex:0, width:'600px', height:'600px', top:'-150px', left:'25%', borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,.05) 0%, transparent 65%)', filter:'blur(60px)' }}/>
        <div style={{ position:'fixed', pointerEvents:'none', zIndex:0, width:'400px', height:'400px', bottom:'5%', right:'5%', borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,.04) 0%, transparent 65%)', filter:'blur(60px)' }}/>
        <Sidebar user={user} business={business} />
        <main className="main">
          <Routes>
            <Route path="/"           element={<Dashboard    invoices={invoices} customers={customers} />} />
            <Route path="/invoices"   element={<Invoices     invoices={invoices} customers={customers} business={business} />} />
            <Route path="/create"     element={<CreateInvoice invoices={invoices} customers={customers} business={business} />} />
            <Route path="/customers"  element={<Customers    customers={customers} invoices={invoices} />} />
            <Route path="/settings"   element={<Settings     onUpdate={setBusiness} />} />
            <Route path="*"           element={<Navigate to="/" />} />
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
        style: { background:'#1a1e2d', color:'#edf0f7', border:'1px solid #2e3452', borderRadius:10, fontSize:13, boxShadow:'0 8px 30px rgba(0,0,0,.5)' },
        success: { iconTheme: { primary:'#10b981', secondary:'#000' } },
        error:   { iconTheme: { primary:'#ef4444', secondary:'#000' } },
      }}/>
      <AppInner />
    </AuthProvider>
  );
}
