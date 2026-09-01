'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const [cart, setCart] = useState([])
  const [user, setUser] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    address: ''
  })
  const router = useRouter()

  useEffect(() => {
    const raw = sessionStorage.getItem('artbit-checkout-cart')
    if (raw) {
      try { setCart(JSON.parse(raw)) } catch { setCart([]) }
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        setForm(f => ({
          ...f,
          customer_email: user.email || '',
          customer_name: user.user_metadata?.full_name || user.user_metadata?.name || ''
        }))
      }
    })
  }, [])

  const total = cart.reduce((sum, item) => sum + (Number(item.product?.price || 0) * item.quantity), 0)

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePay = async (e) => {
    e.preventDefault()
    if (cart.length === 0) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total })
      })
      const razorpayOrder = await res.json()
      if (!razorpayOrder.id) throw new Error(razorpayOrder.error || 'Payment failed')

      await loadRazorpayScript()

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'Artbit',
        description: 'Cart Order',
        order_id: razorpayOrder.id,
        handler: async function () {
          try {
            const { data: order, error } = await supabase
              .from('orders')
              .insert([{
                customer_name: form.customer_name,
                customer_email: form.customer_email,
                customer_phone: form.customer_phone,
                address: form.address,
                total_amount: total,
                status: 'paid',
                user_id: user?.id || null
              }])
              .select()
              .single()

            if (error) throw error

            for (const item of cart) {
              await supabase.from('order_items').insert([{
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.product?.price,
                size: item.size
              }])
            }

            // Clear cart
            if (user) {
              await supabase.from('cart').delete().eq('user_id', user.id)
            }
            sessionStorage.removeItem('artbit-checkout-cart')

            alert('Payment successful! Order placed.')
            router.push('/account')
          } catch (err) {
            alert('Order save failed: ' + err.message)
          }
        },
        prefill: {
          name: form.customer_name,
          email: form.customer_email,
          contact: form.customer_phone
        },
        theme: { color: '#2c6660' }
      }
      new window.Razorpay(options).open()
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#f2ede1] text-[#1b1b18]">
      <header className="border-b border-[#1b1b18]/20 sticky top-0 bg-[#f2ede1] z-50">
        <div className="max-w-6xl mx-auto px-5 py-4 flex justify-between">
          <Link href="/" className="font-black text-xl uppercase">Artbit</Link>
          <Link href="/cart" className="text-xs font-mono uppercase hover:underline">← Cart</Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-black uppercase mb-8">Checkout</h1>

        {cart.length === 0 ? (
          <p className="text-gray-600">No items. <Link href="/cart" className="underline">Go to cart</Link></p>
        ) : (
          <>
            <div className="bg-white border border-[#1b1b18]/15 p-4 mb-6 space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product?.name} × {item.quantity} ({item.size})</span>
                  <span className="font-mono">₹{(Number(item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="font-mono text-[#2c6660]">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Full Name *</label>
                <input required value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="w-full border-b border-gray-300 py-2 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Email *</label>
                <input required type="email" value={form.customer_email} onChange={e => setForm({...form, customer_email: e.target.value})} className="w-full border-b border-gray-300 py-2 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Phone *</label>
                <input required value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} className="w-full border-b border-gray-300 py-2 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Delivery Address *</label>
                <textarea required value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border border-gray-300 p-2 mt-1 outline-none bg-transparent" rows={3} />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-[#2c6660] text-white py-3 font-mono text-sm uppercase disabled:opacity-50">
                {submitting ? 'Processing...' : `Pay ₹${total.toLocaleString('en-IN')}`}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  )
}