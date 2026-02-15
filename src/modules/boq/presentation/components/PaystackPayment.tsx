import React, { forwardRef, useImperativeHandle } from 'react'
import { usePaystackPayment } from 'react-paystack'

interface PaystackPaymentProps {
  config: any
  onSuccess: (reference: any) => void
  onClose: () => void
}

export interface PaystackPaymentRef {
  startPayment: () => void
}

const PaystackPayment = forwardRef<PaystackPaymentRef, PaystackPaymentProps>(({ config, onSuccess, onClose }, ref) => {
  const initializePayment = usePaystackPayment(config)

  useImperativeHandle(ref, () => ({
    startPayment: () => {
      initializePayment({
        onSuccess,
        onClose
      })
    }
  }))

  return null
})

PaystackPayment.displayName = 'PaystackPayment'

export default PaystackPayment
