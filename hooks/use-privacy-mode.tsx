"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

type PrivacyContextValue = {
  hidden: boolean
  toggle: () => void
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null)
const STORAGE_KEY = "financeiro:privacy-mode"

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "1") setHidden(true)
  }, [])

  const toggle = () => {
    setHidden((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
      }
      return next
    })
  }

  return (
    <PrivacyContext.Provider value={{ hidden, toggle }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacyMode() {
  const ctx = useContext(PrivacyContext)
  if (!ctx) {
    throw new Error("usePrivacyMode deve ser usado dentro de <PrivacyProvider>")
  }
  return ctx
}
