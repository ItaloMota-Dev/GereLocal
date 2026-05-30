import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { LockKeyhole, Mail, PackageCheck, TrendingUp } from 'lucide-react'
import AuthShowcase from '../../components/AuthShowcase/AuthShowcase'
import useAuth from '../../hooks/useAuth'
import styles from './Login.module.scss'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, loginGoogle } = useAuth()
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    setTimeout(() => {
      const result = login(email, password)
      if (result.success) {
        navigate(result.user?.role === 'attendant' ? '/vendas' : '/dashboard')
      } else {
        setError(result.message)
        setIsLoading(false)
      }
    }, 800)
  }

  function handleGoogleSuccess(credentialResponse) {
    setError('')
    setIsLoading(true)

    setTimeout(() => {
      const result = loginGoogle(credentialResponse)
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.message)
        setIsLoading(false)
      }
    }, 400)
  }

  function handleGoogleError() {
    setError('Falha no login com Google. Tente novamente.')
  }

  return (
    <div className={styles.container}>
      <AuthShowcase />

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.brandMark} aria-hidden="true">
            <PackageCheck size={34} strokeWidth={1.8} />
            <TrendingUp size={28} strokeWidth={2} />
          </div>
          <h1>GereLocal</h1>
          <p>Gerencie seu estoque e vendas com facilidade</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <div className={styles.inputWrap}>
              <Mail size={18} strokeWidth={1.7} aria-hidden="true" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Senha</label>
            <div className={styles.inputWrap}>
              <LockKeyhole size={18} strokeWidth={1.7} aria-hidden="true" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" className={styles.submit} disabled={isLoading}>
            {isLoading ? (
              <span className={styles.spinnerWrapper}>
                <span className={styles.spinner}></span>
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <div className={styles.googleWrapper}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            size="large"
            width="100%"
            text="signin_with"
            shape="pill"
          />
        </div>

        <div className={styles.footer}>
          <span>Não tem uma conta?</span>
          <Link to="/cadastro">Criar conta</Link>
        </div>
      </div>

      {isLoading && (
        <div className={styles.overlay}>
          <div className={styles.loader}>
            <span className={styles.spinnerLarge}></span>
            <p>Entrando no sistema...</p>
          </div>
        </div>
      )}
    </div>
  )
}
