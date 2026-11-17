import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../features/auth/context/AuthContext'
import { DataProvider } from '../shared/contexts/DataContext'
import AppRoutes from './routes/AppRoutes'
import ToastsViewport from '../shared/components/Toast/Toast'
import { ToastProvider } from '../shared/contexts/ToastContext'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <DataProvider>
            <AppRoutes />
            <ToastsViewport />
          </DataProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}


