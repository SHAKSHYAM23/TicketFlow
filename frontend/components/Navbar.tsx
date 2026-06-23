'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Ticket, ShieldCheck, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { clearAuth, getUser } from '@/lib/auth'

interface AuthUser {
  name?: string
  email?: string
  role?: string
}

export default function Navbar() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setMounted(true)
    setUser(getUser())

    const handleAuthChange = () => setUser(getUser())
    window.addEventListener('auth-change', handleAuthChange)
    return () => window.removeEventListener('auth-change', handleAuthChange)
  }, [])

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const isAdmin = user?.role === 'admin'

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Ticket className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            TicketFlow
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avoid hydration mismatch: render nothing auth-specific until mounted */}
          {!mounted ? null : user ? (
            <>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/bookings" />}
                className="text-muted-foreground hover:text-foreground"
              >
                My Bookings
              </Button>

              {isAdmin && (
                <Button
                  variant="ghost"
                  nativeButton={false}
                  render={<Link href="/admin/verify" />}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Verify Ticket
                </Button>
              )}

              <div className="hidden items-center gap-2 sm:flex">
                {isAdmin && (
                  <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
                    <ShieldCheck className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {user.name ?? user.email}
                </span>
              </div>

              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/login" />}
                className="text-muted-foreground hover:text-foreground"
              >
                Login
              </Button>
              <Button size="sm" nativeButton={false} render={<Link href="/signup" />}>
                Sign Up
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
