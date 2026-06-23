'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Ticket, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { setAuth } from '@/lib/auth'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminMode, setAdminMode] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const message = params.get('message')
    if (message) toast.info(message)
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const endpoint = adminMode ? '/api/auth/admin/login' : '/api/auth/login'
      const { data } = await api.post(endpoint, { email, password })
      const token = data.token ?? data.accessToken
      const user = data.user ?? data
      setAuth(token, user)
      toast.success('Logged in successfully')
      const redirect = params.get('redirect')
      router.push(redirect || (adminMode ? '/admin/verify' : '/'))
      router.refresh()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Login failed. Please check your credentials.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid-pattern flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Ticket className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-2xl font-semibold tracking-tight">
              TicketFlow
            </span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            {adminMode
              ? 'Sign in to the admin console'
              : 'Welcome back. Sign in to book your seats.'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-lg sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {adminMode ? 'Admin Login' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3 text-sm">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
            <button
              type="button"
              onClick={() => setAdminMode((v) => !v)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {adminMode ? 'Back to user login' : 'Admin? Login here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
