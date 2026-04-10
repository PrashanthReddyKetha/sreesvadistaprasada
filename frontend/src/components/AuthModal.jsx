import React, { useState } from 'react';
import { X, Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const AuthModal = () => {
  const { authOpen, setAuthOpen, login } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '' });

  if (!authOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', loginForm);
      login(res.data.user, res.data.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/register', regForm);
      login(res.data.user, res.data.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors";

  return (
    <>
      <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4" onClick={() => setAuthOpen(false)}>
        <div
          className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #800020 0%, #5C0018 100%)' }}>
            <button onClick={() => setAuthOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {tab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-white/70">
              {tab === 'login' ? 'Sign in to track orders and manage subscriptions.' : 'Join us for exclusive offers and easy reordering.'}
            </p>
            {/* Tabs */}
            <div className="flex gap-1 mt-5 bg-white/10 rounded-lg p-1">
              {['login', 'register'].map(t => (
                <button key={t} onClick={() => { setTab(t); setError(''); }}
                  className="flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200"
                  style={{ backgroundColor: tab === t ? 'white' : 'transparent', color: tab === t ? '#800020' : 'rgba(255,255,255,0.8)' }}>
                  {t === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>
                {error}
              </div>
            )}

            {tab === 'login' ? (
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
                  className="w-full py-3 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-60"
                  style={{ backgroundColor: '#800020' }}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
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
                  <input type="tel" required placeholder="Phone number (+44...)" value={regForm.phone}
                    onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))}
                    className={inputClass} />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPw ? 'text' : 'password'} required placeholder="Password (min 8 characters)" value={regForm.password}
                    onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                    className={`${inputClass} pr-10`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-60"
                  style={{ backgroundColor: '#800020' }}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}

            <p className="text-center text-xs text-gray-400 mt-4">
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
                className="font-semibold hover:underline" style={{ color: '#800020' }}>
                {tab === 'login' ? 'Register here' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;
