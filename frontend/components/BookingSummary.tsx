'use client'

import { Loader2, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Timer from '@/components/Timer'
import { formatINR, formatEventDate } from '@/lib/format'
import type { EventItem } from '@/lib/types'

interface BookingSummaryProps {
  event: EventItem | null
  selectedSeats: string[]
  seatLabels: string[]
  onConfirm: () => void
  loading: boolean
  /** Provided once seats are locked — shows the countdown timer */
  expiresIn?: number | null
  onExpire?: () => void
  locked?: boolean
}

export default function BookingSummary({
  event,
  selectedSeats,
  seatLabels,
  onConfirm,
  loading,
  expiresIn,
  onExpire,
  locked,
}: BookingSummaryProps) {
  const price = event?.pricePerSeat ?? event?.price ?? 0
  const total = price * selectedSeats.length
  const hasSeats = selectedSeats.length > 0

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold leading-snug text-card-foreground">
          {event?.title ?? 'Booking summary'}
        </h2>
        {event && (
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {event.venue}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatEventDate(event.date)}
            </span>
          </div>
        )}
      </div>

      <Separator />

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Selected seats
        </p>
        {hasSeats ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {seatLabels.map((label) => (
              <span
                key={label}
                className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
              >
                {label}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No seats selected yet. Tap available (green) seats to add them.
          </p>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>
            {formatINR(price)} × {selectedSeats.length}{' '}
            {selectedSeats.length === 1 ? 'seat' : 'seats'}
          </span>
          <span>{formatINR(total)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold text-card-foreground">
          <span>Total</span>
          <span>{formatINR(total)}</span>
        </div>
      </div>

      {locked && typeof expiresIn === 'number' && onExpire && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Seats reserved. Complete payment before the timer runs out.
          </p>
          <Timer seconds={expiresIn} onExpire={onExpire} />
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={!hasSeats || loading}
        onClick={onConfirm}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {locked ? 'Proceed to payment' : 'Confirm Booking'}
      </Button>
    </div>
  )
}
