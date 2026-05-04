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

function AppInner() {
  const { user, loading } = useAuth();
  const [invoices,  setInvoices]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [business,  setBusiness]  = useState(null);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeInvoices(user.id,  setInvoices);
    const u2 = subscribeCustomers(user.id, setCustomers);
    getSettings(user.id).then(d => d && setBusiness(dbSettingsToForm(d)));
    return () => { u1(); u2(); };
  }, [user]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', background:'#0a0c12' }}>
      <div style={{ width:42, height:42, border:'3px solid #252a3d',
        borderTopColor:'#f59e0b', borderRadius:'50%',
        animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      {/* Background glow orbs */}
      <div style={{ position:'fixed', pointerEvents:'none', zIndex:0,
        width:500, height:500, top:-120, left:'28%', borderRadius:'50%',
        background:'radial-gradient(circle,rgba(245,158,11,.05),transparent 65%)',
        filter:'blur(60px)' }}/>
      <div style={{ position:'fixed', pointerEvents:'none', zIndex:0,
        width:350, height:350, bottom:'5%', right:'5%', borderRadius:'50%',
        background:'radial-gradient(circle,rgba(59,130,246,.04),transparent 65%)',
        filter:'blur(60px)' }}/>

      <div className="app-layout">
        <Sidebar user={user} business={business}/>
        {/* main-content class is styled in public/index.html */}
          <main
  className="main"
  style={{
    position: 'relative',
    zIndex: 1
  }}
>
          <Routes>
            <Route path="/"            element={<Dashboard     invoices={invoices} customers={customers}/>}/>
            <Route path="/invoices"    element={<Invoices       invoices={invoices} customers={customers} business={business}/>}/>
            <Route path="/create"      element={<CreateInvoice  invoices={invoices} customers={customers} business={business}/>}/>
            <Route path="/customers"   element={<Customers      customers={customers} invoices={invoices}/>}/>
            <Route path="/daily-sales" element={<DailySales/>}/>
            <Route path="/settings"    element={<Settings       onUpdate={setBusiness}/>}/>
            <Route path="*"            element={<Navigate to="/"/>}/>
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
        style:{ background:'#1a1e2d', color:'#edf0f7', border:'1px solid #2e3452',
          borderRadius:10, fontSize:13, boxShadow:'0 8px 30px rgba(0,0,0,.5)' },
        success:{ iconTheme:{ primary:'#10b981', secondary:'#000' } },
        error:{   iconTheme:{ primary:'#ef4444', secondary:'#000' } },
      }}/>
      <AppInner/>
    </AuthProvider>
  );
}
