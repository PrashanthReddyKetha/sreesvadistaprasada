'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import dynamic from 'next/dynamic'

// Load drawer lazily so Firebase is never loaded unless the drawer opens
const NotifyMeDrawer = dynamic(() => import('@/components/NotifyMeDrawer'), { ssr: false })

interface NotifyMeContextType {
  openNotifyMe: (itemName: string, category: string) => void
}

interface DrawerState {
  isOpen: boolean
  itemName: string
  category: string
}

const NotifyMeContext = createContext<NotifyMeContextType>({ openNotifyMe: () => {} })

export const useNotifyMe = () => useContext(NotifyMeContext)

export function NotifyMeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DrawerState>({ isOpen: false, itemName: '', category: '' })

  const openNotifyMe = (itemName: string, category: string) => {
    setState({ isOpen: true, itemName, category })
  }

  const close = () => setState(s => ({ ...s, isOpen: false }))

  return (
    <NotifyMeContext.Provider value={{ openNotifyMe }}>
      {children}
      <NotifyMeDrawer
        isOpen={state.isOpen}
        onClose={close}
        itemName={state.itemName}
        category={state.category}
      />
    </NotifyMeContext.Provider>
  )
}
