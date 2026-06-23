'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import EventCard from '@/components/EventCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fetcher } from '@/lib/fetcher'
import { isLoggedIn, getUser } from '@/lib/auth'
import type { EventItem } from '@/lib/types'

export default function HomePage() {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setLoggedIn(isLoggedIn())

    const handleAuthChange = () => setLoggedIn(isLoggedIn())
    window.addEventListener('auth-change', handleAuthChange)
    return () => window.removeEventListener('auth-change', handleAuthChange)
  }, [])

  const { data, error, isLoading } = useSWR<EventItem[]>(
    '/api/events',
    fetcher,
  )

  const events = Array.isArray(data) ? data : []

  const handleEventClick = (event: EventItem) => {
    const id = event._id ?? event.id
    if (!isLoggedIn()) {
      router.push(
        `/login?message=${encodeURIComponent(
          'Please login to book seats',
        )}&redirect=${encodeURIComponent(`/events/${id}`)}`,
      )
      return
    }
    router.push(`/events/${id}`)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero — only show when NOT logged in */}
      {mounted && !loggedIn && (
      <section className="grid-pattern relative border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:py-32">
          <span className="mb-5 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            Real-time seat booking
          </span>
          <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-7xl">
            TicketFlow
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
            Book seats for the events you love. Fast, secure, real-time.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Button size="lg" onClick={() => router.push('/signup')}>
              Sign Up
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/login')}
            >
              Login
            </Button>
          </div>
        </div>
      </section>
      )}

      {/* Upcoming events */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            {mounted && loggedIn && (
              <p className="mb-1 text-sm text-muted-foreground">
                Welcome back, {getUser()?.name} 👋
              </p>
            )}
            <h2 className="text-2xl font-semibold tracking-tight">
              Upcoming Events
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick an event and reserve your seats.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5"
              >
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="mt-4 h-4 w-1/2" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <Skeleton className="mt-5 h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
            <AlertCircle className="h-8 w-8 text-danger" />
            <p className="text-sm text-muted-foreground">
              Could not load events. Make sure the API is running and try again.
            </p>
          </div>
        )}

        {!isLoading && !error && events.length === 0 && (
          <div className="rounded-xl border border-border bg-card py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No upcoming events right now. Check back soon.
            </p>
          </div>
        )}

        {!isLoading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event._id ?? event.id}
                event={event}
                onClick={handleEventClick}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-muted-foreground">
          TicketFlow — Fast, secure, real-time ticket booking.
        </div>
      </footer>
    </main>
  )
}
