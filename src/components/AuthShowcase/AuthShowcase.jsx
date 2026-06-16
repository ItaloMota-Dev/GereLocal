import { PackageCheck, TrendingUp } from 'lucide-react'
import styles from './AuthShowcase.module.scss'

export default function AuthShowcase() {
  return (
    <aside className={styles.showcase} aria-label="Identidade visual GereLocal">
      <div className={styles.glowOne} aria-hidden="true" />
      <div className={styles.glowTwo} aria-hidden="true" />

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.mark}>
            <PackageCheck size={24} strokeWidth={1.8} aria-hidden="true" />
            <TrendingUp size={20} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className={styles.headerLines}>
            <span />
            <span />
          </div>
        </div>

        <div className={styles.chart}>
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className={styles.rows}>
          <div>
            <i />
            <span />
            <strong />
          </div>
          <div>
            <i />
            <span />
            <strong />
          </div>
          <div>
            <i />
            <span />
            <strong />
          </div>
        </div>
      </div>

      <div className={styles.floatCard}>
        <span />
        <strong />
        <i />
      </div>

      <div className={styles.ring} aria-hidden="true" />
    </aside>
  )
}
