import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import AppRoutes from './routes/AppRoutes'

import ToastsViewport from './components/Toast/Toast'
import { ToastProvider } from './context/ToastContext'

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



