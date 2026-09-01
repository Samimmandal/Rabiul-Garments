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
  const [user, setUser] = useState(null)
  const [cartLoading, setCartLoading] = useState(false)
  const [wishLoading, setWishLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('artbit-theme')
    if (saved === 'dark') setDarkMode(true)
    checkUser()
    if (id) {
      fetchProduct()
      fetchReviews()
    }
  }, [id])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

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

  const requireLogin = () => {
    if (!user) {
      alert('Please login first')
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
      })
      return false
    }
    return true
  }

  const addToCart = async () => {
    if (!requireLogin()) return
    setCartLoading(true)
    const { error } = await supabase.from('cart').upsert({
      user_id: user.id,
      product_id: parseInt(id),
      quantity: 1,
      size: selectedSize || 'M'
    }, { onConflict: 'user_id,product_id,size' })

    if (error) alert('Error: ' + error.message)
    else alert('Added to cart!')
    setCartLoading(false)
  }

  const addToWishlist = async () => {
    if (!requireLogin()) return
    setWishLoading(true)
    const { error } = await supabase.from('wishlist').upsert({
      user_id: user.id,
      product_id: parseInt(id)
    }, { onConflict: 'user_id,product_id' })

    if (error) alert('Error: ' + error.message)
    else alert('Added to wishlist!')
    setWishLoading(false)
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
    if (error) alert('Error: ' + error.message)
    else {
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
        handler: async function () {
          try {
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .insert([{
                customer_name: orderForm.customer_name,
                customer_email: orderForm.customer_email,
                customer_phone: orderForm.customer_phone,
                address: orderForm.address,
                total_amount: totalAmount,
                status: 'paid',
                user_id: user?.id || null
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
      new window.Razorpay(options).open()
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
          <div className="flex items-center gap-3 text-xs font-mono uppercase">
            <button onClick={toggleTheme} className={`border px-3 py-1.5 ${darkMode ? 'border-[#f2ede1]/40' : 'border-[#1b1b18]'}`}>
              {darkMode ? 'Light' : 'Dark'}
            </button>
            <Link href="/cart" className="hover:underline">Cart</Link>
            <Link href="/wishlist" className="hover:underline">Wishlist</Link>
            <Link href="/account" className="hover:underline">Orders</Link>
            <Link href="/shop" className="hover:underline">Shop</Link>
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
              <p className={`text-sm ${muted} mb-6`}>★ {avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</p>
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
                          : darkMode ? 'border-[#f2ede1]/30' : 'border-[#1b1b18]/30'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className={`text-xs font-mono ${muted} mb-6`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowOrderForm(true)}
                disabled={product.stock <= 0}
                className="bg-[#1b1b18] text-[#f2ede1] px-6 py-3 font-mono text-sm uppercase tracking-wider border border-[#1b1b18] disabled:opacity-40"
              >
                Buy Now
              </button>
              <button
                onClick={addToCart}
                disabled={cartLoading || product.stock <= 0}
                className={`border px-6 py-3 font-mono text-sm uppercase tracking-wider disabled:opacity-40 ${
                  darkMode ? 'border-[#f2ede1]/40' : 'border-[#1b1b18]'
                }`}
              >
                {cartLoading ? '...' : 'Add to Cart'}
              </button>
              <button
                onClick={addToWishlist}
                disabled={wishLoading}
                className={`border px-6 py-3 font-mono text-sm uppercase tracking-wider disabled:opacity-40 ${
                  darkMode ? 'border-[#f2ede1]/40' : 'border-[#1b1b18]'
                }`}
              >
                {wishLoading ? '...' : 'Wishlist'}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16 md:mt-20">
          <h2 className="text-2xl font-black uppercase mb-6">Reviews</h2>
          {reviews.length === 0 ? (
            <p className={`${muted} mb-8`}>No reviews yet.</p>
          ) : (
            <div className="space-y-4 mb-10">
              {reviews.map(r => (
                <div key={r.id} className={`${card} border p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{r.reviewer_name}</p>
                    <p className="text-sm text-[#2c6660]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                  </div>
                  {r.comment && <p className={`text-sm ${muted}`}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className={`${card} border p-5 space-y-4 max-w-lg`}>
            <h3 className="font-bold uppercase text-sm">Write a Review</h3>
            <div>
              <label className={`text-xs font-mono uppercase ${muted}`}>Your Name *</label>
              <input required value={reviewForm.reviewer_name} onChange={e => setReviewForm({...reviewForm, reviewer_name: e.target.value})} className={`w-full border-b py-2 outline-none bg-transparent ${darkMode ? 'border-[#f2ede1]/30' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`text-xs font-mono uppercase ${muted}`}>Rating *</label>
              <select value={reviewForm.rating} 