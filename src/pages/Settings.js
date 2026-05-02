import React, { useState, useEffect } from 'react';
import { Save, Building2, CreditCard, Mail, MessageCircle, Info } from 'lucide-react';
import { saveSettings, getSettings, dbSettingsToForm } from '../supabase/services';
import { useAuth } from '../hooks/useAuth';
import { validateGSTIN } from '../utils/helpers';
import toast from 'react-hot-toast';

const inp = { width:'100%', background:'#1a1e2d', border:'1px solid #252a3d', color:'#edf0f7', padding:'10px 13px', borderRadius:9, fontSize:13, fontFamily:'inherit', outline:'none' };
const lbl = { display:'block', fontSize:11, color:'#6b7490', fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' };
const fg  = { marginBottom:14 };

function Section({ icon:Icon, title, children }) {
  return (
    <div style={{ background:'#141720', border:'1px solid #252a3d', borderRadius:14, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,.4)', marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:18, paddingBottom:14, borderBottom:'1px solid #252a3d' }}>
        <div style={{ width:32, height:32, borderRadius:8, background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={15} color="#f59e0b"/></div>
        <span style={{ fontWeight:700, fontSize:14, color:'#edf0f7' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

const DEFAULT = { name:'DL Enterprises', tagline:'Quality · Trust · Excellence', gstin:'', phone:'', email:'', address:'', prefix:'DL', bank:'', account:'', ifsc:'', emailjsServiceId:'', emailjsTemplateId:'', emailjsPublicKey:'' };

export default function Settings({ onUpdate }) {
  const { user }    = useAuth();
  const [saving, setSaving]     = useState(false);
  const [gstinErr, setGstinErr] = useState('');
  const [s, setS]   = useState(DEFAULT);

  useEffect(() => {
    if (!user) return;
    getSettings(user.id).then(data => { if (data) setS(dbSettingsToForm(data)); });
  }, [user]);

  const upd = (k,v) => setS(p => ({...p,[k]:v}));
  const fo  = e => e.target.style.borderColor='#f59e0b';
  const bl  = e => e.target.style.borderColor='#252a3d';

  const handleSave = async () => {
    if (s.gstin) { const r=validateGSTIN(s.gstin); if(!r.valid) return toast.error(r.msg); }
    setSaving(true);
    try { await saveSettings(user.id, s); onUpdate&&onUpdate(s); toast.success('Settings saved!'); }
    catch(e) { toast.error('Save failed'); }
    setSaving(false);
  };

  const Field = ({ label:l, k, placeholder, type='text', span=false, textarea=false }) => (
    <div style={{ ...fg, ...(span?{gridColumn:'span 2'}:{}) }}>
      <label style={lbl}>{l}</label>
      {textarea
        ? <textarea rows={2} value={s[k]} onChange={e=>upd(k,e.target.value)} placeholder={placeholder} style={{ ...inp, resize:'none' }} onFocus={fo} onBlur={bl}/>
        : <input type={type} value={s[k]} onChange={e=>upd(k,e.target.value)} placeholder={placeholder} style={inp} onFocus={fo} onBlur={bl}/>}
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#edf0f7' }}>Settings</h1>
          <p style={{ fontSize:13, color:'#6b7490', marginTop:4 }}>Manage your business details and integrations</p>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:'#f59e0b', color:'#000', boxShadow:'0 2px 14px rgba(245,158,11,.35)', opacity:saving?.6:1 }}>
          <Save size={14}/> {saving?'Saving...':'Save Settings'}
        </button>
      </div>

      <div style={{ maxWidth:660 }}>
        <Section icon={Building2} title="Business Information">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Business Name *" k="name"    placeholder="Your business name"/>
            <Field label="Tagline"         k="tagline" placeholder="Quality · Trust"/>
            <div style={fg}>
              <label style={lbl}>GSTIN</label>
              <input value={s.gstin} onChange={e=>{const v=e.target.value.toUpperCase();upd('gstin',v);setGstinErr(validateGSTIN(v).msg)}}
                placeholder="33AABCD1234E1ZX" style={{ ...inp, borderColor:gstinErr?'#ef4444':'#252a3d' }} onFocus={fo} onBlur={bl}/>
              {gstinErr && <div style={{ fontSize:11, color:'#ef4444', marginTop:4 }}>{gstinErr}</div>}
              {s.gstin && !gstinErr && <div style={{ fontSize:11, color:'#10b981', marginTop:4 }}>✓ Valid GSTIN</div>}
            </div>
            <Field label="Invoice Prefix" k="prefix" placeholder="DL"/>
            <Field label="Phone"          k="phone"  placeholder="+91 XXXXX XXXXX"/>
            <Field label="Email"          k="email"  placeholder="your@email.com" type="email"/>
            <Field label="Business Address" k="address" placeholder="Full address" span textarea/>
          </div>
        </Section>

        <Section icon={CreditCard} title="Bank Details (shown on invoices)">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Bank Name"       k="bank"    placeholder="State Bank of India"/>
            <Field label="Account Number"  k="account" placeholder="Account number"/>
            <Field label="IFSC Code"       k="ifsc"    placeholder="SBIN0001234"/>
          </div>
        </Section>

        <Section icon={Mail} title="Email Integration (EmailJS – Free)">
          <div style={{ background:'rgba(59,130,246,.07)', border:'1px solid rgba(59,130,246,.18)', borderRadius:10, padding:'12px 14px', marginBottom:16, fontSize:12, color:'#6b7490', lineHeight:1.8 }}>
            <div style={{ fontWeight:700, color:'#3b82f6', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}><Info size={13}/> Free email setup via emailjs.com (200/month free):</div>
            1. Sign up → Add Gmail service → get <strong style={{color:'#edf0f7'}}>Service ID</strong><br/>
            2. Create Template → get <strong style={{color:'#edf0f7'}}>Template ID</strong><br/>
            3. Account → get <strong style={{color:'#edf0f7'}}>Public Key</strong>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Service ID"  k="emailjsServiceId"  placeholder="service_xxxxxxx"/>
            <Field label="Template ID" k="emailjsTemplateId" placeholder="template_xxxxxxx"/>
            <Field label="Public Key"  k="emailjsPublicKey"  placeholder="Your public key" span/>
          </div>
        </Section>

        <Section icon={MessageCircle} title="WhatsApp Sharing">
          <div style={{ background:'rgba(37,211,102,.07)', border:'1px solid rgba(37,211,102,.18)', borderRadius:10, padding:'12px 14px', fontSize:12, color:'#6b7490', lineHeight:1.8 }}>
            <div style={{ fontWeight:700, color:'#25d366', marginBottom:4 }}>✓ WhatsApp sharing is ready — no setup needed!</div>
            Click the WhatsApp button on any invoice to share invoice details with your customer instantly.
          </div>
        </Section>

        <button onClick={handleSave} disabled={saving} style={{ padding:'11px 28px', borderRadius:9, border:'none', background:'#f59e0b', color:'#000', fontWeight:600, cursor:'pointer', fontSize:14, fontFamily:'inherit', boxShadow:'0 2px 14px rgba(245,158,11,.35)' }}>
          <span style={{ display:'flex', alignItems:'center', gap:8 }}><Save size={15}/> {saving?'Saving...':'Save All Settings'}</span>
        </button>
      </div>
    </div>
  );
}
