'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import SeatMap from '@/components/SeatMap'
import BookingSummary from '@/components/BookingSummary'
import PaymentModal from '@/components/PaymentModal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import { isLoggedIn } from '@/lib/auth'
import { seatLabel } from '@/lib/format'
import {
  joinEventRoom,
  leaveEventRoom,
  onSeatUpdated,
  offSeatUpdated,
} from '@/lib/socket'
import type { EventItem, Seat, SeatsResponse } from '@/lib/types'

const MAX_SEATS = 6
const LOCK_DURATION = 300 

function getSeatId(seat: Seat) {
  return seat._id ?? seat.id ?? `${seat.rowLabel}${seat.seatNumber}`
}

export default function SeatMapPage() {
  const params = useParams<{ id: string }>()
  const eventId = params.id
  const router = useRouter()

  const [event, setEvent] = useState<EventItem | null>(null)
  const [rows, setRows] = useState<Record<string, Seat[]>>({})
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)


  const [confirming, setConfirming] = useState(false)
  const [locked, setLocked] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace(
        `/login?message=${encodeURIComponent(
          'Please login to book seats',
        )}&redirect=${encodeURIComponent(`/events/${eventId}`)}`,
      )
    }
  }, [eventId, router])

  // Fetch event + seats
  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const [eventRes, seatsRes] = await Promise.all([
          api.get<EventItem>(`/api/events/${eventId}`),
          api.get<SeatsResponse>(`/api/events/${eventId}/seats`),
        ])
        if (!active) return
        setEvent(eventRes.data?._id ? eventRes.data : eventRes.data)
        setRows(seatsRes.data?.rows ?? {})
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [eventId])

  // Realtime seat updates
  useEffect(() => {
    if (!eventId) return
    joinEventRoom(eventId)
    onSeatUpdated(({ seatId, status, rowLabel }) => {
      setRows((prev) => {
        const next = { ...prev }
        const list = next[rowLabel]
        if (!list) return prev
        next[rowLabel] = list.map((s) =>
          getSeatId(s) === seatId
            ? { ...s, status: status as Seat['status'] }
            : s,
        )
        return next
      })
  
      setSelectedSeats((prev) =>
        status !== 'available' ? prev.filter((id) => id !== seatId) : prev,
      )
    })
    return () => {
      offSeatUpdated()
      leaveEventRoom(eventId)
    }
  }, [eventId])

  const handleSeatClick = useCallback(
    (seatId: string) => {
      if (locked) return
      setSelectedSeats((prev) => {
        if (prev.includes(seatId)) {
          return prev.filter((id) => id !== seatId)
        }
        if (prev.length >= MAX_SEATS) {
          toast.warning(`You can select up to ${MAX_SEATS} seats`)
          return prev
        }
        return [...prev, seatId]
      })
    },
    [locked],
  )

  const seatLabels = selectedSeats.map((id) => {
    for (const list of Object.values(rows)) {
      const found = list.find((s) => getSeatId(s) === id)
      if (found) return seatLabel(found)
    }
    return id
  })

  const releaseLocks = useCallback(async () => {
    if (selectedSeats.length === 0) return
    try {
      await api.delete('/api/seats/lock-many', {
        data: { seatIds: selectedSeats, eventId },
      })
    } catch {
      // best-effort release
    }
  }, [selectedSeats, eventId])

  const handleConfirm = async () => {
    if (selectedSeats.length === 0) return
    if (locked) {
      setShowPayment(true)
      return
    }
    setConfirming(true)
    try {
      const { data } = await api.post('/api/seats/lock-many', {
        seatIds: selectedSeats,
        eventId,
      })
      const secret = data.clientSecret ?? data.client_secret
      setClientSecret(secret ?? null)
      setLocked(true)
      setShowPayment(true)
      toast.success('Seats reserved. Complete payment within 5 minutes.')
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Could not reserve these seats. They may have just been taken.',
      )
    } finally {
      setConfirming(false)
    }
  }

  const handlePaymentSuccess = () => {
    setShowPayment(false)
    toast.success('Payment successful! Booking confirmed.')
    router.push('/bookings')
  }

  const handlePaymentCancel = async () => {
    setShowPayment(false)
    await releaseLocks()
    setLocked(false)
    setClientSecret(null)
    toast.info('Payment cancelled. Your seat hold was released.')
  }

  const handleExpire = useCallback(async () => {
    await releaseLocks()
    setLocked(false)
    setShowPayment(false)
    setClientSecret(null)
    setSelectedSeats([])
    toast.error('Your reservation expired and the seats were released.')
  }, [releaseLocks])

  const price = event?.pricePerSeat ?? event?.price ?? 0

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-muted-foreground hover:text-foreground"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Button>

        {loading && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-xl border border-border bg-card p-6">
              <Skeleton className="mx-auto h-8 w-full max-w-2xl" />
              <div className="mt-6 flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
            <AlertCircle className="h-8 w-8 text-danger" />
            <p className="text-sm text-muted-foreground">
              Could not load this event. Please try again.
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-xl border border-border bg-card p-6">
              <SeatMap
                seats={rows}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
                lockedByMe={locked ? selectedSeats : []}
              />
            </div>

            <div className="lg:sticky lg:top-20 lg:self-start">
              <BookingSummary
                event={event}
                selectedSeats={selectedSeats}
                seatLabels={seatLabels}
                onConfirm={handleConfirm}
                loading={confirming}
                locked={locked}
                expiresIn={locked ? LOCK_DURATION : null}
                onExpire={handleExpire}
              />
            </div>
          </div>
        )}
      </div>

      <PaymentModal
        open={showPayment}
        clientSecret={clientSecret}
        amount={price * selectedSeats.length}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    </main>
  )
}
