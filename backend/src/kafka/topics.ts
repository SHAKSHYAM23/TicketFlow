export const TOPICS = {
  BOOKING_INITIATED:       'booking.initiated',
  PAYMENT_CONFIRMED:       'payment.confirmed',
  PAYMENT_FAILED:          'payment.failed',
  SEAT_LOCK_EXPIRED:       'seat.lock.expired',
  NOTIFICATION_REQUESTED:  'notification.requested'
} as const


export type Topic = typeof TOPICS[keyof typeof TOPICS]