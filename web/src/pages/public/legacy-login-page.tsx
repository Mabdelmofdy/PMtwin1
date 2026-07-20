import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PocHtmlBlock } from '@/components/public/poc-html-block'
import {
  DemoCredentialsDialog,
  type DemoCredentialRow,
} from '@/components/public/demo-credentials-dialog'
import { getPocSectionHtml } from '@/lib/poc-site-content'
import { authService } from '@/lib/auth-service'
import { resolvePostLoginPath } from '@/domain/rbac/resolve-post-login-path.ts'
import { useAuth } from '@/providers/auth-provider'
import type { PlatformUser } from '@/types/domain.ts'

const LOGIN_MARKETING = getPocSectionHtml('login', 'marketing-column')
const LOGIN_HEADER = getPocSectionHtml('login', 'form-header')

export function LegacyLoginPage() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)

  const goAfterLogin = (signedIn: PlatformUser) => {
    navigate(
      resolvePostLoginPath({
        userRole: signedIn.role,
        from,
        isCompanyUser: authService.isCompanyUser(signedIn),
      }),
      { replace: true },
    )
  }

  if (isAuthenticated && user) {
    goAfterLogin(user)
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password, { rememberMe, accountType })
      toast.success('Signed in')
      goAfterLogin(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const useDemo = async (row: DemoCredentialRow) => {
    setEmail(row.email)
    setPassword(row.password)
    setAccountType(row.accountType === 'company' ? 'company' : 'individual')
    setError('')
    setLoading(true)
    try {
      const user = await login(row.email, row.password, {
        rememberMe: false,
        accountType: row.accountType,
      })
      toast.success(
        row.group === 'admin' ? 'Signed in — opening Admin Portal' : 'Signed in',
      )
      goAfterLogin(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="legacy-poc-page page-container login-page pm-auth-page pm-login-page">
      <section className="pm-auth-visual" aria-label="PM-Twin workspace preview">
        <PocHtmlBlock html={LOGIN_MARKETING} />
      </section>

      <section className="pm-auth-form-zone" aria-label="Login form">
        <div className="pm-login-card">
          <header className="pm-auth-header">
            <PocHtmlBlock html={LOGIN_HEADER} />
          </header>

          <form className="pm-login-form" onSubmit={submit}>
            <div className="pm-field">
              <span className="pm-field-label" id="account-type-label">
                Account type
              </span>
              <div className="pm-account-type" role="radiogroup" aria-labelledby="account-type-label">
                <label className="pm-account-type-option">
                  <input
                    type="radio"
                    name="accountType"
                    value="individual"
                    checked={accountType === 'individual'}
                    onChange={() => setAccountType('individual')}
                    className="sr-only"
                  />
                  <span className="pm-account-type-card">
                    <span className="pm-account-type-check" aria-hidden="true">
                      <i className="ph-fill ph-check-circle" />
                    </span>
                    <span className="pm-account-type-icon" aria-hidden="true">
                      <i className="ph-duotone ph-user" />
                    </span>
                    <span className="pm-account-type-copy">
                      <strong>Individual</strong>
                      <small>Professional or consultant</small>
                    </span>
                  </span>
                </label>
                <label className="pm-account-type-option">
                  <input
                    type="radio"
                    name="accountType"
                    value="company"
                    checked={accountType === 'company'}
                    onChange={() => setAccountType('company')}
                    className="sr-only"
                  />
                  <span className="pm-account-type-card">
                    <span className="pm-account-type-check" aria-hidden="true">
                      <i className="ph-fill ph-check-circle" />
                    </span>
                    <span className="pm-account-type-icon" aria-hidden="true">
                      <i className="ph-duotone ph-buildings" />
                    </span>
                    <span className="pm-account-type-copy">
                      <strong>Company</strong>
                      <small>Business account</small>
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="pm-field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="your@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="pm-field">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="pm-login-row">
              <label className="pm-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            {error ? (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            ) : null}

            <button type="submit" className="pm-submit-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </button>

            <div className="pm-social-actions" aria-label="Social sign-in (coming soon)">
              <button
                type="button"
                className="pm-social-coming-soon"
                disabled
                aria-disabled="true"
                title="Social sign-in is coming soon"
              >
                <i className="ph-duotone ph-google-logo" aria-hidden="true" />
                <span>Sign in with Google</span>
                <span className="pm-social-badge">Coming soon</span>
              </button>
              <button
                type="button"
                className="pm-social-coming-soon"
                disabled
                aria-disabled="true"
                title="Social sign-in is coming soon"
              >
                <i className="ph-duotone ph-linkedin-logo" aria-hidden="true" />
                <span>Sign in with LinkedIn</span>
                <span className="pm-social-badge">Coming soon</span>
              </button>
            </div>

            <button
              type="button"
              className="pm-demo-credentials-trigger"
              onClick={() => setDemoOpen(true)}
            >
              <i className="ph-duotone ph-users-three" aria-hidden="true" />
              <span>Browse demo accounts</span>
            </button>

            <p className="pm-auth-switch">
              Don&apos;t have an account? <Link to="/register">Register</Link>
            </p>
          </form>
        </div>
      </section>

      <DemoCredentialsDialog open={demoOpen} onOpenChange={setDemoOpen} onSelect={useDemo} />
    </div>
  )
}
