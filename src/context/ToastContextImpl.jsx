import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { clampNumber } from './toastUtils'

export const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast) => {
      const { title, message, type = 'info', durationMs = 4000 } = toast || {}

      const safeDuration = clampNumber(Number(durationMs) || 4000, 1500, 10000)
      const id = String(++idRef.current)

      setToasts((prev) => [
        ...prev,
        {
          id,
          title,
          message,
          type,
          durationMs: safeDuration,
          createdAt: Date.now(),
        },
      ])

      window.setTimeout(() => {
        removeToast(id)
      }, safeDuration)
    },
    [removeToast]
  )

  const value = useMemo(() => ({ pushToast, toasts, removeToast }), [pushToast, toasts, removeToast])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return ctx
}

