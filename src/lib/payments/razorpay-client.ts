/**
 * @file razorpay-client.ts
 * @module payments
 * @description Lazy Razorpay SDK initializer shared by payment providers.
 * @author BharatERP
 * @created 2026-02-24
 */

import Razorpay from 'razorpay'

const razorpayKeyId = process.env.RAZORPAY_KEY_ID
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

export const isRazorpayConfigured = Boolean(razorpayKeyId && razorpayKeySecret)
export const isRazorpayPublicKeyConfigured = Boolean(
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || razorpayKeyId
)

let razorpayClient: Razorpay | null = null

export const getRazorpayClient = (): Razorpay => {
  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set')
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })
  }

  return razorpayClient
}
