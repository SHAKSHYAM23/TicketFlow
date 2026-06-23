import { producer } from '../config/kafka.js'
import { TOPICS } from '../kafka/topics.js'
import { kafkaPublishCounter, kafkaErrorCounter } from '../config/metrics.js'


interface BookingInitiatedPayload {
  seatIds: string[]
  eventId: string
  userId: string
  totalAmount: number
}

interface PaymentConfirmedPayload {
  bookingId: string
  seatIds: string[]
  eventId: string
  userId: string
  totalAmount: number
  stripePaymentIntentId: string
}

interface PaymentFailedPayload {
  seatIds: string[]
  eventId: string
  userId: string
  reason: string
}

interface NotificationRequestedPayload {
  bookingId: string
  userId: string
  eventId: string
}

interface SeatLockExpiredPayload {
  seatId: string
  eventId: string
}


type KafkaPayload =
  | BookingInitiatedPayload
  | PaymentConfirmedPayload
  | PaymentFailedPayload
  | NotificationRequestedPayload
  | SeatLockExpiredPayload



export const publishEvent = async (
  topic: string,
  payload: KafkaPayload
): Promise<void> => {

  try {
    await producer.send({
      topic,
      messages: [
        {
        
          key: getMessageKey(topic, payload),
          value: JSON.stringify({
            ...payload,
            publishedAt: new Date().toISOString()
          })
        }
      ]
    })

    
    kafkaPublishCounter.inc({ topic })

    console.log(` Kafka event published → topic: ${topic}`)

  } catch (err) {
    kafkaErrorCounter.inc({ topic })
    console.error(` Kafka publish failed → topic: ${topic}`, err)
    throw err
  }
}

const getMessageKey = (
  topic: string,
  payload: KafkaPayload
): string => {

  switch (topic) {
    case TOPICS.BOOKING_INITIATED:
      return (payload as BookingInitiatedPayload).userId

    case TOPICS.PAYMENT_CONFIRMED:
    case TOPICS.NOTIFICATION_REQUESTED:
      return (payload as PaymentConfirmedPayload).bookingId

    case TOPICS.PAYMENT_FAILED:
      return (payload as PaymentFailedPayload).userId

    case TOPICS.SEAT_LOCK_EXPIRED:
      return (payload as SeatLockExpiredPayload).seatId

    default:
      return 'default'
  }
}



export const publishBookingInitiated = (
  payload: BookingInitiatedPayload
) => publishEvent(TOPICS.BOOKING_INITIATED, payload)

export const publishPaymentConfirmed = (
  payload: PaymentConfirmedPayload
) => publishEvent(TOPICS.PAYMENT_CONFIRMED, payload)

export const publishPaymentFailed = (
  payload: PaymentFailedPayload
) => publishEvent(TOPICS.PAYMENT_FAILED, payload)

export const publishNotificationRequested = (
  payload: NotificationRequestedPayload
) => publishEvent(TOPICS.NOTIFICATION_REQUESTED, payload)

export const publishSeatLockExpired = (
  payload: SeatLockExpiredPayload
) => publishEvent(TOPICS.SEAT_LOCK_EXPIRED, payload)