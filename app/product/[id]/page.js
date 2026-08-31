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
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ reviewer_name: '', rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('artbit-theme')
    if (saved === 'dark') setDarkMode(true)
  }, [])

  useEffect(() => {
    if (id) {
      fetchProduct()
      fetchReviews()
    }
  }, [id])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('artbit-theme', next ? 'dark' : 'light')
  }

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

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    setReviews(data || [])
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setSubmittingReview(true)

    const { error } = await supabase.from('reviews').insert([{
      product_id: parseInt(id),
      reviewer_name: reviewForm.reviewer_name,
      rating: parseInt(reviewForm.rating),
      comment: reviewForm.comment,
      is_approved: true
    }])

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setReviewForm({ reviewer_name: '', rating: 5, comment: '' })
      fetchReviews()
      alert('Review submitted!')
    }
    setSubmittingReview(false)
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

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount })
      })

      const razorpayOrder = await res.json()
      if (!razorpayOrder.id) throw new Error(razorpayOrder.error || 'Failed to create payment order')

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) throw new Error('Razorpay SDK failed to load')

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Artbit',
        description: product.name,
        order_id: razorpayOrder.id,
        handler: async function (response) {
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
          } catch (err) {
            alert('Payment done but order save failed: ' + err.message)
          }
        },
        prefill: {
          name: orderForm.customer_name,
          email: orderForm.customer_email,
          contact: orderForm.customer_phone
        },
        theme: { color: '#2c6660' }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setSubmitting(false)
  }

  const bg = darkMode ? 'bg-[#1b1b18]' : 'bg-[#f2ede1]'
  const text = darkMode ? 'text-[#f2ede1]' : 'text-[#1b1b18]'
  const card = darkMode ? 'bg-[#252522] border-[#f2ede1]/10' : 'bg-white border-[#1b1b18]/15'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'

  if (loading) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center`}>
        <p className={`font-mono text-sm ${text}`}>Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className={`min-h-screen ${bg} flex flex-col items-center justify-center gap-4`}>
        <p className={`font-mono ${text}`}>Product not found</p>
        <Link href="/shop" className="text-sm underline">← Back to Shop</Link>
      </div>
    )
  }

  const sizes = product.sizes ? product.sizes.split(',').map(s => s.trim()) : []
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      <header className={`border-b ${darkMode ? 'border-[#f2ede1]/15' : 'border-[#1b1b18]/20'} sticky top-0 ${bg} z-50`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl uppercase tracking-tight">Artbit</Link>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`text-[11px] font-mono uppercase border px-3 py-1.5 transition ${
                darkMode ? 'border-[#f2ede1]/40 hover:bg-[#f2ede1] hover:text-[#1b1b18]' : 'border-[#1b1b18] hover:bg-[#1b1b18] hover:text-[#f2ede1]'
              }`}
            >
              {darkMode ? 'Light' : 'Dark'}
            </button>
            <Link href="/shop" className="text-xs font-mono uppercase hover:underline">← Shop</Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          <div className={`aspect-[4/5] ${darkMode ? 'bg-[#2a2a27]' : 'bg-[#e9e1d1]'} relative overflow-hidden border ${darkMode ? 'border-[#f2ede1]/10' : 'border-[#1b1b18]/10'}`}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-mono opacity-50">No image</div>
            )}
            {product.tag && (
              <span className="absolute top-4 left-4 bg-[#1b1b18] text-[#f2ede1] text-[10px] font-mono uppercase tracking-wider px-2.5 py-1">
                {product.tag}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase leading-tight mb-3">{product.name}</h1>
            <p className="font-mono text-2xl text-[#2c6660] mb-2">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </p>
            {avgRating && (
              <p className={`text-sm ${muted} mb-6`}>
                ★ {avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </p>
            )}

            {product.description && (
              <p className={`${muted} leading-relaxed mb-8`}>{product.description}</p>
            )}

            {sizes.length > 0 && (
              <div className="mb-6">
                <p className={`text-xs font-mono uppercase ${muted} mb-2`}>Select Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 text-sm font-mono border transition ${
                        selectedSize === size
                          ? 'bg-[#1b1b18] text-[#f2ede1] border-[#1b1b18]'
                          : darkMode
                            ? 'border-[#f2ede1]/30 hover:border-[#f2ede1]'
                            : 'border-[#1b1b18]/30 hover:border-[#1b1b18]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className={`text-xs font-mono ${muted} mb-8`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>

            <button
              onClick={() => setShowOrderForm(true)}
              disabled={product.stock <= 0}
              className="w-full sm:w-auto bg-[#1b1b18] text-[#f2ede1] px-8 py-4 font-mono text-sm uppercase tracking-wider border border-[#1b1b18] hover:opacity-90 transition disabled:opacity-40"
            >
              Order Now
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 md:mt-20">
          <h2 className="text-2xl font-black uppercase mb-6">Reviews</h2>

          {reviews.length === 0 ? (
            <p className={`${muted} mb-8`}>No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-4 mb-10">
              {reviews.map(r => (
                <div key={r.id} className={`${card} border p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{r.reviewer_name}</p>
                    <p className="text-sm text-[#2c6660]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                  </div>
                  {r.comment && <p className={`text-sm ${muted}`}>{r.comment}</p>}
                  <p className="text-[11px] text-gray-500 mt-2">
                    {new Date(r.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Write Review */}
          <form onSubmit={handleReviewSubmit} className={`${card} border p-5 space-y-4 max-w-lg`}>
            <h3 className="font-bold uppercase text-sm">Write a Review</h3>
            <div>
              <label className={`text-xs font-mono uppercase ${muted}`}>Your Name *</label>
              <input
                required
                value={reviewForm.reviewer_name}
                onChange={e => setReviewForm({...reviewForm, reviewer_name: e.target.value})}
                className={`w-full border-b py-2 outline-none bg-transparent ${darkMode ? 'border-[#f2ede1]/30' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`text-xs font-mono uppercase ${muted}`}>Rating *</label>
              <select
                value={reviewForm.rating}
                onChange={e => setReviewForm({...reviewForm, rating: e.target.value})}
                className={`w-full border-b py-2 outline-none bg-transparent ${darkMode ? 'border-[#f2ede1]/30' : 'border-gray-300'}`}
              >
                {[5,4,3,2,1].map(n => (
                  <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`text-xs font-mono uppercase ${muted}`}>Comment</label>
              <textarea
                value={reviewForm.comment}
                onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                className={`w-full border p-2 mt-1 outline-none bg-transparent ${darkMode ? 'border-[#f2ede1]/30' : 'border-gray-300'}`}
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={submittingReview}
              className="bg-[#2c6660] text-white px-6 py-2 font-mono text-sm uppercase disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </section>

      {/* Order Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`${bg} w-full max-w-md p-6 md:p-8 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase">Place Order</h2>
              <button onClick={() => setShowOrderForm(false)} className="text-sm font-mono hover:underline">Close</button>
            </div>
            <div className={`${card} border p-3 text-sm mb-6`}>
              <p className="font-semibold">{product.name}</p>
              <p className={muted}>Size: {selectedSize || '—'} · Qty: {orderForm.quantity}</p>
              <p className="font-mono text-[#2c6660] mt-1">
                Total: ₹{(product.price * orderForm.quantity).toLocaleString('en-IN')}
              </p>
            </div>
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label className={`text-xs font-mono uppercase ${muted}`}>Full Name *</label>
                <input required value={orderForm.customer_name} onChange={e => setOrderForm({...orderForm, customer_name: e.target.value})} className={`w-full border-b py-2 outline-none bg-transparent ${darkMode ? 'border-[#f2ede1]/30' : 'border-gray-300'}`} />
              </div>
              <div>
                <label className={`text-xs font-mono uppercase ${muted}`}>Email *</label>
                <input required type="email" value={orderForm.customer_email} onChange={e => setOrderForm({...orderForm, customer_email: e.target.value})} className={`w-full border-b py-2 outline-none bg-transparent ${darkMode ? 'border-[#f2ede1]/30' : 'border-gray-300'}`} />
              </div>
              <div>
                <label className={`text-xs font-mono uppercase ${muted}`}>Phone *</label>
                <input required value={orderForm.customer_phone} onChange={e => setOrderForm({...orderForm, customer_phone: e.target.value})} className={`w-full border-b py-2 outline-none bg-transparent ${darkMode ? 'border-[#f2ede1]/30' : 'border-gray-300'}`} />
              </div>
              <div>
                <label className={`text-xs font-mono uppercase ${muted}`}>Delivery Address *</label>
                <textarea required value={orderForm.address} onChange={e => setOrderForm({...orderForm, address: e.target.value})} className={`w-full border p-2 mt-1 outline-none bg-transparent ${darkMode ? 'border-[#f2ede1]/30' : 'border-gray-300'}`} rows={3} />
              </div>
              <div>
                <label className={`text-xs font-mono uppercase ${muted}`}>Quantity</label>
                <input type="number" min="1" max={product.stock || 10} value={orderForm.quantity} onChange={e => setOrderForm({...orderForm, quantity: parseInt(e.target.value) || 1})} className={`w-full border-b py-2 outline-none bg-transparent ${darkMode ? 'border-[#f2ede1]/30' : 'border-gray-300'}`} />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-[#2c6660] text-white py-3 font-mono text-sm uppercase tracking-wider disabled:opacity-50 mt-2">
                {submitting ? 'Processing...' : 'Pay Now'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}