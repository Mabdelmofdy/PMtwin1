import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { LegacyRegisterPage } from '@/pages/public/legacy-register-page'
import { LegacyLoginPage } from '@/pages/public/legacy-login-page'
import {
  AuthMarketingColumn,
  AuthMarketingShell,
  MarketingButton,
} from '@/components/marketing/marketing-index'

export function LoginPage() {
  return <LegacyLoginPage />
}

export function RegisterPage() {
  return <LegacyRegisterPage />
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    toast.info('Password reset email is not connected in this preview.', {
      description: 'Use demo credentials on the sign-in page, or contact your administrator.',
    })
  }

  return (
    <AuthMarketingShell
      formLabel="Forgot password form"
      marketing={
        <AuthMarketingColumn
          kicker="Account recovery"
          kickerIcon="ph-envelope-simple"
          title="We'll help you get back into your workspace."
          description="Password reset keeps your commercial agreement flow, matches, and contract records secure. This preview shows the recovery experience — email delivery is not yet connected."
        />
      }
    >
      <div className="pm-auth-form-card">
        <header>
          <h1>Forgot password</h1>
          <p>Enter the email associated with your PM-Twin account.</p>
        </header>

        <div className="pm-auth-stub-notice" role="status">
          Password reset emails are not sent in this preview. Use demo sign-in or contact your
          administrator for access.
        </div>

        <form className="pm-auth-form-fields" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <MarketingButton type="submit" variant="primary">
            Request reset link
          </MarketingButton>
        </form>

        <Link to="/login" className="pm-auth-back-link">
          ← Back to sign in
        </Link>
      </div>
    </AuthMarketingShell>
  )
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    toast.info('Password update is not connected in this preview.', {
      description: 'Token validation and password storage are not available yet.',
    })
  }

  return (
    <AuthMarketingShell
      formLabel="Reset password form"
      marketing={
        <AuthMarketingColumn
          kicker="Secure reset"
          kickerIcon="ph-lock-key"
          title="Choose a strong password for your account."
          description="A unique password protects your opportunities, negotiations, and company profile. This preview shows the reset form — token validation is not yet connected."
        />
      }
    >
      <div className="pm-auth-form-card">
        <header>
          <h1>Set new password</h1>
          <p>Use at least 8 characters with a mix of letters and numbers.</p>
        </header>

        <div className="pm-auth-stub-notice" role="status">
          Reset tokens are not validated in this preview. Password changes will not be saved.
        </div>

        <form className="pm-auth-form-fields" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <MarketingButton type="submit" variant="primary">
            Update password
          </MarketingButton>
        </form>

        <Link to="/login" className="pm-auth-back-link">
          ← Back to sign in
        </Link>
      </div>
    </AuthMarketingShell>
  )
}
