import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AuthMarketingColumn,
  AuthMarketingShell,
} from '@/components/marketing/marketing-index'
import { resolveOtpDelivery } from '@/domain/otp'
import {
  invitationService,
  verifyInviteLogin,
} from '@/lib/invitation-service.ts'
import { useAuth } from '@/providers/auth-provider'

/**
 * Public invitation accept route — employee joins existing company workspace.
 * Never creates a Company party.
 */
export function InviteAcceptPage() {
  const { token = '' } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { login } = useAuth()
  const invitation = useMemo(
    () => (token ? invitationService.getByToken(token) : undefined),
    [token],
  )

  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [otpChallengeId, setOtpChallengeId] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [debugCode, setDebugCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!invitation) {
    return (
      <AuthMarketingShell
        pageClassName="pm-register-page"
        formLabel="Invitation"
        marketing={
          <AuthMarketingColumn
            kicker="Invitation"
            kickerIcon="ph-envelope"
            title="Invitation not found"
            description="This invite link is invalid or has been removed."
          />
        }
      >
        <p className="text-sm text-gray-600">
          <Link to="/login">Sign in</Link> or contact your company administrator.
        </p>
      </AuthMarketingShell>
    )
  }

  const sendOtp = async () => {
    setBusy(true)
    setError(null)
    const result = await resolveOtpDelivery().send({
      channel: 'email',
      destination: invitation.email,
      purpose: 'invitation_identity',
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setOtpChallengeId(result.challenge.challengeId)
    setDebugCode(result.challenge.debugCode ?? '')
    setOtpVerified(false)
    setMessage(
      result.challenge.debugCode
        ? `Code sent. Demo/UAT: ${result.challenge.debugCode}`
        : 'Verification code sent.',
    )
  }

  const verifyOtp = async () => {
    setBusy(true)
    setError(null)
    const result = await resolveOtpDelivery().verify({
      challengeId: otpChallengeId,
      code: otpCode,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setOtpVerified(true)
    setMessage('Identity verified.')
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!otpVerified) {
      setError('Verify your email with the one-time code first.')
      return
    }
    setBusy(true)
    setError(null)

    let existingUserId: string | undefined
    if (mode === 'login') {
      const id = verifyInviteLogin(invitation.email, password)
      if (!id) {
        setBusy(false)
        setError('Invalid email or password.')
        return
      }
      existingUserId = id
    }

    const result = await invitationService.acceptInvitation({
      token: invitation.token,
      password: mode === 'register' ? password : undefined,
      displayName: mode === 'register' ? displayName : undefined,
      otpChallengeId,
      otpCode,
      existingUserId,
    })
    setBusy(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    // User + personal workspace already created by acceptInvitation when registering.
    await login(invitation.email, password)
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthMarketingShell
      pageClassName="pm-register-page"
      formLabel="Accept invitation"
      marketing={
        <AuthMarketingColumn
          kicker="Employee invitation"
          kickerIcon="ph-users-three"
          title="Join your company workspace"
          description="Verify your identity and join the existing company workspace. You will not create a new company."
        />
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <p className="text-sm text-gray-700">
          Invited email: <strong>{invitation.email}</strong>
        </p>
        <p className="text-xs text-gray-500">
          Expires {new Date(invitation.expiresAt).toLocaleString()}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            className={`reg-wizard-btn ${mode === 'register' ? 'reg-wizard-btn--primary' : 'reg-wizard-btn--secondary'}`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
          <button
            type="button"
            className={`reg-wizard-btn ${mode === 'login' ? 'reg-wizard-btn--primary' : 'reg-wizard-btn--secondary'}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
        </div>

        {mode === 'register' ? (
          <label className="block text-sm">
            Full name
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </label>
        ) : null}

        <label className="block text-sm">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="mb-2 text-sm font-medium">Identity verification (OTP)</p>
          <button
            type="button"
            className="reg-wizard-btn reg-wizard-btn--secondary mb-2"
            onClick={() => void sendOtp()}
            disabled={busy}
          >
            Send code
          </button>
          <input
            className="mb-2 w-full rounded-lg border px-3 py-2"
            placeholder="OTP code"
            value={otpCode}
            onChange={(e) => {
              setOtpCode(e.target.value)
              setOtpVerified(false)
            }}
          />
          <button
            type="button"
            className="reg-wizard-btn reg-wizard-btn--primary"
            onClick={() => void verifyOtp()}
            disabled={busy || !otpChallengeId}
          >
            Verify
          </button>
          {debugCode ? (
            <p className="mt-2 text-xs text-amber-800">Demo/UAT code: {debugCode}</p>
          ) : null}
          {otpVerified ? (
            <p className="mt-2 text-sm text-emerald-700">Verified</p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-gray-700">{message}</p> : null}

        <button
          type="submit"
          className="reg-wizard-btn reg-wizard-btn--primary w-full"
          disabled={busy}
        >
          {busy ? 'Working…' : 'Accept invitation'}
        </button>
      </form>
    </AuthMarketingShell>
  )
}
