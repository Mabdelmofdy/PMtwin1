import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  return (
    <div className="mx-auto grid min-h-[calc(100svh-8rem)] max-w-5xl gap-8 px-4 py-12 md:grid-cols-2 md:px-8">
      <div className="hidden flex-col justify-center md:flex">
        <p className="text-sm font-medium text-primary">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to your workspace</h1>
        <p className="mt-4 text-muted-foreground">
          Access opportunities, matches, negotiations, and contracts in one place.
        </p>
      </div>
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Individual or company account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
          <Button className="w-full cursor-pointer" asChild>
            <Link to="/dashboard">Sign in</Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="cursor-pointer text-primary hover:underline">Forgot password?</Link>
            {' · '}
            <Link to="/register" className="cursor-pointer text-primary hover:underline">Create account</Link>
          </p>
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
