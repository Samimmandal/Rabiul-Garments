import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export async function POST(request) {
  try {
    const body = await request.json()
    const { amount, currency = 'INR' } = body

    const options = {
      amount: Math.round(amount * 100), // Razorpay takes amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json(order)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}