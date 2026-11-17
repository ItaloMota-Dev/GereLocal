import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuth from '../../features/auth/hooks/useAuth'
import Layout from '../../shared/components/Layout/Layout'

const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('../../features/auth/pages/RegisterPage'))
const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage'))
const InventoryPage = lazy(() => import('../../features/inventory/pages/InventoryPage'))
const SalesPage = lazy(() => import('../../features/sales/pages/SalesPage'))
const CloseoutPage = lazy(() => import('../../features/cash-closing/pages/CloseoutPage'))
const HelpPage = lazy(() => import('../../features/help/pages/HelpPage'))

function getHomePath(user) {
  return user?.role === 'attendant' ? '/vendas' : '/dashboard'
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>
  if (user) return <Navigate to={getHomePath(user)} replace />
  return children
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>
  if (user) return <Navigate to={getHomePath(user)} replace />
  return <Navigate to="/login" replace />
}

function ManagerRoute({ children }) {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/vendas" replace />
  return children
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<div role="status" style={{ padding: 40, textAlign: 'center' }}>Carregando tela...</div>}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/cadastro"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<ManagerRoute><DashboardPage /></ManagerRoute>} />
          <Route path="/estoque" element={<InventoryPage />} />
          <Route path="/vendas" element={<SalesPage />} />
          <Route path="/fechamento" element={<ManagerRoute><CloseoutPage /></ManagerRoute>} />
          <Route path="/ajuda" element={<HelpPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}
