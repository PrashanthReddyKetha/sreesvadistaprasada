import React, { useState, useEffect, useRef } from 'react';
import {
  X, Eye, EyeOff, User, Mail, Phone, Lock,
  CheckCircle, RefreshCw, Shield, AlertCircle, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api';

/* ── Google SVG ─────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="flex-shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/* ── Step dots ───────────────────────────────────────────────────────────── */
const Steps = ({ current }) => (
  <div className="flex items-center gap-1 mt-4">
    {[1, 2].map((s, i) => (
      <React.Fragment key={s}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
          s < current  ? 'bg-[#F4C430] text-[#800020]' :
          s === current ? 'bg-white text-[#800020]' :
                          'bg-white/20 text-white/50'
        }`}>
          {s < current ? <CheckCircle size={14} /> : s}
        </div>
        {i < 1 && <div className={`flex-1 h-0.5 rounded transition-all ${s < current ? 'bg-[#F4C430]' : 'bg-white/20'}`} />}
      </React.Fragment>
    ))}
  </div>
);

/* ── Password strength ───────────────────────────────────────────────────── */
function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak',   color: '#EF4444', pct: 25  };
  if (score <= 2) return { label: 'Fair',   color: '#F59E0B', pct: 50  };
  if (score <= 3) return { label: 'Good',   color: '#3B82F6', pct: 75  };
  return               { label: 'Strong', color: '#22C55E', pct: 100 };
}

/* ── OTP boxes ───────────────────────────────────────────────────────────── */
function OtpInput({ value, onChange }) {
  const refs = Array(6).fill(null).map(() => useRef(null)); // eslint-disable-line react-hooks/rules-of-hooks

  const handleChange = (i, v) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const arr = (value.padEnd(6)).split('');
    arr[i] = d;
    onChange(arr.join('').trimEnd());
    if (d && i < 5) refs[i + 1].current?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) refs[i - 1].current?.focus();
  };

  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p) { onChange(p); refs[Math.min(p.length, 5)].current?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array(6).fill(0).map((_, i) => (
        <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all focus:scale-105"
          style={{ borderColor: value[i] ? '#800020' : '#E5E7EB', color: '#800020',
                   backgroundColor: value[i] ? 'rgba(128,0,32,0.04)' : 'white' }}
        />
      ))}
    </div>
  );
}

/* ── Input field ─────────────────────────────────────────────────────────── */
function Field({ label, icon: Icon, type = 'text', name, autoComplete, placeholder,
                 value, onChange, onBlur, error, success, hint, suffix, required }) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1.5" style={{ color: '#5C4B47' }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: error ? '#EF4444' : success ? '#22C55E' : '#9CA3AF' }} />}
        <input
          type={type} name={name} autoComplete={autoComplete}
          placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-full py-2.5 rounded-xl border-2 text-sm focus:outline-none transition-all"
          style={{
            paddingLeft: Icon ? '2.25rem' : '0.75rem',
            paddingRight: suffix ? '2.5rem' : '0.75rem',
            borderColor: error ? '#FCA5A5' : success ? 'rgba(34,197,94,0.4)' : value ? 'rgba(128,0,32,0.3)' : '#E5E7EB',
            backgroundColor: error ? '#FFF5F5' : success ? '#F0FFF4' : 'white',
            color: '#2D2422',
          }}
        />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
        {!suffix && success && <CheckCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#22C55E' }} />}
        {!suffix && error && <AlertCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#EF4444' }} />}
      </div>
      {error && <p className="text-xs mt-1 flex items-start gap-1" style={{ color: '#EF4444' }}>{error}</p>}
      {!error && hint && <p className="text-xs mt-1" style={{ color: '#9C7B6B' }}>{hint}</p>}
      {!error && !hint && success && typeof success === 'string' && (
        <p className="text-xs mt-1" style={{ color: '#22C55E' }}>{success}</p>
      )}
    </div>
  );
}

/* ── Google button ───────────────────────────────────────────────────────── */
function GoogleBtn({ onClick, loading, label }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="w-full py-3 text-sm font-semibold rounded-xl border-2 flex items-center justify-center gap-2.5 transition-all hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50"
      style={{ borderColor: '#E5E7EB', color: '#374151' }}>
      <GoogleIcon />{label}
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 font-medium">or</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
const AuthModal = () => {
  const { authOpen, setAuthOpen, login } = useAuth();

  const [tab, setTab]     = useState('login');
  const [step, setStep]   = useState(1);
  const [loading, setLoading]       = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown]   = useState(0);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw]       = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register step 1
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pw, setPw]       = useState('');
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms]   = useState(false);
  const [otp, setOtp]       = useState('');
  const [regError, setRegError] = useState('');

  // Field-level validation
  const [emailStatus, setEmailStatus] = useState(null); // null | 'checking' | 'taken' | 'taken_google' | 'free'
  const [phoneStatus, setPhoneStatus] = useState(null); // null | 'taken' | 'free'
  const [nameError, setNameError]   = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [pwError, setPwError]       = useState('');

  // Google new-user flow
  const [googleCred, setGoogleCred]   = useState(null);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName]   = useState('');
  const [googlePhone, setGooglePhone] = useState('');
  const [googleOtp, setGoogleOtp]     = useState('');
  const [googleStep, setGoogleStep]   = useState(null); // null | 'phone' | 'otp'
  const [googleError, setGoogleError] = useState('');

  /* ── Google hook (must be unconditional) ─────────────────────────────── */
  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setLoading(true); setLoginError(''); setRegError('');
      try {
        const res = await api.post('/auth/google', { credential: tokenResponse.access_token });
        if (res.data.needs_phone) {
          setGoogleCred(tokenResponse.access_token);
          setGoogleEmail(res.data.google_email || '');
          setGoogleName(res.data.google_name || '');
          setGoogleStep('phone');
        } else {
          login(res.data.user, res.data.access_token);
          setAuthOpen(false);
        }
      } catch (e) {
        const msg = e.response?.data?.detail || 'Google sign-in failed.';
        setLoginError(msg); setRegError(msg);
      } finally { setLoading(false); }
    },
    onError: () => { setLoginError('Google sign-in was cancelled.'); setRegError('Google sign-in was cancelled.'); },
  });

  if (!authOpen) return null;

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  const reset = () => {
    setTab('login'); setStep(1); setLoading(false); setOtpLoading(false); setCountdown(0);
    setLoginEmail(''); setLoginPw(''); setLoginError('');
    setName(''); setEmail(''); setPhone(''); setPw(''); setTerms(false); setOtp(''); setRegError('');
    setEmailStatus(null); setPhoneStatus(null); setNameError(''); setPhoneError(''); setPwError('');
    setGoogleCred(null); setGoogleEmail(''); setGoogleName(''); setGooglePhone('');
    setGoogleOtp(''); setGoogleStep(null); setGoogleError('');
  };

  const close = () => { setAuthOpen(false); reset(); };

  const startCountdown = (secs = 60) => {
    setCountdown(secs);
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  /* ── Field validators ────────────────────────────────────────────────── */
  const checkEmail = async (val) => {
    const v = val.trim().toLowerCase();
    if (!v || !/\S+@\S+\.\S+/.test(v)) return;
    setEmailStatus('checking');
    try {
      const r = await api.get(`/auth/check-email?email=${encodeURIComponent(v)}`);
      if (r.data.exists) {
        setEmailStatus(r.data.has_google && !r.data.has_password ? 'taken_google' : 'taken');
      } else {
        setEmailStatus('free');
      }
    } catch { setEmailStatus(null); }
  };

  const checkPhone = async (val) => {
    const v = val.trim();
    if (!v || v.length < 10) return;
    try {
      const r = await api.get(`/auth/check-phone?phone=${encodeURIComponent(v)}`);
      setPhoneStatus(r.data.exists ? 'taken' : 'free');
    } catch { setPhoneStatus(null); }
  };

  const validateStep1 = () => {
    let ok = true;
    if (!name.trim() || name.trim().split(' ').length < 2) {
      setNameError('Please enter your full name (first and last).'); ok = false;
    } else setNameError('');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      ok = false;
    }
    if (emailStatus === 'taken' || emailStatus === 'taken_google') { ok = false; }
    if (!phone.trim() || phone.trim().length < 10) {
      setPhoneError('Please enter a valid phone number.'); ok = false;
    } else setPhoneError('');
    if (phoneStatus === 'taken') { ok = false; }
    if (pw.length < 8) { setPwError('Password must be at least 8 characters.'); ok = false; }
    else setPwError('');
    if (!terms) { ok = false; }
    return ok;
  };

  /* ── Handlers ────────────────────────────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPw });
      login(res.data.user, res.data.access_token);
      close();
    } catch (err) {
      setLoginError(err.response?.data?.detail || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!validateStep1()) return;
    setRegError(''); setOtpLoading(true);
    try {
      await api.post(`/auth/send-otp?phone=${encodeURIComponent(phone.trim())}`);
      setStep(2);
      startCountdown();
    } catch (err) {
      setRegError(err.response?.data?.detail || 'Failed to send OTP. Please check your number.');
    } finally { setOtpLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setRegError('Please enter the full 6-digit code.'); return; }
    setRegError(''); setLoading(true);
    try {
      const res = await api.post(`/auth/register?otp=${otp}`, {
        name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password: pw,
      });
      login(res.data.user, res.data.access_token);
      close();
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.toLowerCase().includes('email already')) {
        setRegError(''); setStep(1); setEmailStatus('taken');
      } else {
        setRegError(detail || 'Registration failed. Please try again.');
      }
    } finally { setLoading(false); }
  };

  const handleGoogleSendOtp = async () => {
    if (!googlePhone.trim() || googlePhone.trim().length < 10) {
      setGoogleError('Please enter a valid phone number.'); return;
    }
    setGoogleError(''); setOtpLoading(true);
    try {
      await api.post(`/auth/send-otp?phone=${encodeURIComponent(googlePhone.trim())}`);
      setGoogleStep('otp');
      startCountdown();
    } catch (err) {
      setGoogleError(err.response?.data?.detail || 'Failed to send OTP.');
    } finally { setOtpLoading(false); }
  };

  const handleGoogleComplete = async (e) => {
    e.preventDefault();
    if (googleOtp.length !== 6) { setGoogleError('Please enter the full 6-digit code.'); return; }
    setGoogleError(''); setLoading(true);
    try {
      const res = await api.post('/auth/google/complete', {
        credential: googleCred, phone: googlePhone.trim(), otp: googleOtp,
      });
      login(res.data.user, res.data.access_token);
      close();
    } catch (err) {
      setGoogleError(err.response?.data?.detail || 'Verification failed. Please try again.');
    } finally { setLoading(false); }
  };

  const pwStrength = pw ? passwordStrength(pw) : null;

  /* ── Email status helpers ────────────────────────────────────────────── */
  const emailError = emailStatus === 'taken'
    ? 'This email is already registered.'
    : emailStatus === 'taken_google'
    ? 'This email is linked to a Google account.'
    : '';
  const emailSuccess = emailStatus === 'free' ? 'Email is available' : '';
  const emailHint = emailStatus === 'checking' ? 'Checking availability…' : '';

  /* ── Header config ───────────────────────────────────────────────────── */
  const isRegister = tab === 'register';
  const title = googleStep
    ? (googleStep === 'phone' ? `Hi, ${googleName.split(' ')[0]}!` : 'Verify your number')
    : isRegister
      ? (step === 1 ? 'Create Account' : 'Verify Your Number')
      : 'Welcome Back';
  const subtitle = googleStep
    ? (googleStep === 'phone' ? 'Add your mobile to complete your account.' : `Enter the code sent to ${googlePhone}`)
    : isRegister
      ? (step === 1 ? 'Join thousands of happy customers.' : `We sent a 6-digit code to ${phone}`)
      : 'Sign in to track orders and manage subscriptions.';

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4" onClick={close}>
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-7 pt-7 pb-5 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #800020 0%, #5C0018 100%)' }}>
          <button onClick={close} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
            style={{ color: 'rgba(255,255,255,0.8)' }}>
            <X size={18} />
          </button>
          <h2 className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
          </h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{subtitle}</p>

          {!googleStep && (
            <div className="flex gap-1 mt-4 bg-white/10 rounded-xl p-1">
              {[['login','Sign In'],['register','Register']].map(([t,l]) => (
                <button key={t} onClick={() => { setTab(t); setStep(1); setLoginError(''); setRegError(''); setEmailStatus(null); }}
                  className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                  style={{ backgroundColor: tab===t?'white':'transparent', color: tab===t?'#800020':'rgba(255,255,255,0.85)' }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {isRegister && !googleStep && <Steps current={step} />}
        </div>

        {/* Body */}
        <div className="px-7 py-5 overflow-y-auto flex-1">

          {/* ── LOGIN ─────────────────────────────────────────────── */}
          {tab === 'login' && !googleStep && (
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
              {loginError && (
                <div className="p-3 rounded-xl text-sm flex items-start gap-2" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{loginError}
                    {loginError.includes('Google') && (
                      <button type="button" onClick={() => googleLogin()}
                        className="ml-1 font-bold underline">Sign in with Google</button>
                    )}
                    {(loginError.includes('Invalid') || loginError.includes('password')) && (
                      <button type="button" onClick={() => { setTab('register'); setEmail(loginEmail); setLoginError(''); }}
                        className="block mt-1 font-bold underline text-xs" style={{ color: '#800020' }}>
                        Create an account instead →
                      </button>
                    )}
                  </span>
                </div>
              )}

              <Field label="Email address" icon={Mail} type="email" name="email"
                autoComplete="email" placeholder="you@example.com"
                value={loginEmail} onChange={setLoginEmail} required />

              <Field label="Password" icon={Lock}
                type={showLoginPw ? 'text' : 'password'} name="password"
                autoComplete="current-password" placeholder="Your password"
                value={loginPw} onChange={setLoginPw} required
                suffix={
                  <button type="button" onClick={() => setShowLoginPw(v => !v)} className="text-gray-400 hover:text-gray-600">
                    {showLoginPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              <button type="submit" disabled={loading}
                className="w-full py-3.5 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-60"
                style={{ backgroundColor: '#800020' }}>
                {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in…</> : 'Sign In'}
              </button>

              <Divider />
              <GoogleBtn onClick={() => googleLogin()} loading={loading} label="Continue with Google" />

              <p className="text-center text-xs text-gray-400 pt-1">
                Don't have an account?{' '}
                <button type="button" onClick={() => { setTab('register'); setLoginError(''); }}
                  className="font-semibold hover:underline" style={{ color: '#800020' }}>Register here</button>
              </p>
            </form>
          )}

          {/* ── REGISTER STEP 1 ───────────────────────────────────── */}
          {isRegister && step === 1 && !googleStep && (
            <form onSubmit={handleSendOtp} className="space-y-3.5" autoComplete="on" noValidate>
              {regError && (
                <div className="p-3 rounded-xl text-sm flex items-start gap-2" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{regError}
                </div>
              )}

              {/* Full name */}
              <Field label="Full Name" icon={User} name="fullname" autoComplete="name"
                placeholder="First and last name"
                value={name} onChange={v => { setName(v); setNameError(''); }}
                error={nameError} required
                hint="We use this for your orders and receipts"
              />

              {/* Email with live check */}
              <div>
                <Field label="Email address" icon={Mail} type="email" name="email" autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={v => { setEmail(v); setEmailStatus(null); }}
                  onBlur={() => checkEmail(email)}
                  error={emailError} success={emailSuccess} hint={emailHint} required
                />
                {emailStatus === 'taken' && (
                  <button type="button" onClick={() => { setTab('login'); setLoginEmail(email); }}
                    className="text-xs font-semibold mt-1 hover:underline" style={{ color: '#800020' }}>
                    Sign in to this account →
                  </button>
                )}
                {emailStatus === 'taken_google' && (
                  <button type="button" onClick={() => googleLogin()}
                    className="text-xs font-semibold mt-1 hover:underline flex items-center gap-1" style={{ color: '#800020' }}>
                    <GoogleIcon /> Continue with Google instead →
                  </button>
                )}
              </div>

              {/* Phone with live check */}
              <div>
                <Field label="Mobile Number" icon={Phone} type="tel" name="phone" autoComplete="tel"
                  placeholder="+44 7700 900000"
                  value={phone}
                  onChange={v => { setPhone(v); setPhoneStatus(null); setPhoneError(''); }}
                  onBlur={() => checkPhone(phone)}
                  error={phoneError || (phoneStatus === 'taken' ? 'This number is already linked to an account.' : '')}
                  success={phoneStatus === 'free' ? 'Number is available' : ''} required
                  hint="Used to send your order OTP verification"
                />
              </div>

              {/* Password with strength */}
              <div>
                <Field label="Password" icon={Lock}
                  type={showPw ? 'text' : 'password'} name="new-password" autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={pw} onChange={v => { setPw(v); setPwError(''); }}
                  error={pwError} required
                  suffix={
                    <button type="button" onClick={() => setShowPw(v => !v)} className="text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                {pw && pwStrength && (
                  <div className="mt-1.5">
                    <div className="h-1 rounded-full overflow-hidden bg-gray-200">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pwStrength.pct}%`, backgroundColor: pwStrength.color }} />
                    </div>
                    <p className="text-[10px] mt-0.5 font-medium" style={{ color: pwStrength.color }}>
                      {pwStrength.label} password
                      {pwStrength.label !== 'Strong' && ' — try adding numbers or symbols'}
                    </p>
                  </div>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  terms ? 'border-[#800020] bg-[#800020]' : 'border-gray-300'
                }`} onClick={() => setTerms(v => !v)}>
                  {terms && <CheckCircle size={12} className="text-white" />}
                </div>
                <span className="text-xs text-gray-500 leading-relaxed">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="font-semibold hover:underline" style={{ color: '#800020' }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="font-semibold hover:underline" style={{ color: '#800020' }}>Privacy Policy</a>.
                  Your data is never sold or shared.
                </span>
              </label>

              <button type="submit" disabled={otpLoading || emailStatus === 'taken' || emailStatus === 'taken_google' || phoneStatus === 'taken' || !terms}
                className="w-full py-3.5 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: '#800020' }}>
                {otpLoading
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending code…</>
                  : 'Send Verification Code →'
                }
              </button>

              <Divider />
              <GoogleBtn onClick={() => googleLogin()} loading={loading} label="Register with Google" />

              <p className="text-center text-xs text-gray-400 pt-1">
                Already have an account?{' '}
                <button type="button" onClick={() => { setTab('login'); setRegError(''); }}
                  className="font-semibold hover:underline" style={{ color: '#800020' }}>Sign in</button>
              </p>
            </form>
          )}

          {/* ── REGISTER STEP 2: OTP ──────────────────────────────── */}
          {isRegister && step === 2 && !googleStep && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="text-center py-4 px-3 rounded-2xl" style={{ backgroundColor: 'rgba(128,0,32,0.05)' }}>
                <Shield size={32} className="mx-auto mb-2" style={{ color: '#800020' }} />
                <p className="text-sm font-semibold" style={{ color: '#2D2422' }}>Check your messages</p>
                <p className="text-xs text-gray-500 mt-1">6-digit code sent to <strong>{phone}</strong></p>
              </div>

              <OtpInput value={otp} onChange={setOtp} />

              {regError && (
                <div className="p-3 rounded-xl text-sm flex items-start gap-2" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{regError}
                </div>
              )}

              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full py-3.5 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: '#800020' }}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating account…</>
                  : 'Verify & Create Account'
                }
              </button>

              <div className="text-center space-y-2">
                {countdown > 0
                  ? <p className="text-xs text-gray-400">Resend code in <strong>{countdown}s</strong></p>
                  : <button type="button" onClick={handleSendOtp} disabled={otpLoading}
                      className="text-xs font-semibold hover:underline" style={{ color: '#800020' }}>
                      {otpLoading ? 'Sending…' : 'Resend code'}
                    </button>
                }
                <button type="button" onClick={() => { setStep(1); setOtp(''); setRegError(''); }}
                  className="block w-full text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  ← Change my details
                </button>
              </div>
            </form>
          )}

          {/* ── GOOGLE: add phone ─────────────────────────────────── */}
          {googleStep === 'phone' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl text-xs flex items-center gap-2" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                <Info size={14} className="flex-shrink-0" />
                Signed in as <strong>{googleEmail}</strong>
              </div>

              {googleError && (
                <div className="p-3 rounded-xl text-sm flex items-start gap-2" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{googleError}
                </div>
              )}

              <Field label="Mobile Number" icon={Phone} type="tel" name="phone" autoComplete="tel"
                placeholder="+44 7700 900000"
                value={googlePhone} onChange={setGooglePhone} required
                hint="We'll send a one-time code to verify your number"
              />

              <button onClick={handleGoogleSendOtp} disabled={otpLoading || !googlePhone.trim()}
                className="w-full py-3.5 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: '#800020' }}>
                {otpLoading
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
                  : 'Send Verification Code →'
                }
              </button>
            </div>
          )}

          {/* ── GOOGLE: verify OTP ───────────────────────────────── */}
          {googleStep === 'otp' && (
            <form onSubmit={handleGoogleComplete} className="space-y-5">
              <div className="text-center py-4 px-3 rounded-2xl" style={{ backgroundColor: 'rgba(128,0,32,0.05)' }}>
                <Shield size={32} className="mx-auto mb-2" style={{ color: '#800020' }} />
                <p className="text-sm font-semibold" style={{ color: '#2D2422' }}>Verify your number</p>
                <p className="text-xs text-gray-500 mt-1">6-digit code sent to <strong>{googlePhone}</strong></p>
              </div>

              <OtpInput value={googleOtp} onChange={setGoogleOtp} />

              {googleError && (
                <div className="p-3 rounded-xl text-sm flex items-start gap-2" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{googleError}
                </div>
              )}

              <button type="submit" disabled={loading || googleOtp.length !== 6}
                className="w-full py-3.5 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: '#800020' }}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating account…</>
                  : 'Verify & Complete Signup'
                }
              </button>

              <div className="text-center">
                {countdown > 0
                  ? <p className="text-xs text-gray-400">Resend in <strong>{countdown}s</strong></p>
                  : <button type="button" onClick={handleGoogleSendOtp} disabled={otpLoading}
                      className="text-xs font-semibold hover:underline" style={{ color: '#800020' }}>
                      {otpLoading ? 'Sending…' : 'Resend code'}
                    </button>
                }
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthModal;
