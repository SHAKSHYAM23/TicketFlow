'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { MapPin, Calendar, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import {
  formatINR,
  formatEventDate,
  bookingSeatLabels,
} from '@/lib/format'
import type { Booking } from '@/lib/types'

interface BookingCardProps {
  booking: Booking
}

export default function BookingCard({ booking }: BookingCardProps) {
  const router = useRouter()
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const id = booking._id ?? booking.id ?? ''
  const title = booking.event?.title ?? booking.eventTitle ?? 'Event'
  const venue = booking.event?.venue ?? booking.venue ?? '—'
  const date = booking.event?.date ?? booking.date
  const seats = bookingSeatLabels(booking)
  const status = (booking.status ?? '').toLowerCase()

  const statusStyle =
    status === 'confirmed'
      ? 'bg-success/15 text-success'
      : 'bg-warning/15 text-warning'

  const handleResend = async () => {
    setResending(true)
    try {
      await api.post(`/api/bookings/${id}/resend-email`)
      setResent(true)
      toast.success('Email resent')
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Could not resend the email.',
      )
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-balance text-lg font-semibold leading-snug text-card-foreground">
          {title}
        </h3>
        <Badge className={`shrink-0 capitalize ${statusStyle} hover:${statusStyle}`}>
          {booking.status ?? 'pending'}
        </Badge>
      </div>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {venue}
        </span>
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {formatEventDate(date)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
        <div>
          <span className="text-xs text-muted-foreground">Seats</span>
          <p className="font-medium text-card-foreground">
            {seats.length ? seats.join(', ') : '—'}
          </p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Amount paid</span>
          <p className="font-medium text-card-foreground">
            {formatINR(booking.amount)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push(`/bookings/${id}`)}
        >
          View Details
        </Button>
        <Button
          variant="ghost"
          className="flex-1 text-muted-foreground hover:text-foreground"
          onClick={handleResend}
          disabled={resending || resent}
        >
          {resending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : resent ? (
            <Check className="h-4 w-4 text-success" />
          ) : null}
          {resent ? 'Email resent' : 'Resend Email'}
        </Button>
      </div>
    </div>
  )
}
