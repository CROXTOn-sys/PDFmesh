'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Check, Info, AlertTriangle, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

type Toast = {
  id: number
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  /** Show a toast. Returns its id. */
  notify: (message: string, variant?: ToastVariant, durationMs?: number) => number
  success: (message: string, durationMs?: number) => number
  error: (message: string, durationMs?: number) => number
  info: (message: string, durationMs?: number) => number
  warning: (message: string, durationMs?: number) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 3500,
  info: 3500,
  warning: 5000,
  error: 6000,
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') return <Check size={18} />
  if (variant === 'error') return <X size={18} />
  if (variant === 'warning') return <AlertTriangle size={18} />
  return <Info size={18} />
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (message: string, variant: ToastVariant = 'info', durationMs?: number) => {
      const id = ++idRef.current
      setToasts((prev) => {
        // Avoid stacking the exact same message repeatedly.
        if (prev.some((t) => t.message === message && t.variant === variant)) return prev
        return [...prev, { id, message, variant }]
      })
      const duration = durationMs ?? DEFAULT_DURATION[variant]
      const timer = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
      return id
    },
    [dismiss]
  )

  const success = useCallback((m: string, d?: number) => notify(m, 'success', d), [notify])
  const error = useCallback((m: string, d?: number) => notify(m, 'error', d), [notify])
  const info = useCallback((m: string, d?: number) => notify(m, 'info', d), [notify])
  const warning = useCallback((m: string, d?: number) => notify(m, 'warning', d), [notify])

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((t) => clearTimeout(t))
      map.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ notify, success, error, info, warning, dismiss }}>
      {children}
      <div className="toast-viewport" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.variant}`} role="status">
            <span className="toast-icon" aria-hidden="true">
              <ToastIcon variant={t.variant} />
            </span>
            <span className="toast-message">{t.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/**
 * Access the toast API. Safe to call even if no provider is mounted: it returns
 * no-op functions so components never crash (useful during SSR/tests).
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (ctx) return ctx
  const noop = () => 0
  return {
    notify: noop,
    success: noop,
    error: noop,
    info: noop,
    warning: noop,
    dismiss: () => {},
  }
}
