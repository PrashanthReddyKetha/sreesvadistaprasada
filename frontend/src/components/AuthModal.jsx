import React, { useState } from 'react';
import { X, Eye, EyeOff, User, Mail, Phone, Lock, CheckCircle, RefreshCw, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api';

/* ── Step indicator ───────────────────────────────────────────────────────── */
const Steps = ({ current }) => (
  <div className="flex items-center gap-1 mt-4">
    {[1, 2, 3].map((s, i) => (
      <React.Fragment key={s}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
          s < current ? 'bg-[#F4C430] text-[#800020]' :
          s === current ? 'bg-white text-[#800020]' :
          'bg-white/20 text-white/50'
        }`}>
          {s < current ? <CheckCircle size={14} /> : s}
        </div>
        {i < 2 && <div className={`flex-1 h-0.5 rounded transition-all ${s < current ? 'bg-[#F4C430]' : 'bg-white/20'}`} />}
      </React.Fragment>
    ))}
  </div>
);

const STEP_LABELS = ['', 'Your Details', 'Verify Phone', 'Done!'];

/* ── Google SVG ───────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════════ */
const AuthModal = () => {
  const { authOpen, setAuthOpen, login } = useAuth();
  const [tab, setTab]       = useState('login');  // 'login' | 'register'
  const [step, setStep]     = useState(1);        // register steps 1-3
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError]   = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Register form (step 1)
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '' });

  // OTP step
  const [otp, setOtp] = useState('');

  // Google new-user state
  const [googleData, setGoogleData] = useState(null); // { credential, google_name, google_email }
  const [googlePhone, setGooglePhone] = useState('');
  const [googleOtp, setGoogleOtp] = useState('');
  const [googleStep, setGoogleStep] = useState(null); // null | 'phone' | 'otp'

  // ── Google sign-in (must be called unconditionally before any early return) ──
  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setError(''); setLoading(true);
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(r => r.json());

        const res = await api.post('/auth/google', { credential: tokenResponse.access_token, userinfo: userInfo });

        if (res.data.needs_phone) {
          setGoogleData({ credential: tokenResponse.access_token, ...res.data });
          setGoogleStep('phone');
          setTab('register');
        } else {
          login(res.data.user, res.data.access_token);
          setAuthOpen(false);
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Google sign-in failed. Please try again.');
      } finally { setLoading(false); }
    },
    onError: () => setError('Google sign-in was cancelled or failed.'),
  });

  if (!authOpen) return null;

  const reset = () => {
    setTab('login'); setStep(1); setError(''); setOtp('');
    setOtpSent(false); setCountdown(0); setGoogleData(null);
    setGooglePhone(''); setGoogleOtp(''); setGoogleStep(null);
    setRegForm({ name: '', email: '', phone: '', password: '' });
    setLoginForm({ email: '', password: '' });
  };

  const close = () => { setAuthOpen(false); reset(); };

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const inputClass = "w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors";

  /* ── Login ───────────────────────────────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', loginForm);
      login(res.data.user, res.data.access_token);
      close();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  /* ── Register step 1 → 2: send OTP ──────────────────────────────────── */
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!regForm.phone) { setError('Please enter your phone number.'); return; }
    setError(''); setOtpLoading(true);
    try {
      await api.post(`/auth/send-otp?phone=${encodeURIComponent(regForm.phone)}`);
      setOtpSent(true);
      setStep(2);
      startCountdown();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Check your phone number.');
    } finally { setOtpLoading(false); }
  };

  /* ── Register step 2: verify OTP + create account ────────────────────── */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post(`/auth/register?otp=${otp}`, regForm);
      login(res.data.user, res.data.access_token);
      close();
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };


  const handleGoogleSendOtp = async () => {
    if (!googlePhone) { setError('Please enter your phone number.'); return; }
    setError(''); setOtpLoading(true);
    try {
      await api.post(`/auth/send-otp?phone=${encodeURIComponent(googlePhone)}`);
      setGoogleStep('otp');
      startCountdown();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP.');
    } finally { setOtpLoading(false); }
  };

  const handleGoogleComplete = async (e) => {
    e.preventDefault();
    if (googleOtp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/google/complete', {
        credential: googleData.credential,
        phone: googlePhone,
        otp: googleOtp,
      });
      login(res.data.user, res.data.access_token);
      close();
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed.');
    } finally { setLoading(false); }
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  const isRegister = tab === 'register';
  const headerTitle = isRegister
    ? (step === 1 ? 'Create Account' : step === 2 ? 'Verify Your Number' : 'Almost There!')
    : (googleStep ? 'One More Step' : 'Welcome Back');
  const headerSub = isRegister
    ? (step === 1 ? 'Join us for exclusive offers and easy reordering.' : `Enter the OTP sent to ${regForm.phone}`)
    : (googleStep === 'phone' ? `Hi ${googleData?.google_name?.split(' ')[0]}! Add your mobile to complete signup.`
      : googleStep === 'otp' ? `Enter the OTP sent to ${googlePhone}`
      : 'Sign in to track orders and manage subscriptions.');

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4" onClick={close}>
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #800020 0%, #5C0018 100%)' }}>
          <button onClick={close} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            {headerTitle}
          </h2>
          <p className="text-sm text-white/70">{headerSub}</p>

          {/* Tabs — hidden when Google phone step is active */}
          {!googleStep && (
            <div className="flex gap-1 mt-5 bg-white/10 rounded-lg p-1">
              {['login', 'register'].map(t => (
                <button key={t} onClick={() => { setTab(t); setStep(1); setError(''); setOtpSent(false); }}
                  className="flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200"
                  style={{ backgroundColor: tab === t ? 'white' : 'transparent', color: tab === t ? '#800020' : 'rgba(255,255,255,0.8)' }}>
                  {t === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>
          )}

          {/* Step indicator for registration */}
          {isRegister && !googleStep && <Steps current={step} />}
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>
              {error}
            </div>
          )}

          {/* ── LOGIN ──────────────────────────────────────────────────── */}
          {tab === 'login' && !googleStep && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" required placeholder="Email address" value={loginForm.email}
                  onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                  className={inputClass} />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} required placeholder="Password" value={loginForm.password}
                  onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                  className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md disabled:opacity-60"
                style={{ backgroundColor: '#800020' }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <Divider />
              <GoogleButton onClick={() => googleLogin()} loading={loading} label="Continue with Google" />
            </form>
          )}

          {/* ── REGISTER STEP 1: details ────────────────────────────── */}
          {isRegister && step === 1 && !googleStep && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" required placeholder="Full name" value={regForm.name}
                  onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))}
                  className={inputClass} />
              </div>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" required placeholder="Email address" value={regForm.email}
                  onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))}
                  className={inputClass} />
              </div>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" required placeholder="Mobile number (+44...)" value={regForm.phone}
                  onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))}
                  className={inputClass} />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} required minLength={8} placeholder="Password (min 8 characters)" value={regForm.password}
                  onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                  className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button type="submit" disabled={otpLoading}
                className="w-full py-3 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md disabled:opacity-60"
                style={{ backgroundColor: '#800020' }}>
                {otpLoading ? <span className="flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" /> Sending OTP…</span> : 'Send Verification Code'}
              </button>

              <Divider />
              <GoogleButton onClick={() => googleLogin()} loading={loading} label="Register with Google" />
            </form>
          )}

          {/* ── REGISTER STEP 2: OTP ────────────────────────────────── */}
          {isRegister && step === 2 && !googleStep && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(128,0,32,0.05)' }}>
                <Shield size={28} className="mx-auto mb-2" style={{ color: '#800020' }} />
                <p className="text-sm font-medium text-gray-700">
                  A 6-digit code was sent to <strong>{regForm.phone}</strong>
                </p>
              </div>

              {/* OTP boxes */}
              <OtpInput value={otp} onChange={setOtp} />

              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full py-3 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md disabled:opacity-60"
                style={{ backgroundColor: '#800020' }}>
                {loading ? <span className="flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" /> Creating account…</span> : 'Verify & Create Account'}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-gray-400">Resend OTP in {countdown}s</p>
                ) : (
                  <button type="button" onClick={handleSendOtp} disabled={otpLoading}
                    className="text-xs font-semibold hover:underline" style={{ color: '#800020' }}>
                    {otpLoading ? 'Sending…' : 'Resend OTP'}
                  </button>
                )}
              </div>

              <button type="button" onClick={() => { setStep(1); setOtp(''); setError(''); }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 text-center">
                ← Change details
              </button>
            </form>
          )}

          {/* ── GOOGLE: collect phone ───────────────────────────────── */}
          {googleStep === 'phone' && (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(128,0,32,0.05)' }}>
                <p className="text-sm text-gray-600">Signed in as <strong>{googleData?.google_email}</strong></p>
              </div>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" placeholder="Mobile number (+44...)" value={googlePhone}
                  onChange={e => setGooglePhone(e.target.value)}
                  className={inputClass} />
              </div>
              <button onClick={handleGoogleSendOtp} disabled={otpLoading || !googlePhone}
                className="w-full py-3 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md disabled:opacity-60"
                style={{ backgroundColor: '#800020' }}>
                {otpLoading ? <span className="flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" /> Sending…</span> : 'Send Verification Code'}
              </button>
            </div>
          )}

          {/* ── GOOGLE: verify OTP ──────────────────────────────────── */}
          {googleStep === 'otp' && (
            <form onSubmit={handleGoogleComplete} className="space-y-4">
              <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(128,0,32,0.05)' }}>
                <Shield size={28} className="mx-auto mb-2" style={{ color: '#800020' }} />
                <p className="text-sm font-medium text-gray-700">
                  Code sent to <strong>{googlePhone}</strong>
                </p>
              </div>

              <OtpInput value={googleOtp} onChange={setGoogleOtp} />

              <button type="submit" disabled={loading || googleOtp.length !== 6}
                className="w-full py-3 text-sm font-semibold text-white rounded-lg transition-all hover:shadow-md disabled:opacity-60"
                style={{ backgroundColor: '#800020' }}>
                {loading ? <span className="flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" /> Creating account…</span> : 'Verify & Complete Signup'}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-gray-400">Resend in {countdown}s</p>
                ) : (
                  <button type="button" onClick={handleGoogleSendOtp} disabled={otpLoading}
                    className="text-xs font-semibold hover:underline" style={{ color: '#800020' }}>
                    {otpLoading ? 'Sending…' : 'Resend OTP'}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Switch tab link */}
          {!googleStep && (
            <p className="text-center text-xs text-gray-400 mt-4">
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setStep(1); setError(''); setOtpSent(false); }}
                className="font-semibold hover:underline" style={{ color: '#800020' }}>
                {tab === 'login' ? 'Register here' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400">or</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function GoogleButton({ onClick, loading, label }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="w-full py-3 text-sm font-semibold rounded-lg border-2 border-gray-200 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-60">
      <GoogleIcon />
      {label}
    </button>
  );
}

function OtpInput({ value, onChange }) {
  const digits = Array(6).fill('');
  const refs = Array(6).fill(null).map(() => React.createRef());

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) refs[i - 1].current?.focus();
  };

  const handleChange = (i, v) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const arr = (value + '      ').slice(0, 6).split('');
    arr[i] = d;
    onChange(arr.join('').trimEnd());
    if (d && i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); refs[Math.min(pasted.length, 5)].current?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-lg font-bold rounded-lg border-2 outline-none transition-all focus:border-[#800020]"
          style={{ borderColor: value[i] ? '#800020' : '#E5E7EB', color: '#800020' }}
        />
      ))}
    </div>
  );
}

export default AuthModal;
