'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Bell, Phone, CheckCircle, ArrowRight } from 'lucide-react'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { auth } from '@/firebase'
import api from '@/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  itemName?: string
  category?: string
}

type Step = 'form' | 'otp' | 'success'

export default function NotifyMeDrawer({ isOpen, onClose, itemName, category }: Props) {
  const [step, setStep]       = useState<Step>('form')
  const [phone, setPhone]     = useState('')
  const [otp, setOtp]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const recaptchaRef  = useRef<HTMLDivElement>(null)
  const verifierRef   = useRef<RecaptchaVerifier | null>(null)
  const confirmRef    = useRef<ConfirmationResult | null>(null)

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setStep('form'); setPhone(''); setOtp('')
        setError(''); setLoading(false)
        verifierRef.current = null
      }, 320)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const formatPhone = (raw: string) => {
    const clean = raw.replace(/\s/g, '')
    if (clean.startsWith('+')) return clean
    if (clean.startsWith('0')) return `+44${clean.slice(1)}`
    return `+44${clean}`
  }

  const sendOtp = async () => {
    if (!auth) { setError('Verification service unavailable — please try again later.'); return }
    setError(''); setLoading(true)
    try {
      if (!verifierRef.current && recaptchaRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, { size: 'invisible' })
      }
      confirmRef.current = await signInWithPhoneNumber(auth, formatPhone(phone), verifierRef.current!)
      setStep('otp')
    } catch {
      setError('Could not send code — please check your number and try again.')
      verifierRef.current = null
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setError(''); setLoading(true)
    try {
      await confirmRef.current!.confirm(otp)
      await api.post('/enquiries/waitlist', {
        phone: formatPhone(phone),
        category: category ?? 'general',
        item_name: itemName ?? 'Full Menu',
      })
      setStep('success')
    } catch {
      setError('Wrong code — please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    setStep('form'); setOtp(''); setError('')
    verifierRef.current = null
  }

  if (!isOpen) return null

  return (
    <>
      {/* Faint backdrop — user can still see the page behind */}
      <div
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Slide-up drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] animate-slide-up"
        style={{
          backgroundColor: '#FDFBF7',
          borderTop: '3px solid #F4C430',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 48px rgba(128, 0, 32, 0.18)',
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'rgba(128,0,32,0.18)' }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[#800020]/10"
          aria-label="Close"
        >
          <X size={16} style={{ color: '#7A5C50' }} />
        </button>

        <div className="px-5 pb-8 pt-2 w-full max-w-lg mx-auto">

          {/* ── STEP 1: Phone form ─────────────────────────────────── */}
          {step === 'form' && (
            <>
              <div className="flex items-center gap-2 mb-0.5">
                <Bell size={13} style={{ color: '#F4C430' }} />
                <p className="text-[11px] uppercase tracking-[0.22em] font-semibold" style={{ color: '#8B6914' }}>
                  Launching Soon
                </p>
              </div>

              <h3
                className="text-[22px] font-bold mb-1 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
              >
                You've Got Taste.
              </h3>

              <p className="text-sm leading-relaxed mb-5" style={{ color: '#5C4B47' }}>
                <span className="font-semibold" style={{ color: '#3D2B1F' }}>
                  {itemName || 'This menu'}
                </span>{' '}
                is almost ready. Drop your number — we'll text you the moment it's live, plus a{' '}
                <span className="font-semibold" style={{ color: '#8B6914' }}>launch-day offer</span>{' '}
                only for waitlist members.
              </p>

              {/* Phone input row */}
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-2 border-2 transition-colors focus-within:border-[#800020]"
                style={{ backgroundColor: 'white', borderColor: 'rgba(128,0,32,0.2)' }}
              >
                <Phone size={15} style={{ color: '#800020', flexShrink: 0 }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && phone.replace(/\s/g, '').length >= 10 && sendOtp()}
                  placeholder="07700 900 123"
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ color: '#3D2B1F' }}
                  autoFocus
                />
              </div>

              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

              <button
                onClick={sendOtp}
                disabled={loading || phone.replace(/\s/g, '').length < 10}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: '#800020' }}
              >
                {loading ? 'Sending…' : <><ArrowRight size={16} /> Send Verification Code</>}
              </button>

              <p className="text-center text-[11px] mt-3" style={{ color: '#9CA3AF' }}>
                UK number only &nbsp;·&nbsp; One-time code &nbsp;·&nbsp; No spam, ever
              </p>
            </>
          )}

          {/* ── STEP 2: OTP ──────────────────────────────────────────── */}
          {step === 'otp' && (
            <>
              <div className="flex items-center gap-2 mb-0.5">
                <Bell size={13} style={{ color: '#F4C430' }} />
                <p className="text-[11px] uppercase tracking-[0.22em] font-semibold" style={{ color: '#8B6914' }}>
                  Almost there
                </p>
              </div>

              <h3
                className="text-[22px] font-bold mb-1 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
              >
                One Last Step
              </h3>

              <p className="text-sm mb-5" style={{ color: '#5C4B47' }}>
                We sent a 6-digit code to{' '}
                <span className="font-semibold">{phone}</span>
              </p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && otp.length === 6 && verifyOtp()}
                placeholder="_ _ _ _ _ _"
                className="w-full px-4 py-3 rounded-xl text-center text-2xl font-bold tracking-[0.6em] border-2 focus:border-[#800020] outline-none mb-2 transition-colors"
                style={{ backgroundColor: 'white', borderColor: 'rgba(128,0,32,0.2)', color: '#3D2B1F' }}
                autoFocus
              />

              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: '#800020' }}
              >
                {loading ? 'Confirming…' : <><CheckCircle size={16} /> Confirm &amp; Join Waitlist</>}
              </button>

              <button
                onClick={goBack}
                className="w-full mt-3 text-xs py-1.5 text-center transition-opacity hover:opacity-70"
                style={{ color: '#7A5C50' }}
              >
                ← Change number
              </button>
            </>
          )}

          {/* ── STEP 3: Success ──────────────────────────────────────── */}
          {step === 'success' && (
            <div className="py-4 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(22,101,52,0.1)' }}
              >
                <CheckCircle size={34} style={{ color: '#166534' }} />
              </div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-1" style={{ color: '#8B6914' }}>
                You're in
              </p>
              <h3
                className="text-[22px] font-bold mb-2 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
              >
                You're on the list!
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#5C4B47' }}>
                We'll text you the moment{' '}
                <span className="font-semibold">{itemName}</span> launches — along with
                your exclusive offer. See you at the table. 🙏
              </p>
            </div>
          )}
        </div>

        {/* Invisible recaptcha anchor — Firebase attaches here */}
        <div ref={recaptchaRef} />
      </div>
    </>
  )
}
