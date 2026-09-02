'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('artbit-theme')
    if (saved === 'dark') setDarkMode(true)
    init()
  }, [])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('artbit-theme', next ? 'dark' : 'light')
  }

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (!user) {
      setLoading(false)
      return
    }
    await fetchCart(user.id)
  }

  const fetchCart = async (userId) => {
    const { data } = await supabase
      .from('cart')
      .select('*, products(*)')
      .eq('user_id', userId)
    setItems(data || [])
    setLoading(false)
  }

  const updateQty = async (id, qty) => {
    if (qty < 1) return
    await supabase.from('cart').update({ quantity: qty }).eq('id', id)
    if (user) fetchCart(user.id)
  }

  const removeItem = async (id) => {
    await supabase.from('cart').delete().eq('id', id)
    if (user) fetchCart(user.id)
  }

  const total = items.reduce((sum, item) => {
    const price = Number(item.products?.price || 0)
    return sum + price * (item.quantity || 1)
  }, 0)

  const bg = darkMode ? 'bg-[#1b1b18]' : 'bg-[#f2ede1]'
  const text = darkMode ? 'text-[#f2ede1]' : 'text-[#1b1b18]'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const card = darkMode ? 'bg-[#252522] border-[#f2ede1]/10' : 'bg-white border-[#1b1b18]/10'
  const border = darkMode ? 'border-[#f2ede1]/15' : 'border-[#1b1b18]/15'
  const iconCls = `p-1.5 transition opacity-80 hover:opacity-100 ${
    darkMode ? 'hover:text-[#e2a233]' : 'hover:text-[#2c6660]'
  }`

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      <header className={`border-b ${border} sticky top-0 ${bg} z-50`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0 flex items-center">
            <img src="/logo.png" alt="Artbit" className="h-8 sm:h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/wishlist" className={iconCls} aria-label="Wishlist" title="Wishlist">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </Link>
            <Link href="/cart" className={iconCls} aria-label="Cart" title="Cart">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </Link>
            <Link href="/account" className={iconCls} aria-label="My Orders" title="My Orders">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </Link>
            <button onClick={toggleTheme} className={iconCls} aria-label="Theme" title={darkMode ? 'Light' : 'Dark'}>
              {darkMode ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
        <h1 className="text-3xl font-black uppercase mb-8">Your Cart</h1>

        {loading ? (
          <p className="font-mono text-sm">Loading...</p>
        ) : !user ? (
          <div className={`${card} border p-8 text-center`}>
            <p className={`${muted} mb-4`}>Please login to view your cart.</p>
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } })}
              className="bg-[#1b1b18] text-[#f2ede1] px-6 py-3 font-mono text-xs uppercase"
            >
              Continue with Google
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className={`${card} border p-8 text-center`}>
            <p className={`${muted} mb-4`}>Your cart is empty.</p>
            <Link href="/shop" className="underline text-sm">Browse products →</Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {items.map(item => (
                <div key={item.id} className={`${card} border p-4 flex gap-4 items-center`}>
                  <div className="w-20 h-24 shrink-0 overflow-hidden bg-[#e9e1d1]">
                    {item.products?.image_url && (
                      <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold uppercase text-sm">{item.products?.name}</p>
                    <p className={`text-xs ${muted} mt-0.5`}>Size: {item.size || '—'}</p>
                    <p className="font-mono text-[#2c6660] mt-1">₹{Number(item.products?.price || 0).toLocaleString('en-IN')}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button type="button" onClick={() => updateQty(item.id, (item.quantity || 1) - 1)} className="w-8 h-8 border text-sm">−</button>
                      <span className="font-mono text-sm w-6 text-center">{item.quantity || 1}</span>
                      <button type="button" onClick={() => updateQty(item.id, (item.quantity || 1) + 1)} className="w-8 h-8 border text-sm">+</button>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-red-600 underline shrink-0">Remove</button>
                </div>
              ))}
            </div>

            <div className={`${card} border p-5`}>
              <div className="flex justify-between mb-4">
                <span className="font-semibold">Total</span>
                <span className="font-mono text-lg text-[#2c6660]">₹{total.toLocaleString('en-IN')}</span>
              </div>
              <button
                type="button"
                onClick={() => router.push('/checkout')}
                className="w-full bg-[#2c6660] text-white py-3.5 font-mono text-xs uppercase tracking-wider"
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}