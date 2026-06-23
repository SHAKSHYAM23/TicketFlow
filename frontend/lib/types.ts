export interface EventItem {
  _id: string
  id?: string
  title: string
  venue: string
  date: string
  pricePerSeat: number
  price?: number
  totalSeats?: number
  availableSeats?: number
  imageUrl?: string
  description?: string
}

export type SeatStatus = 'available' | 'booked' | 'locked'

export interface Seat {
  _id: string
  id?: string
  rowLabel: string
  seatNumber: number
  status: SeatStatus
  label?: string
}

export interface SeatsResponse {
  rows: Record<string, Seat[]>
  event?: EventItem
}

export interface Booking {
  _id: string
  id?: string
  bookingRef?: string
  event?: EventItem
  eventTitle?: string
  venue?: string
  date?: string
  seats: { rowLabel: string; seatNumber: number; label?: string }[] | string[]
  seatLabels?: string[]
  amount: number
  status: 'confirmed' | 'pending' | string
  emailSent?: boolean
  createdAt?: string
}

export interface VerifyResult {
  valid: boolean
  alreadyScanned?: boolean
  scannedAt?: string
  userName?: string
  eventName?: string
  seats?: string[]
  reason?: string
  message?: string
}
