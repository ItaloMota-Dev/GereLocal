import { ChartNoAxesCombined, PackageCheck, ShoppingCart } from 'lucide-react'
import styles from './AuthShowcase.module.scss'

export default function AuthShowcase() {
  return (
    <aside className={styles.showcase} aria-label="Conheça o GereLocal">
      <div className={styles.content}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <PackageCheck size={24} strokeWidth={1.8} />
          </span>
          <span>GereLocal</span>
        </div>

        <div className={styles.intro}>
          <p className={styles.eyebrow}>Gestão do comércio local</p>
          <h2>Mais tempo para cuidar do seu negócio.</h2>
          <p className={styles.description}>
            Vendas, estoque e resultados reunidos em um sistema simples.
          </p>
        </div>

        <div className={styles.roles}>
          <article className={styles.roleCard}>
            <span className={styles.roleIcon} aria-hidden="true">
              <ShoppingCart size={21} strokeWidth={1.8} />
            </span>
            <div>
              <h3>Para atendimento</h3>
              <p>Registre vendas e consulte o estoque com rapidez.</p>
            </div>
          </article>

          <article className={styles.roleCard}>
            <span className={`${styles.roleIcon} ${styles.managerIcon}`} aria-hidden="true">
              <ChartNoAxesCombined size={21} strokeWidth={1.8} />
            </span>
            <div>
              <h3>Para gestão</h3>
              <p>Acompanhe vendas, estoque e fechamento do período.</p>
            </div>
          </article>
        </div>

        <p className={styles.footer}>Feito para apoiar pequenos comércios.</p>
      </div>
    </aside>
  )
}
