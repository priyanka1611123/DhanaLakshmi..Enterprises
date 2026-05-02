import React, { useState } from 'react';
import { loginUser, signupUser, resetPassword } from '../supabase/services';
import { Building2, Lock, Mail, Eye, EyeOff, UserPlus, LogIn, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// ── which screen to show
// 'login' | 'signup' | 'forgot' | 'check-email'
export default function Login() {
  const [screen, setScreen] = useState('login');

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)', padding: 20,
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(245,158,11,.07) 0%, transparent 70%)'
      }} />

      <div style={{
        background: 'var(--card)', border: '1px solid var(--border2)',
        borderRadius: 22, padding: '40px 38px', width: '100%', maxWidth: 420,
        boxShadow: '0 32px 80px rgba(0,0,0,.55)', position: 'relative', zIndex: 1
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, margin: '0 auto 14px',
            background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Building2 size={30} color="var(--accent)" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent)', letterSpacing: .3 }}>
            DL Enterprises
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
            Invoice Management System
          </div>
        </div>

        {/* Tab switcher (only login/signup) */}
        {(screen === 'login' || screen === 'signup') && (
          <div style={{
            display: 'flex', background: 'var(--card2)', borderRadius: 11,
            padding: 4, marginBottom: 24, border: '1px solid var(--border)'
          }}>
            {[
              { id: 'login',  icon: LogIn,     label: 'Sign In' },
              { id: 'signup', icon: UserPlus,  label: 'Sign Up' },
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setScreen(id)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 7, padding: '9px 0', border: 'none', borderRadius: 8,
                cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                transition: 'all .18s',
                background: screen === id ? 'var(--accent)' : 'transparent',
                color:      screen === id ? '#000' : 'var(--muted)',
              }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        )}

        {/* Screens */}
        {screen === 'login'       && <SignInForm   onForgot={() => setScreen('forgot')} />}
        {screen === 'signup'      && <SignUpForm    onDone={() => setScreen('check-email')} />}
        {screen === 'forgot'      && <ForgotForm   onBack={() => setScreen('login')} onDone={() => setScreen('check-email')} />}
        {screen === 'check-email' && <CheckEmail   onBack={() => setScreen('login')} />}
      </div>
    </div>
  );
}

// ── SIGN IN ───────────────────────────────────────────────────
function SignInForm({ onForgot }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields');
    setLoading(true);
    const { error } = await loginUser(email, password);
    if (error) {
      const msgs = {
        'Invalid login credentials': 'Wrong email or password. Try again.',
        'Email not confirmed':        'Please check your email and confirm your account first.',
        'Too many requests':          'Too many attempts. Please wait a moment.',
      };
      toast.error(msgs[error.message] || error.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handle}>
      <Field label="Email Address" icon={<Mail size={14} />}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" style={{ paddingLeft: 36 }} autoComplete="email" />
      </Field>

      <Field label="Password" icon={<Lock size={14} />}>
        <input type={show ? 'text' : 'password'} value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Your password" style={{ paddingLeft: 36, paddingRight: 42 }}
          autoComplete="current-password" />
        <ToggleEye show={show} onClick={() => setShow(s => !s)} />
      </Field>

      <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 18 }}>
        <button type="button" onClick={onForgot} style={{
          background: 'none', border: 'none', color: 'var(--accent)',
          fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500
        }}>
          Forgot password?
        </button>
      </div>

      <button className="btn btn-primary w-full" style={{ padding: '12px', fontSize: 14 }} disabled={loading}>
        <LogIn size={14} /> {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

// ── SIGN UP ───────────────────────────────────────────────────
function SignUpForm({ onDone }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirm) return toast.error('Please fill all fields');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');

    setLoading(true);
    const { error } = await signupUser(email, password);
    if (error) {
      const msgs = {
        'User already registered': 'An account with this email already exists. Try signing in.',
        'Password should be at least 6 characters': 'Password must be at least 6 characters.',
      };
      toast.error(msgs[error.message] || error.message);
    } else {
      onDone();
    }
    setLoading(false);
  };

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'var(--red)', 'var(--accent)', 'var(--blue)', 'var(--green)'];

  return (
    <form onSubmit={handle}>
      <Field label="Email Address" icon={<Mail size={14} />}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" style={{ paddingLeft: 36 }} autoComplete="email" />
      </Field>

      <Field label="Password" icon={<Lock size={14} />}>
        <input type={show ? 'text' : 'password'} value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min. 6 characters" style={{ paddingLeft: 36, paddingRight: 42 }}
          autoComplete="new-password" />
        <ToggleEye show={show} onClick={() => setShow(s => !s)} />
      </Field>

      {/* Password strength bar */}
      {password.length > 0 && (
        <div style={{ marginTop: -10, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 3,
                background: i <= strength ? strengthColor[strength] : 'var(--border)',
                transition: 'background .2s'
              }} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: strengthColor[strength], fontWeight: 600 }}>
            {strengthLabel[strength]}
          </div>
        </div>
      )}

      <Field label="Confirm Password" icon={<Lock size={14} />}>
        <input type={show ? 'text' : 'password'} value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Repeat password" style={{ paddingLeft: 36 }}
          autoComplete="new-password" />
        {confirm && (
          <div style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: confirm === password ? 'var(--green)' : 'var(--red)', fontSize: 12
          }}>
            {confirm === password ? '✓' : '✗'}
          </div>
        )}
      </Field>

      <button className="btn btn-primary w-full" style={{ padding: '12px', fontSize: 14 }} disabled={loading}>
        <UserPlus size={14} /> {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <div style={{ marginTop: 14, padding: '10px 13px', background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 9, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.7 }}>
        After signing up, check your email to <strong style={{ color: 'var(--accent)' }}>confirm your account</strong>, then come back and sign in.
      </div>
    </form>
  );
}

// ── FORGOT PASSWORD ───────────────────────────────────────────
function ForgotForm({ onBack, onDone }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email address');
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      toast.error(error.message);
    } else {
      onDone();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handle}>
      <button type="button" onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', color: 'var(--muted)',
        fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        marginBottom: 20, padding: 0
      }}>
        <ArrowLeft size={13} /> Back to Sign In
      </button>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 5 }}>
          Reset Password
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Enter your email and we'll send you a link to reset your password.
        </div>
      </div>

      <Field label="Email Address" icon={<Mail size={14} />}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" style={{ paddingLeft: 36 }} autoComplete="email" />
      </Field>

      <button className="btn btn-primary w-full" style={{ padding: '12px', fontSize: 14 }} disabled={loading}>
        <KeyRound size={14} /> {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
}

// ── CHECK EMAIL ───────────────────────────────────────────────
function CheckEmail({ onBack }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 0' }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%', margin: '0 auto 18px',
        background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <CheckCircle size={28} color="var(--green)" />
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
        Check Your Email!
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 24 }}>
        We sent you an email. Click the link in it to confirm your account or reset your password.
        <br /><br />
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Don't see it?</span> Check your spam/junk folder.
      </div>
      <button className="btn btn-ghost w-full" onClick={onBack}>
        <ArrowLeft size={13} /> Back to Sign In
      </button>
    </div>
  );
}

// ── SHARED HELPERS ────────────────────────────────────────────
function Field({ label, icon, children }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

function ToggleEye({ show, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 3
    }}>
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );
}
