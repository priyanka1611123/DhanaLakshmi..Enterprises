import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { subscribeInvoices, subscribeCustomers, getSettings, dbSettingsToForm, logoutUser } from './supabase/services';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import './styles/global.css';

function AppInner() {
  const { user, loading } = useAuth();
  const [invoices, setInvoices]   = useState([]);
  const [customers, setCustomers] = useState([]);
  const [business, setBusiness]   = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsubInv  = subscribeInvoices(user.id, setInvoices);
    const unsubCust = subscribeCustomers(user.id, setCustomers);
    getSettings(user.id).then(data => data && setBusiness(dbSettingsToForm(data)));
    return () => { unsubInv(); unsubCust(); };
  }, [user]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
      <div className="spinner" />
    </div>
  );

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <Sidebar user={user} business={business} />
      <main className="main">
        <Routes>
          <Route path="/"           element={<Dashboard invoices={invoices} customers={customers} />} />
          <Route path="/invoices"   element={<Invoices invoices={invoices} customers={customers} business={business} />} />
          <Route path="/create"     element={<CreateInvoice invoices={invoices} customers={customers} business={business} />} />
          <Route path="/customers"  element={<Customers customers={customers} invoices={invoices} />} />
          <Route path="/settings"   element={<Settings onUpdate={setBusiness} />} />
          <Route path="*"           element={<Navigate to="/" />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: { background:'#1a1e2d', color:'#e8ecf4', border:'1px solid #2e3450', borderRadius:10, fontSize:13 },
        success: { iconTheme: { primary:'#10b981', secondary:'#000' } },
        error:   { iconTheme: { primary:'#ef4444', secondary:'#000' } },
      }} />
      <AppInner />
    </AuthProvider>
  );
}
