import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DEMO_CREDENTIALS } from '@/lib/auth-service'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<'auto' | 'individual' | 'company'>('auto')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    navigate(from, { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, { rememberMe, accountType })
      toast.success('Signed in')
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100svh-8rem)] max-w-5xl gap-8 px-4 py-12 md:grid-cols-2 md:px-8">
      <div className="hidden flex-col justify-center md:flex">
        <p className="text-sm font-medium text-primary">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to your workspace</h1>
        <p className="mt-4 text-muted-foreground">
          Access opportunities, Post-matches, pipeline, and contracts in one place.
        </p>
        <div className="mt-6 space-y-2 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
          <p className="font-medium">Demo credentials</p>
          {DEMO_CREDENTIALS.map((cred) => (
            <button
              key={cred.email}
              type="button"
              className="block w-full cursor-pointer rounded-lg border border-border/60 bg-background px-3 py-2 text-left transition-colors hover:border-primary/40"
              onClick={() => {
                setEmail(cred.email)
                setPassword(cred.password)
                setAccountType(cred.accountType)
              }}
            >
              <span className="font-medium">{cred.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{cred.email}</span>
            </button>
          ))}
        </div>
      </div>
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Individual or company account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 text-xs">
              {(['auto', 'individual', 'company'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`cursor-pointer rounded-full px-3 py-1 capitalize ${
                    accountType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  onClick={() => setAccountType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            {error ? (
              <p className="text-sm text-destructive" role="alert">{error}</p>
            ) : null}
            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/forgot-password" className="cursor-pointer text-primary hover:underline">
                Forgot password?
              </Link>
              {' · '}
              <Link to="/register" className="cursor-pointer text-primary hover:underline">
                Create account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function RegisterPage() {
  const steps = ['Account type', 'Role', 'Profile', 'Documents', 'Review', 'Verification']
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-muted-foreground">6-step onboarding for professionals and companies.</p>
      <div className="mt-6 flex gap-1 overflow-x-auto">
        {steps.map((s, i) => (
          <span key={s} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {i + 1}. {s}
          </span>
        ))}
      </div>
      <Card className="mt-6 border-border/60">
        <CardHeader>
          <CardTitle>Account type</CardTitle>
          <CardDescription>Choose how you will use PM-Twin</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {['Professional', 'Company'].map((type) => (
            <button key={type} type="button" className="cursor-pointer rounded-xl border border-border/60 p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40">
              <p className="font-medium">{type}</p>
              <p className="mt-1 text-xs text-muted-foreground">Continue registration as {type.toLowerCase()}</p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We will send a reset link to your email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input id="reset-email" type="email" />
          </div>
          <Button className="w-full cursor-pointer">Send reset link</Button>
          <Button variant="ghost" className="w-full cursor-pointer" asChild>
            <Link to="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Set new password</CardTitle>
          <CardDescription>Choose a strong password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button className="w-full cursor-pointer" asChild>
            <Link to="/login">Update password</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
