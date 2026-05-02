import { supabase } from './config';

// ── AUTH ──────────────────────────────────────────────────────
export const loginUser = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

export const signupUser = (email, password) =>
  supabase.auth.signUp({ email, password });

export const resetPassword = (email) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  });

export const logoutUser = () => supabase.auth.signOut();

export const onAuthChange = (cb) => {
  supabase.auth.getSession().then(({ data }) => cb(data.session?.user ?? null));
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
    cb(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
};

// ── INVOICES ──────────────────────────────────────────────────
export const addInvoice = async (uid, data) => {
  const { error } = await supabase.from('invoices').insert({
    user_id: uid,
    inv_no: data.invNo,
    date: data.date,
    due: data.due,
    customer: data.customer,
    customer_id: data.customerId || null,
    customer_gstin: data.customerGstin || null,
    customer_address: data.customerAddress || null,
    status: data.status,
    notes: data.notes || null,
    items: data.items,
  });
  if (error) throw error;
};

export const updateInvoice = async (uid, id, data) => {
  const patch = {};
  if (data.status !== undefined)    patch.status = data.status;
  if (data.invNo !== undefined)     patch.inv_no = data.invNo;
  if (data.items !== undefined)     patch.items = data.items;
  if (data.notes !== undefined)     patch.notes = data.notes;
  if (data.customer !== undefined)  patch.customer = data.customer;
  const { error } = await supabase.from('invoices').update(patch).eq('id', id).eq('user_id', uid);
  if (error) throw error;
};

export const deleteInvoice = async (uid, id) => {
  const { error } = await supabase.from('invoices').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
};

export const subscribeInvoices = (uid, cb) => {
  // Initial fetch
  supabase.from('invoices').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    .then(({ data }) => cb(data?.map(dbToInvoice) || []));

  // Real-time subscription
  const channel = supabase.channel('invoices-' + uid)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `user_id=eq.${uid}` },
      () => {
        supabase.from('invoices').select('*').eq('user_id', uid).order('created_at', { ascending: false })
          .then(({ data }) => cb(data?.map(dbToInvoice) || []));
      })
    .subscribe();
  return () => supabase.removeChannel(channel);
};

const dbToInvoice = (row) => ({
  id: row.id,
  invNo: row.inv_no,
  date: row.date,
  due: row.due,
  customer: row.customer,
  customerId: row.customer_id,
  customerGstin: row.customer_gstin,
  customerAddress: row.customer_address,
  status: row.status,
  notes: row.notes,
  items: row.items || [],
  createdAt: row.created_at,
});

// ── CUSTOMERS ─────────────────────────────────────────────────
export const addCustomer = async (uid, data) => {
  const { error } = await supabase.from('customers').insert({
    user_id: uid,
    name: data.name,
    gstin: data.gstin || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
  });
  if (error) throw error;
};

export const updateCustomer = async (uid, id, data) => {
  const { error } = await supabase.from('customers').update({
    name: data.name,
    gstin: data.gstin || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
  }).eq('id', id).eq('user_id', uid);
  if (error) throw error;
};

export const deleteCustomer = async (uid, id) => {
  const { error } = await supabase.from('customers').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
};

export const subscribeCustomers = (uid, cb) => {
  supabase.from('customers').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    .then(({ data }) => cb(data?.map(dbToCustomer) || []));

  const channel = supabase.channel('customers-' + uid)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customers', filter: `user_id=eq.${uid}` },
      () => {
        supabase.from('customers').select('*').eq('user_id', uid).order('created_at', { ascending: false })
          .then(({ data }) => cb(data?.map(dbToCustomer) || []));
      })
    .subscribe();
  return () => supabase.removeChannel(channel);
};

const dbToCustomer = (row) => ({
  id: row.id,
  name: row.name,
  gstin: row.gstin,
  phone: row.phone,
  email: row.email,
  address: row.address,
  createdAt: row.created_at,
});

// ── SETTINGS ─────────────────────────────────────────────────
export const getSettings = async (uid) => {
  const { data } = await supabase.from('settings').select('*').eq('user_id', uid).single();
  return data;
};

export const saveSettings = async (uid, data) => {
  const existing = await getSettings(uid);
  const payload = {
    user_id: uid,
    name: data.name,
    tagline: data.tagline,
    gstin: data.gstin,
    phone: data.phone,
    email: data.email,
    address: data.address,
    prefix: data.prefix,
    bank: data.bank,
    account: data.account,
    ifsc: data.ifsc,
    emailjs_service_id: data.emailjsServiceId,
    emailjs_template_id: data.emailjsTemplateId,
    emailjs_public_key: data.emailjsPublicKey,
  };
  if (existing) {
    const { error } = await supabase.from('settings').update(payload).eq('user_id', uid);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('settings').insert(payload);
    if (error) throw error;
  }
};

export const dbSettingsToForm = (row) => ({
  name: row?.name || 'DL Enterprises',
  tagline: row?.tagline || 'Quality · Trust · Excellence',
  gstin: row?.gstin || '',
  phone: row?.phone || '',
  email: row?.email || '',
  address: row?.address || '',
  prefix: row?.prefix || 'DL',
  bank: row?.bank || '',
  account: row?.account || '',
  ifsc: row?.ifsc || '',
  emailjsServiceId: row?.emailjs_service_id || '',
  emailjsTemplateId: row?.emailjs_template_id || '',
  emailjsPublicKey: row?.emailjs_public_key || '',
});
