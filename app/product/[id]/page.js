'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function ProductDetails() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    address: '',
    quantity: 1
  })

  useEffect(() => {
    if (id) fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      setProduct(null)
    } else {
      setProduct(data)
      if (data.sizes) {
        const sizes = data.sizes.split(',').map(s => s.trim())
        setSelectedSize(sizes[0] || '')
      }
    }
    setLoading(false)
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleOrderSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const totalAmount = product.price * orderForm.quantity

      // 1. Create Razorpay Order
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount })
      })

      const razorpayOrder = await res.json()

      if (!razorpayOrder.id) {
        throw new Error(razorpayOrder.error || 'Failed to create payment order')
      }

      // 2. Load Razorpay
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load')
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Artbit',
        description: product.name,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          // Payment successful → Save order to database
          try {
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .insert([{
                customer_name: orderForm.customer_name,
                customer_email: orderForm.customer_email,
                customer_phone: orderForm.customer_phone,
                address: orderForm.address,
                total_amount: totalAmount,
                status: 'paid'
              }])
              .select()
              .single()

            if (orderError) throw orderError

            await supabase.from('order_items').insert([{
              order_id: order.id,
              product_id: product.id,
              quantity: orderForm.quantity,
              price: product.price,
              size: selectedSize
            }])

            alert('Payment successful! Order placed.')
            setShowOrderForm(false)
            setOrderForm({
              customer_name: '',
              customer_email: '',
              customer_phone: '',
              address: '',
              quantity: 1
            })
          } catch (err) {
            alert('Payment done but order save failed: ' + err.message)
          }
        },
        prefill: {
          name: orderForm.customer_name,
          email: orderForm.customer_email,
          contact: orderForm.customer_phone
        },
        theme: {
          color: '#2c6660'
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      alert('Error: ' + err.message)
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2ede1] flex items-center justify-center">
        <p className="font-mono text-sm">Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f2ede1] flex flex-col items-center justify-center gap-4">
        <p className="font-mono">Product not found</p>
        <Link href="/shop" className="text-sm underline">← Back to Shop</Link>
      </div>
    )
  }

  const sizes = product.sizes ? product.sizes.split(',').map(s => s.trim()) : []

  return (
    <div className="min-h-screen bg-[#f2ede1] text-[#1b1b18]">
      <header className="border-b border-[#1b1b18]/20 sticky top-0 bg-[#f2ede1] z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl uppercase tracking-tight">Artbit</Link>
          <Link href="/shop" className="text-xs font-mono uppercase hover:underline">← Back to Shop</Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          <div className="aspect-[4/5] bg-[#e9e1d1] relative overflow-hidden border border-[#1b1b18]/10">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-mono text-gray-400">No image</div>
            )}
            {product.tag && (
              <span className="absolute top-4 left-4 bg-[#1b1b18] text-[#f2ede1] text-[10px] font-mono uppercase tracking-wider px-2.5 py-1">
                {product.tag}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase leading-tight mb-3">
              {product.name}
            </h1>
            <p className="font-mono text-2xl text-[#2c6660] mb-6">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </p>

            {product.description && (
              <p className="text-[#4a453d] leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            {sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-mono uppercase text-gray-500 mb-2">Select Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 text-sm font-mono border transition ${
                        selectedSize === size
                          ? 'bg-[#1b1b18] text-[#f2ede1] border-[#1b1b18]'
                          : 'border-[#1b1b18]/30 hover:border-[#1b1b18]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs font-mono text-gray-500 mb-8">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>

            <button
              onClick={() => setShowOrderForm(true)}
              disabled={product.stock <= 0}
              className="w-full sm:w-auto bg-[#1b1b18] text-[#f2ede1] px-8 py-4 font-mono text-sm uppercase tracking-wider hover:bg-transparent hover:text-[#1b1b18] border border-[#1b1b18] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Order Now
            </button>
          </div>
        </div>
      </section>

      {showOrderForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#f2ede1] w-full max-w-md p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase">Place Order</h2>
              <button onClick={() => setShowOrderForm(false)} className="text-sm font-mono hover:underline">
                Close
              </button>
            </div>

            <div className="mb-6 p-3 bg-white border border-[#1b1b18]/10 text-sm">
              <p className="font-semibold">{product.name}</p>
              <p className="text-gray-500">Size: {selectedSize || '—'} · Qty: {orderForm.quantity}</p>
              <p className="font-mono text-[#2c6660] mt-1">
                Total: ₹{(product.price * orderForm.quantity).toLocaleString('en-IN')}
              </p>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Full Name *</label>
                <input
                  required
                  value={orderForm.customer_name}
                  onChange={e => setOrderForm({...orderForm, customer_name: e.target.value})}
                  className="w-full border-b border-gray-300 py-2 outline-none bg-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Email *</label>
                <input
                  required
                  type="email"
                  value={orderForm.customer_email}
                  onChange={e => setOrderForm({...orderForm, customer_email: e.target.value})}
                  className="w-full border-b border-gray-300 py-2 outline-none bg-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Phone *</label>
                <input
                  required
                  value={orderForm.customer_phone}
                  onChange={e => setOrderForm({...orderForm, customer_phone: e.target.value})}
                  className="w-full border-b border-gray-300 py-2 outline-none bg-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Delivery Address *</label>
                <textarea
                  required
                  value={orderForm.address}
                  onChange={e => setOrderForm({...orderForm, address: e.target.value})}
                  className="w-full border border-gray-300 p-2 mt-1 outline-none bg-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock || 10}
                  value={orderForm.quantity}
                  onChange={e => setOrderForm({...orderForm, quantity: parseInt(e.target.value) || 1})}
                  className="w-full border-b border-gray-300 py-2 outline-none bg-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#2c6660] text-white py-3 font-mono text-sm uppercase tracking-wider disabled:opacity-50 mt-2"
              >
                {submitting ? 'Processing...' : 'Pay Now'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}