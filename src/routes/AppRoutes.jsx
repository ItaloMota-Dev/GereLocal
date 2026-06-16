import { Routes, Route, Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import Login from '../pages/Login/Login'
import Cadastro from '../pages/Cadastro/Cadastro'
import Dashboard from '../pages/Dashboard/Dashboard'
import Estoque from '../pages/Estoque/Estoque'
import Vendas from '../pages/Vendas/Vendas'
import Fechamento from '../pages/Fechamento/Fechamento'
import Ajuda from '../pages/Ajuda/Ajuda'

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

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (user?.role === 'attendant') return <Navigate to="/vendas" replace />
  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/cadastro"
        element={
          <PublicRoute>
            <Cadastro />
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
        <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/vendas" element={<Vendas />} />
        <Route path="/fechamento" element={<Fechamento />} />
        <Route path="/ajuda" element={<Ajuda />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
