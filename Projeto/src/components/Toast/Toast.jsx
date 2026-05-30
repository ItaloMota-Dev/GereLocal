import { useEffect, useMemo, useState } from 'react'
import styles from './Toast.module.scss'
import { useToast } from '../../context/ToastContext'

function getAriaLive(type) {
  if (type === 'danger') return 'assertive'
  return 'polite'
}

function getRole(type) {
  if (type === 'danger') return 'alert'
  return 'status'
}

export default function ToastsViewport() {
  const { toasts, removeToast } = useToast()

  return (
    <div className={styles.viewport} aria-label="Notificações">
      {toasts.map((t) => (
        <ToastCard
          key={t.id}
          toast={t}
          onClose={() => removeToast(t.id)}
          role={getRole(t.type)}
          ariaLive={getAriaLive(t.type)}
        />
      ))}
    </div>
  )
}

function ToastCard({ toast, onClose, role, ariaLive }) {
  const { type, title, message, durationMs, createdAt } = toast
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const start = createdAt
    const total = durationMs

    let rafId
    const update = () => {
      const elapsed = Date.now() - start
      const remainingRatio = 1 - elapsed / total
      const next = Math.max(0, Math.min(100, remainingRatio * 100))
      setProgress(next)

      if (elapsed >= total) return
      rafId = requestAnimationFrame(update)
    }

    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [createdAt, durationMs])

  const variantClass = useMemo(() => {
    switch (type) {
      case 'success':
        return styles.success
      case 'danger':
        return styles.danger
      case 'warning':
        return styles.warning
      case 'info':
      default:
        return styles.info
    }
  }, [type])

  return (
    <div
      className={`${styles.card} ${variantClass}`}
      role={role}
      aria-live={ariaLive}
    >
      <div className={styles.content}>
        <div className={styles.title}>
          {title || (type === 'success' ? 'Sucesso' : type === 'danger' ? 'Erro' : type === 'warning' ? 'Atenção' : 'Informação')}
        </div>
        {message && <div className={styles.message}>{message}</div>}
      </div>

      <button className={styles.close} onClick={onClose} aria-label="Fechar notificação">
        ×
      </button>

      <div className={styles.progressWrap} aria-hidden="true">
        <div
          className={styles.progressBar}
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </div>

    </div>
  )
}

