'use client'
import { useEffect } from 'react'
import api from '@/api'

export default function BackendWarmup() {
  useEffect(() => {
    api.get('/health').catch(() => {})
  }, [])
  return null
}
