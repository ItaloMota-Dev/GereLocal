import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CircleHelp, ClipboardList, LayoutDashboard, Package, ShoppingCart, User, LogOut } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import styles from './Sidebar.module.scss'


const menuItems = [
  { path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/estoque', label: 'Estoque', Icon: Package },
  { path: '/vendas', label: 'Vendas', Icon: ShoppingCart },
  { path: '/fechamento', label: 'Fechamento', adminLabel: 'Relatório', Icon: ClipboardList },
  { path: '/ajuda', label: 'Ajuda', Icon: CircleHelp },
]

function getShortName(name) {
  const parts = (name || 'Usuário').trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return parts[0] || 'Usuário'

  return `${parts[0]} ${parts[parts.length - 1]}`
}

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const displayName = user?.role === 'attendant' ? 'Atendente' : getShortName(user?.name)
  const visibleMenuItems = user?.role === 'attendant'
    ? menuItems
        .filter((item) => item.path !== '/dashboard')
        .sort((a, b) => {
          const order = ['/vendas', '/estoque', '/fechamento', '/ajuda']
          return order.indexOf(a.path) - order.indexOf(b.path)
        })
    : menuItems
 
 
  function handleLogout() {
    setIsLoggingOut(true)
    setTimeout(() => {
      logout()
    }, 600)
  }

  return (
    <aside
      className={styles.sidebar}
    >





      <nav className={styles.nav}>
        {visibleMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.link} ${location.pathname === item.path ? styles.active : ''}`}
          >
            <span className={styles.icon}>
              <item.Icon size={20} strokeWidth={1.5} />
            </span>
            <span className={styles.label}>{user?.role === 'admin' && item.adminLabel ? item.adminLabel : item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.user}>
          <span className={styles.avatar}>
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name || 'Usuário'}
                className={styles.avatarImg}
              />
            ) : (
              <User size={20} strokeWidth={1.5} />
            )}
          </span>
          <span className={styles.name} title={displayName}>
            {displayName}
          </span>
        </div>
        <button className={styles.logout} onClick={handleLogout} disabled={isLoggingOut}>
          <span className={styles.logoutIcon}>
            <LogOut size={20} strokeWidth={1.5} />
          </span>
          <span className={styles.logoutLabel}>
            {isLoggingOut ? (
              <span className={styles.spinnerWrapper}>
                <span className={styles.spinner}></span>
                Saindo...
              </span>
            ) : (
              'Sair'
            )}
          </span>
        </button>
      </div>

      {isLoggingOut && (
        <div className={styles.overlay}>
          <div className={styles.loader}>
            <span className={styles.spinnerLarge}></span>
            <p>Saindo do sistema...</p>
          </div>
        </div>
      )}
    </aside>
  )
}
