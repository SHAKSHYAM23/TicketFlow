'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Ticket, AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import BookingCard from '@/components/BookingCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fetcher } from '@/lib/fetcher'
import { isLoggedIn } from '@/lib/auth'
import type { Booking } from '@/lib/types'

export default function BookingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isFresh = searchParams.get('fresh') === 'true'

  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login?redirect=/bookings')
    } else {
      setAuthed(true)
    }
  }, [router])

  const { data, error, isLoading } = useSWR<Booking[]>(
    authed ? '/api/bookings/me' : null,
    fetcher,
    {
      // if coming fresh from a payment and no bookings yet,
      // poll every 1.5s until the booking appears
      // (Kafka consumer may still be writing to Postgres)
      refreshInterval: (latestData) => {
        const list = Array.isArray(latestData) ? latestData : []
        if (isFresh && list.length === 0) return 1500
        return 0
      },
      revalidateOnFocus: true
    },
  )

  const bookings = Array.isArray(data) ? data : []

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage the tickets you have booked.
          </p>
        </div>

        {(authed === null || isLoading) && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
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

        {isFresh && authed && !isLoading && !error && bookings.length === 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <p className="text-sm text-muted-foreground">
              Finalizing your booking — this usually takes a few seconds.
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
            <AlertCircle className="h-8 w-8 text-danger" />
            <p className="text-sm text-muted-foreground">
              Could not load your bookings. Please try again.
            </p>
          </div>
        )}

        {authed && !isLoading && !error && bookings.length === 0 && !isFresh && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card py-20 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Ticket className="h-6 w-6 text-muted-foreground" />
            </span>
            <div>
              <p className="font-medium">No bookings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse events and reserve your first seats.
              </p>
            </div>
            <Button onClick={() => router.push('/')}>Browse events</Button>
          </div>
        )}

        {authed && !isLoading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.bookingRef}
                booking={booking}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}