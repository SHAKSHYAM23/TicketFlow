import http from 'k6/http'
import { sleep, check, group } from 'k6'
import { Counter, Trend, Rate } from 'k6/metrics'
import exec from 'k6/execution' // ─── NEW: Imported execution module

// ─── Config ───────────────────────────────────────────
const BASE_URL      = 'http://localhost:8000'
const TEST_EMAIL    = 'rahul@test.com'
const TEST_PASSWORD = 'Test@123'

// ─── Custom metrics ───────────────────────────────────
const seatLockErrors   = new Counter('seat_lock_errors')
const seatLockDuration = new Trend('seat_lock_duration_ms')
const lockSuccessRate  = new Rate('lock_success_rate')

// ─── Test configuration ───────────────────────────────
export let options = {
  stages: [
    { duration: '20s', target: 50   },  // warm up
    { duration: '30s', target: 100  },  // ramp up
    { duration: '30s', target: 300  },  // increase
    { duration: '60s', target: 500  },  // steady load
    { duration: '60s', target: 1000 },  // peak load — screenshot here
    { duration: '20s', target: 0    },  // ramp down
  ],
  thresholds: {
    http_req_duration:     ['p(95)<2000'],
    http_req_failed:       ['rate<0.1'],
    seat_lock_duration_ms: ['p(95)<1000'],
    lock_success_rate:     ['rate>0.05'],
  }
}

// ─── Setup — runs once before test ────────────────────
export function setup() {

  // login to get token
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email:    TEST_EMAIL,
      password: TEST_PASSWORD
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )

  const loginOk = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received':   (r) => r.json('token') !== null
  })

  if (!loginOk) {
    console.error('Login failed — check your backend is running on port 8000')
    return {}
  }

  const token = loginRes.json('token')

  // get all events
  const eventsRes = http.get(`${BASE_URL}/api/events`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  const events = eventsRes.json()

  if (!events || events.length === 0) {
    console.error('No events found — create events in Postman first')
    return {}
  }

  // pick the event with the most seats — your load test event
  const event = events.reduce((max, e) =>
    (e.totalSeats ?? 0) > (max.totalSeats ?? 0) ? e : max
  )

  const eventId = event.id

  // get all seats for that event
  const seatsRes = http.get(
    `${BASE_URL}/api/events/${eventId}/seats`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  const seatsData = seatsRes.json()

  // flatten rows into one array of available seat IDs
  const availableSeatIds = Object.values(seatsData.rows ?? {})
    .flat()
    .filter((seat) => seat.status === 'available')
    .map((seat) => seat.id)

  console.log(`─────────────────────────────────`)
  console.log(`Event:           ${event.title}`)
  console.log(`Event ID:        ${eventId}`)
  console.log(`Available seats: ${availableSeatIds.length}`)
  console.log(`─────────────────────────────────`)

  if (availableSeatIds.length === 0) {
    console.error('No available seats — reset your database and create a fresh event')
    return {}
  }

  return { token, eventId, availableSeatIds }
}

// ─── Main test function — runs for every virtual user ─
export default function (data) {

  if (!data.token || !data.eventId || !data.availableSeatIds) {
    console.error('Setup failed — skipping iteration')
    return
  }

  // ─── NEW: Create a unique ID for every virtual user ───
  // This stops Redis from thinking 1,000 people are all "Rahul"
  const virtualUserId = `test-user-${exec.vu.idInTest}`

  const headers = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${data.token}`,
    'x-test-user-id': virtualUserId // ─── NEW: Inject the unique ID here
  }

  // ── Group 1 — Browse events ──────────────────────────
  group('browse events', () => {
    const res = http.get(`${BASE_URL}/api/events`, { headers })

    check(res, {
      'events 200':      (r) => r.status === 200,
      'events is array': (r) => Array.isArray(r.json())
    })
  })

  sleep(1)

  // ── Group 2 — View seat map ──────────────────────────
  group('view seat map', () => {
    const res = http.get(
      `${BASE_URL}/api/events/${data.eventId}/seats`,
      { headers }
    )

    check(res, {
      'seats 200':         (r) => r.status === 200,
      'seats response ok': (r) => r.timings.duration < 2000
    })
  })

  sleep(1)

  // ── Group 3 — Seat lock stampede (most important) ────
  group('seat lock stampede', () => {

    // each virtual user picks a random seat
    const randomIndex = Math.floor(
      Math.random() * data.availableSeatIds.length
    )
    const seatId = data.availableSeatIds[randomIndex]

    const start = Date.now()

    const res = http.post(
      `${BASE_URL}/api/seats/lock-many`,
      JSON.stringify({
        seatIds: [seatId],
        eventId: data.eventId
      }),
      { headers }
    )

    seatLockDuration.add(Date.now() - start)

    const ok = check(res, {
      'lock response valid': (r) =>
        r.status === 200 ||
        r.status === 409 ||
        r.status === 400
    })

    lockSuccessRate.add(res.status === 200)

    if (!ok) {
      seatLockErrors.add(1)
      console.error(`Unexpected lock error: ${res.status}`)
    }
  })

  sleep(2)

  // ── Group 4 — View my bookings ───────────────────────
  group('view bookings', () => {
    const res = http.get(`${BASE_URL}/api/bookings/me`, { headers })

    check(res, {
      'bookings 200': (r) => r.status === 200
    })
  })

  sleep(1)
}

// ─── Teardown — runs once after test ──────────────────
export function teardown(data) {
  console.log('─────────────────────────────────')
  console.log('Load test complete')
  console.log(`Event tested:  ${data.eventId}`)
  console.log(`Total seats:   ${data.availableSeatIds?.length}`)
  console.log('Check Grafana: http://localhost:3001')
  console.log('─────────────────────────────────')
}