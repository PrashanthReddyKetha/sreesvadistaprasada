'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useAuth } from '@/context/AuthContext'

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false })

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder'

/**
 * Defers loading of Firebase + Google OAuth until the user first opens the auth modal.
 * Once opened once, the providers stay mounted to avoid re-initialisation on subsequent opens.
 * This removes ~186 KiB (Firebase 93 KiB + Google GSI 96 KiB) from the initial page load.
 */
export default function AuthModalLoader() {
  const { authOpen } = useAuth()
  const [hasOpened, setHasOpened] = useState(false)

  useEffect(() => {
    if (authOpen) setHasOpened(true)
  }, [authOpen])

  if (!hasOpened) return null

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthModal />
    </GoogleOAuthProvider>
  )
}
