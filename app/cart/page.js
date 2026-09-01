'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('artbit-theme')
    if (saved === 'dark') setDarkMode(true)
    init()
  }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (!user) {
      setLoading(false)
      return
    }
    fetchCart(user.id)
  }

  const fetchCart = async (userId) => {
    setLoading(true)
    const { data } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', userId)

    if (!data || data.length === 0) {
      setCart([])
      setLoading(false)
      return
    }

    const productIds = data.map(c => c.product_id)
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)

    const merged = data.map(c => ({
      ...c,
      product: products?.find(p => p.id === c.product_id) || null
    })).filter(c => c.product)

    setCart(merged)
    setLoading(false)
  }

  const updateQty = async (id, quantity) => {
    if (quantity < 1) return
    await supabase.from('cart').update({ quantity }).eq('id', id)
    if (user) fetchCart(user.id)
  }

  const removeItem = async (id) => {
    await supabase.from('cart').delete().eq('id', id)
    if (user) fetchCart(user.id)
  }

  const total = cart.reduce((sum, item) => sum + (Number(item.product?.price || 0) * item.quantity), 0)

  const handleCheckout = () => {
    if (cart.length === 0) return
    // Store cart for checkout page
    sessionStorage.setItem('artbit-checkout-cart', JSON.stringify(cart))
    router.push('/checkout')
  }

  const bg = darkMode ? 'bg-[#1b1b18]' : 'bg-[#f2ede1]'
  const text = darkMode ? 'text-[#f2ede1]' : 'text-[#1b1b18]'
  const card = darkMode ? 'bg-[#252522] border-[#f2ede1]/15' : 'bg-white border-[#1b1b18]/15'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-600'

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      <header className={`border-b ${darkMode ? 'border-[#f2ede1]/15' : 'border-[#1b1b18]/20'} sticky top-0 ${bg} z-50`}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl uppercase">Artbit</Link>
          <div className="flex gap-4 text-xs font-mono uppercase">
            <Link href="/wishlist" className="hover:underline">Wishlist</Link>
            <Link href="/account" className="hover:underline">My Orders</Link>
            <Link href="/shop" className="hover:underline">Shop</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-black uppercase mb-8">Your Cart</h1>

        {!user ? (
          <div className={`${card} border p-8 text-center`}>
            <p className={`${muted} mb-4`}>Please login to view your cart.</p>
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/cart' } })}
              className="bg-[#1b1b18] text-[#f2ede1] px-6 py-3 font-mono text-sm uppercase"
            >
              Login with Google
            </button>
          </div>
        ) : loading ? (
          <p className="font-mono text-sm">Loading...</p>
        ) : cart.length === 0 ? (
          <div className={`${card} border p-8 text-center`}>
            <p className={`${muted} mb-4`}>Your cart is empty.</p>
            <Link href="/shop" className="underline text-sm">Continue shopping →</Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {cart.map(item => (
                <div key={item.id} className={`${card} border p-4 flex gap-4 items-center`}>
                  <div className="w-20 h-24 bg-gray-200 shrink-0 overflow-hidden">
                    {item.product?.image_url && (
                      <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.product_id}`} className="font-semibold hover:underline">
                      {item.product?.name}
                    </Link>
                    <p className={`text-xs ${muted} mt-1`}>Size: {item.size || '—'}</p>
                    <p className="font-mono text-sm text-[#2c6660] mt-1">
                      ₹{Number(item.product?.price || 0).toLocaleString('en-IN')}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-8 h-8 border text-sm">−</button>
                      <span className="font-mono text-sm">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-8 h-8 border text-sm">+</button>
                      <button onClick={() => removeItem(item.id)} className="text-xs text-red-600 ml-auto underline">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`${card} border p-5 flex flex-col sm:flex-row justify-between items-center gap-4`}>
              <p className="font-mono text-lg">
                Total: <span className="text-[#2c6660] font-bold">₹{total.toLocaleString('en-IN')}</span>
              </p>
              <button
                onClick={handleCheckout}
                className="w-full sm:w-auto bg-[#2c6660] text-white px-8 py-3 font-mono text-sm uppercase"
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}