'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/format'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
)

interface PaymentModalProps {
  open: boolean
  clientSecret: string | null
  amount: number
  onSuccess: () => void
  onCancel: () => void
}

function CheckoutForm({
  amount,
  onSuccess,
  onCancel,
}: {
  amount: number
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    if (!stripe || !elements) return
    setProcessing(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Payment validation failed')
      setProcessing(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed')
      setProcessing(false)
      return
    }

    setProcessing(false)
    onSuccess()
  }

  return (
    <div className="flex flex-col gap-4">
      <PaymentElement />
      {error && (
        <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handlePay}
          disabled={!stripe || processing}
        >
          {processing && <Loader2 className="h-4 w-4 animate-spin" />}
          Pay {formatINR(amount)}
        </Button>
      </div>
    </div>
  )
}

export default function PaymentModal({
  open,
  clientSecret,
  amount,
  onSuccess,
  onCancel,
}: PaymentModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete your payment</DialogTitle>
          <DialogDescription>
            Your seats are reserved. Pay {formatINR(amount)} to confirm your
            booking.
          </DialogDescription>
        </DialogHeader>
        {clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: 'night', labels: 'floating' },
            }}
          >
            <CheckoutForm
              amount={amount}
              onSuccess={onSuccess}
              onCancel={onCancel}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
