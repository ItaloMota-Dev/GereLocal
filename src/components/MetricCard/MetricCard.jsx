import styles from './MetricCard.module.scss'

export default function MetricCard({ title, value, icon, variant }) {
  return (
    <div className={`${styles.card} ${variant ? styles[variant] : ''}`}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        <span className={styles.value}>{value}</span>
      </div>
    </div>
  )
}

