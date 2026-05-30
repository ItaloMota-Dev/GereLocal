import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, KeyRound, LockKeyhole, Mail, PackageCheck, TrendingUp, User } from 'lucide-react'
import AuthShowcase from '../../components/AuthShowcase/AuthShowcase'
import useAuth from '../../hooks/useAuth'
import styles from './Cadastro.module.scss'

export default function Cadastro() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('admin')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setIsLoading(true)

    setTimeout(() => {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const result = register(fullName, email, password, role, inviteCode)
      if (result.success) {
        navigate(role === 'attendant' ? '/vendas' : '/dashboard')
      } else {
        setError(result.message)
        setIsLoading(false)
      }
    }, 800)
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
          <h1>Criar Conta</h1>
          <p>Comece a gerenciar seu negócio hoje</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.nameGrid}>
            <div className={styles.field}>
              <label htmlFor="firstName">Nome</label>
              <div className={styles.inputWrap}>
                <User size={18} strokeWidth={1.7} aria-hidden="true" />
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="lastName">Sobrenome</label>
              <div className={styles.inputWrap}>
                <User size={18} strokeWidth={1.7} aria-hidden="true" />
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Seu sobrenome"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

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
            <label htmlFor="role">Perfil</label>
            <div className={styles.inputWrap}>
              <BadgeCheck size={18} strokeWidth={1.7} aria-hidden="true" />
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
              >
                <option value="admin">Administrador</option>
                <option value="attendant">Atendente</option>
              </select>
            </div>
          </div>

          {role === 'attendant' ? (
            <div className={styles.field}>
              <label htmlFor="inviteCode">Código do administrador</label>
              <div className={styles.inputWrap}>
                <KeyRound size={18} strokeWidth={1.7} aria-hidden="true" />
                <input
                  id="inviteCode"
                  type="text"
                  inputMode="numeric"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Ex.: 123456"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : (
            <div className={styles.infoBox}>
              Ao criar uma conta de administrador, o sistema gera um código para conectar funcionários à sua loja.
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="password">Senha</label>
            <div className={styles.inputWrap}>
              <LockKeyhole size={18} strokeWidth={1.7} aria-hidden="true" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="confirm">Confirmar senha</label>
            <div className={styles.inputWrap}>
              <LockKeyhole size={18} strokeWidth={1.7} aria-hidden="true" />
              <input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" className={styles.submit} disabled={isLoading}>
            {isLoading ? (
              <span className={styles.spinnerWrapper}>
                <span className={styles.spinner}></span>
                Criando conta...
              </span>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <span>Já tem uma conta?</span>
          <Link to="/login">Entrar</Link>
        </div>
      </div>

      {isLoading && (
        <div className={styles.overlay}>
          <div className={styles.loader}>
            <span className={styles.spinnerLarge}></span>
            <p>Criando sua conta...</p>
          </div>
        </div>
      )}
    </div>
  )
}
