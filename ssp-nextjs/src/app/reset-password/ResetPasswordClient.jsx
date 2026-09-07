'use client';
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (pw.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (pw !== confirmPw) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: pw });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {!token ? (
          <div className="text-center space-y-3">
            <AlertCircle size={32} className="mx-auto" style={{ color: '#800020' }} />
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Invalid reset link</h1>
            <p className="text-sm text-gray-500">This link is missing its token. Please request a new password reset link.</p>
            <Link href="/" className="inline-block mt-2 text-sm font-semibold hover:underline" style={{ color: '#800020' }}>Back to home</Link>
          </div>
        ) : done ? (
          <div className="text-center space-y-3">
            <CheckCircle size={32} className="mx-auto" style={{ color: '#166534' }} />
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Password updated</h1>
            <p className="text-sm text-gray-500">You can now sign in with your new password.</p>
            <Link href="/" className="inline-block mt-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl" style={{ backgroundColor: '#800020' }}>
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Reset your password</h1>
            <p className="text-sm text-gray-500 mb-6">Choose a new password for your account.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl text-sm flex items-start gap-2" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#8B6914' }}>New password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm focus:outline-none"
                    style={{ borderColor: 'rgba(128,0,32,0.2)', color: '#2D2422' }}
                    placeholder="At least 8 characters"
                    required
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#8B6914' }}>Confirm password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                    style={{ borderColor: 'rgba(128,0,32,0.2)', color: '#2D2422' }}
                    placeholder="Re-enter your password"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-60"
                style={{ backgroundColor: '#800020' }}>
                {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Updating…</> : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordClient() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
