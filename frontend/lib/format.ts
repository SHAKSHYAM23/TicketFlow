export function formatINR(amount: number | undefined | null): string {
  const value = typeof amount === 'number' ? amount : 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatEventDate(date: string | undefined): string {
  if (!date) return 'Date TBA'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Date TBA'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(d)
}

export function formatTime(date: string | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(d)
}

export function seatLabel(seat: {
  rowLabel?: string
  seatNumber?: number
  label?: string
}): string {
  if (seat.label) return seat.label
  return `${seat.rowLabel ?? ''}${seat.seatNumber ?? ''}`
}

export function maskRef(ref: string | undefined): string {
  if (!ref) return '****'
  const tail = ref.slice(-8)
  return `****${tail}`
}

export function bookingSeatLabels(booking: {
  seats?: unknown
  seatLabels?: string[]
}): string[] {
  if (Array.isArray(booking.seatLabels) && booking.seatLabels.length) {
    return booking.seatLabels
  }
  const seats = booking.seats
  if (!Array.isArray(seats)) return []
  return seats.map((s) => {
    if (typeof s === 'string') return s
    if (s && typeof s === 'object') {
      return seatLabel(s as { rowLabel?: string; seatNumber?: number; label?: string })
    }
    return String(s)
  })
}
