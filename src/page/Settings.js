import React, { useState, useEffect } from 'react';
import { Save, Building2, CreditCard, Mail, MessageCircle, Info } from 'lucide-react';
import { saveSettings, getSettings, dbSettingsToForm } from '../supabase/services';
import { useAuth } from '../hooks/useAuth';
import { validateGSTIN } from '../utils/helpers';
import toast from 'react-hot-toast';

const Section = ({ icon: Icon, title, children }) => (
  <div className="card" style={{ marginBottom: 18 }}>
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
      <Icon size={16} color="var(--accent)" />
      <span style={{ fontWeight:700, fontSize:14, color:'var(--accent)' }}>{title}</span>
    </div>
    {children}
  </div>
);

const DEFAULT = {
  name:'DL Enterprises', tagline:'Quality · Trust · Excellence',
  gstin:'', phone:'', email:'', address:'', prefix:'DL',
  bank:'', account:'', ifsc:'',
  emailjsServiceId:'', emailjsTemplateId:'', emailjsPublicKey:'',
};

export default function Settings({ onUpdate }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [gstinErr, setGstinErr] = useState('');
  const [s, setS] = useState(DEFAULT);

  useEffect(() => {
    if (!user) return;
    getSettings(user.id).then(data => {
      if (data) setS(dbSettingsToForm(data));
    });
  }, [user]);

  const upd = (k, v) => setS(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (s.gstin) {
      const r = validateGSTIN(s.gstin);
      if (!r.valid) return toast.error(r.msg);
    }
    setSaving(true);
    try {
      await saveSettings(user.id, s);
      onUpdate && onUpdate(s);
      toast.success('Settings saved!');
    } catch (e) { toast.error('Save failed: ' + e.message); }
    setSaving(false);
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Manage your business details and integrations</div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      <div style={{ maxWidth: 680 }}>
        <Section icon={Building2} title="Business Information">
          <div className="grid-2">
            <div className="form-group">
              <label>Business Name *</label>
              <input value={s.name} onChange={e => upd('name', e.target.value)} placeholder="Your business name" />
            </div>
            <div className="form-group">
              <label>Tagline</label>
              <input value={s.tagline} onChange={e => upd('tagline', e.target.value)} placeholder="Quality · Trust" />
            </div>
            <div className="form-group">
              <label>GSTIN</label>
              <input value={s.gstin} onChange={e => {
                const v = e.target.value.toUpperCase();
                upd('gstin', v);
                setGstinErr(validateGSTIN(v).msg);
              }} placeholder="33AABCD1234E1ZX" className={gstinErr ? 'input-error' : ''} />
              {gstinErr && <div className="error-msg">{gstinErr}</div>}
              {s.gstin && !gstinErr && <div style={{ fontSize:11, color:'var(--green)', marginTop:3 }}>✓ Valid GSTIN</div>}
            </div>
            <div className="form-group">
              <label>Invoice Prefix</label>
              <input value={s.prefix} onChange={e => upd('prefix', e.target.value)} placeholder="DL" maxLength={6} />
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>e.g. DL/2024/001</div>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={s.phone} onChange={e => upd('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={s.email} onChange={e => upd('email', e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="form-group" style={{ gridColumn:'span 2' }}>
              <label>Business Address</label>
              <textarea rows={2} value={s.address} onChange={e => upd('address', e.target.value)}
                placeholder="Full address with city, state, pincode" style={{ resize:'none' }} />
            </div>
          </div>
        </Section>

        <Section icon={CreditCard} title="Bank Details (shown on invoices)">
          <div className="grid-2">
            <div className="form-group">
              <label>Bank Name</label>
              <input value={s.bank} onChange={e => upd('bank', e.target.value)} placeholder="State Bank of India" />
            </div>
            <div className="form-group">
              <label>Account Number</label>
              <input value={s.account} onChange={e => upd('account', e.target.value)} placeholder="Account number" />
            </div>
            <div className="form-group">
              <label>IFSC Code</label>
              <input value={s.ifsc} onChange={e => upd('ifsc', e.target.value)} placeholder="SBIN0001234" />
            </div>
          </div>
        </Section>

        <Section icon={Mail} title="Email Integration (EmailJS – Free)">
          <div style={{ background:'rgba(59,130,246,.08)', border:'1px solid rgba(59,130,246,.2)', borderRadius:10, padding:'12px 14px', marginBottom:16, fontSize:12, color:'var(--muted)', lineHeight:1.8 }}>
            <div style={{ fontWeight:700, color:'var(--blue)', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
              <Info size={13} /> Setup at emailjs.com (free, 200 emails/month):
            </div>
            1. Sign up → Add Email Service (Gmail) → get <strong>Service ID</strong><br/>
            2. Create Template → get <strong>Template ID</strong><br/>
            3. Account → get <strong>Public Key</strong><br/>
            4. Template variables: <code style={{ color:'var(--accent)' }}>{'{{to_name}}, {{inv_no}}, {{total}}, {{company}}'}</code>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>EmailJS Service ID</label>
              <input value={s.emailjsServiceId} onChange={e => upd('emailjsServiceId', e.target.value)} placeholder="service_xxxxxxx" />
            </div>
            <div className="form-group">
              <label>EmailJS Template ID</label>
              <input value={s.emailjsTemplateId} onChange={e => upd('emailjsTemplateId', e.target.value)} placeholder="template_xxxxxxx" />
            </div>
            <div className="form-group" style={{ gridColumn:'span 2' }}>
              <label>EmailJS Public Key</label>
              <input value={s.emailjsPublicKey} onChange={e => upd('emailjsPublicKey', e.target.value)} placeholder="Your public key" />
            </div>
          </div>
        </Section>

        <Section icon={MessageCircle} title="WhatsApp Sharing">
          <div style={{ background:'rgba(37,211,102,.07)', border:'1px solid rgba(37,211,102,.2)', borderRadius:10, padding:'12px 14px', fontSize:12, color:'var(--muted)', lineHeight:1.8 }}>
            <div style={{ fontWeight:700, color:'#25d366', marginBottom:4 }}>✓ WhatsApp sharing is ready — no setup needed!</div>
            Click the WhatsApp button on any invoice to share invoice details instantly.
          </div>
        </Section>

        <button className="btn btn-primary" style={{ padding:'12px 28px' }} onClick={handleSave} disabled={saving}>
          <Save size={15} /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
}
