'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2, ScanLine } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { isAdmin, isLoggedIn } from '@/lib/auth'
import { formatTime } from '@/lib/format'
import type { VerifyResult } from '@/lib/types'

export default function AdminVerifyPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [scannedAt, setScannedAt] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) {
      router.replace('/')
    } else {
      setAuthed(true)
    }
  }, [router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const { data } = await api.get<VerifyResult>(
        `/api/bookings/verify/${encodeURIComponent(value.trim())}`,
      )
      setResult(data)
      setScannedAt(new Date().toISOString())
    } catch (err: any) {
      setResult({
        valid: false,
        reason:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Ticket could not be verified.',
      })
      setScannedAt(new Date().toISOString())
    } finally {
      setLoading(false)
    }
  }

  if (authed === null) return null

  const valid = result?.valid

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex max-w-lg flex-col px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <ScanLine className="h-6 w-6 text-foreground" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Entrance Verification
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan or enter a booking ID to validate the ticket.
          </p>
        </div>

        <form
          onSubmit={handleVerify}
          className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="ticket">Booking ID or QR Code</Label>
            <Input
              id="ticket"
              placeholder="Enter booking ID..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading || !value.trim()}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify
          </Button>
        </form>

        {result && (
          <div
            className={`mt-6 rounded-xl border p-6 ${
              valid
                ? 'border-success/40 bg-success/10'
                : 'border-danger/40 bg-danger/10'
            }`}
          >
            <div className="flex items-center gap-3">
              {valid ? (
                <CheckCircle2 className="h-8 w-8 text-success" />
              ) : (
                <XCircle className="h-8 w-8 text-danger" />
              )}
              <p
                className={`text-xl font-semibold ${
                  valid ? 'text-success' : 'text-danger'
                }`}
              >
                {valid ? 'VALID TICKET' : 'INVALID TICKET'}
              </p>
            </div>

            {valid ? (
              <dl className="mt-5 flex flex-col gap-3 text-sm">
                <Row label="Name" value={result?.userName} />
                <Row label="Event" value={result?.eventName} />
                <Row
                  label="Seats"
                  value={result?.seats?.join(', ')}
                />
                <Row
                  label="Scanned at"
                  value={formatTime(result?.scannedAt ?? scannedAt ?? undefined)}
                />
              </dl>
            ) : (
              <div className="mt-5 flex flex-col gap-2 text-sm">
                {result?.alreadyScanned ? (
                  <p className="text-danger">
                    This ticket was already used at{' '}
                    {formatTime(result?.scannedAt)}
                  </p>
                ) : (
                  <Row
                    label="Reason"
                    value={
                      result?.reason ??
                      result?.message ??
                      'This ticket is not valid.'
                    }
                    danger
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function Row({
  label,
  value,
  danger,
}: {
  label: string
  value?: string
  danger?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`text-right font-medium ${
          danger ? 'text-danger' : 'text-foreground'
        }`}
      >
        {value ?? '—'}
      </dd>
    </div>
  )
}
