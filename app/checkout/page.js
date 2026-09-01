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
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
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

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.product?.price || 0) * item.quantity), 0)

  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_percent
      ? Math.round(subtotal * (appliedCoupon.discount_percent / 100))
      : (appliedCoupon.discount_amount || 0)
    : 0

  const total = Math.max(0, subtotal - discountAmount)

  const applyCoupon = async () => {
    setCouponError('')
    if (!couponCode.trim()) {
      setCouponError('Enter a coupon code')
      return
    }
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (error || !data) {
      setAppliedCoupon(null)
      setCouponError('Invalid or expired coupon')
      return
    }
    setAppliedCoupon(data)
    setCouponError('')
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const loadRazorpayScript = () => new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const saveOrder = async (status) => {
    const { data: order, error } = await supabase
      .from('orders')
      .insert([{
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        address: form.address,
        total_amount: total,
        status: status,
        user_id: user?.id || null,
        tracking_note: appliedCoupon ? `Coupon: ${appliedCoupon.code}` : null
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

    if (user) {
      await supabase.from('cart').delete().eq('user_id', user.id)
    }
    sessionStorage.removeItem('artbit-checkout-cart')
    return order
  }

  const handlePayOnline = async (e) => {
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
            await saveOrder('paid')
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

  const handleCOD = async (e) => {
    e.preventDefault()
    if (cart.length === 0) return
    if (!confirm('Place order with Cash on Delivery?')) return
    setSubmitting(true)
    try {
      await saveOrder('cod')
      alert('COD order placed! Pay when you receive the product.')
      router.push('/account')
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
              <div className="border-t pt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-[#2c6660]">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span className="font-mono">−₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base pt-1">
                  <span>Total</span>
                  <span className="font-mono text-[#2c6660]">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white border border-[#1b1b18]/15 p-4 mb-6">
              <p className="text-xs font-mono uppercase text-gray-500 mb-2">Coupon Code</p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-[#2c6660] font-bold">{appliedCoupon.code} applied</p>
                  <button type="button" onClick={removeCoupon} className="text-xs underline text-red-600">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ARTBIT10"
                    className="flex-1 border border-gray-300 px-3 py-2 text-sm outline-none uppercase"
                  />
                  <button type="button" onClick={applyCoupon} className="bg-[#1b1b18] text-white px-4 py-2 text-xs font-mono uppercase">
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-600 mt-1">{couponError}</p>}
            </div>

            <form className="space-y-4">
              <input required placeholder="Full Name *" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="w-full border-b border-gray-300 py-2 outline-none bg-transparent" />
              <input required type="email" placeholder="Email *" value={form.customer_email} onChange={e => setForm({...form, customer_email: e.target.value})} className="w-full border-b border-gray-300 py-2 outline-none bg-transparent" />
              <input required placeholder="Phone *" value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} className="w-full border-b border-gray-300 py-2 outline-none bg-transparent" />
              <textarea required placeholder="Delivery Address *" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border border-gray-300 p-2 outline-none bg-transparent" rows={3} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <button
                  type="button"
                  disabled={submitting || !form.customer_name || !form.customer_email || !form.customer_phone || !form.address}
                  onClick={handlePayOnline}
                  className="bg-[#2c6660] text-white py-3.5 font-mono text-sm uppercase disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : `Pay Online ₹${total.toLocaleString('en-IN')}`}
                </button>
                <button
                  type="button"
                  disabled={submitting || !form.customer_name || !form.customer_email || !form.customer_phone || !form.address}
                  onClick={handleCOD}
                  className="border border-[#1b1b18] py-3.5 font-mono text-sm uppercase disabled:opacity-50 hover:bg-[#1b1b18] hover:text-white transition"
                >
                  {submitting ? 'Processing...' : 'Cash on Delivery'}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  )
}