'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function WishlistPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [darkMode, setDarkMode] = useState(false)

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
    fetchWishlist(user.id)
  }

  const fetchWishlist = async (userId) => {
    setLoading(true)
    const { data } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)

    if (!data || data.length === 0) {
      setItems([])
      setLoading(false)
      return
    }

    const productIds = data.map(w => w.product_id)
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)

    const merged = data.map(w => ({
      ...w,
      product: products?.find(p => p.id === w.product_id) || null
    })).filter(w => w.product)

    setItems(merged)
    setLoading(false)
  }

  const removeItem = async (id) => {
    await supabase.from('wishlist').delete().eq('id', id)
    if (user) fetchWishlist(user.id)
  }

  const moveToCart = async (item) => {
    if (!user) return
    await supabase.from('cart').upsert({
      user_id: user.id,
      product_id: item.product_id,
      quantity: 1,
      size: item.product?.sizes?.split(',')[0]?.trim() || 'M'
    }, { onConflict: 'user_id,product_id,size' })
    await supabase.from('wishlist').delete().eq('id', item.id)
    fetchWishlist(user.id)
    alert('Moved to cart!')
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
            <Link href="/cart" className="hover:underline">Cart</Link>
            <Link href="/account" className="hover:underline">My Orders</Link>
            <Link href="/shop" className="hover:underline">Shop</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-black uppercase mb-8">Wishlist</h1>

        {!user ? (
          <div className={`${card} border p-8 text-center`}>
            <p className={`${muted} mb-4`}>Please login to view your wishlist.</p>
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/wishlist' } })}
              className="bg-[#1b1b18] text-[#f2ede1] px-6 py-3 font-mono text-sm uppercase"
            >
              Login with Google
            </button>
          </div>
        ) : loading ? (
          <p className="font-mono text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <div className={`${card} border p-8 text-center`}>
            <p className={`${muted} mb-4`}>Your wishlist is empty.</p>
            <Link href="/shop" className="underline text-sm">Browse products →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className={`${card} border overflow-hidden`}>
                <Link href={`/product/${item.product_id}`}>
                  <div className="aspect-[4/5] bg-gray-200">
                    {item.product?.image_url && (
                      <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/product/${item.product_id}`} className="font-semibold hover:underline">
                    {item.product?.name}
                  </Link>
                  <p className="font-mono text-sm text-[#2c6660] mt-1">
                    ₹{Number(item.product?.price || 0).toLocaleString('en-IN')}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => moveToCart(item)}
                      className="flex-1 bg-[#2c6660] text-white py-2 text-xs font-mono uppercase"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="px-3 border text-xs font-mono uppercase"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}