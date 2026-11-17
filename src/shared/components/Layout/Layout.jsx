import { Outlet, useLocation } from 'react-router-dom'
import { User } from 'lucide-react'
import Sidebar from '../Sidebar/Sidebar'
import useAuth from '../../../features/auth/hooks/useAuth'
import logo2 from '../../assets/logo_2.png'
import styles from './Layout.module.scss'

export default function Layout() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isManager = user?.role === 'admin'

  const titles = {
    '/dashboard': 'Dashboard',
    '/estoque': 'Estoque',
    '/vendas': 'Vendas',
    '/fechamento': 'Relatório',
    '/ajuda': 'Ajuda',
  }
  const pageTitle = titles[pathname] || ''
  const subtitles = {
    '/dashboard': 'Resumo geral do desempenho da loja',
    '/estoque': 'Produtos, categorias e reposição',
    '/vendas': 'Consulta e histórico de vendas',
    '/fechamento': 'Análise do período e caixa',
    '/ajuda': 'Manual rápido de uso do sistema',
  }
  const pageSubtitle = subtitles[pathname] || ''

  return (

    <div className={styles.layout}>


      <div className={styles.topLeftSquare}>
        <img src={logo2} className={styles.sideLogo} alt="GereLocal" />
      </div>


      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {pageTitle ? (
            <div className={styles.headerTitleGroup}>
              <h1 className={styles.headerTitle}>{pageTitle}</h1>
              {pageSubtitle ? <span className={styles.headerSubtitle}>{pageSubtitle}</span> : null}
            </div>
          ) : null}
        </div>

        <div className={styles.headerUser}>
          <span className={styles.headerAvatar}>
            {user?.picture ? (
              <img src={user.picture} alt={user.name || 'Usuário'} />
            ) : (
              <User size={18} strokeWidth={1.6} />
            )}
          </span>
          <div className={styles.headerUserText}>
            <span>{isManager ? 'Gerente' : 'Atendente'}</span>
            {isManager ? <strong>Código da loja: {user.inviteCode}</strong> : <strong>Equipe da loja</strong>}
          </div>
        </div>

      </header>


      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
