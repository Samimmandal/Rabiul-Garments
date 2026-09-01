'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function AccountPage() {
  const [orders, setOrders] = useState([])
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
    fetchOrders(user)
  }

  const fetchOrders = async (user) => {
    setLoading(true)
    // user_id অথবা email দিয়ে খুঁজবে
    const { data } = await supabase
      .from('orders')
      .select('*')
      .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
      .in('status', ['paid', 'shipped', 'delivered', 'pending'])
      .order('created_at', { ascending: false })

    setOrders(data || [])
    setLoading(false)
  }

  const statusLabel = (status) => {
    const map = {
      pending: 'Order Placed',
      paid: 'Payment Confirmed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    }
    return map[status] || status
  }

  const statusColor = (status) => {
    if (status === 'paid') return 'bg-green-100 text-green-800'
    if (status === 'shipped') return 'bg-blue-100 text-blue-800'
    if (status === 'delivered') return 'bg-teal-100 text-teal-800'
    if (status === 'cancelled') return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
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
            <Link href="/wishlist" className="hover:underline">Wishlist</Link>
            <Link href="/shop" className="hover:underline">Shop</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-black uppercase mb-2">My Orders</h1>
        <p className={`text-sm ${muted} mb-8`}>Track your orders here.</p>

        {!user ? (
          <div className={`${card} border p-8 text-center`}>
            <p className={`${muted} mb-4`}>Login to see your orders.</p>
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/account' } })}
              className="bg-[#1b1b18] text-[#f2ede1] px-6 py-3 font-mono text-sm uppercase"
            >
              Login with Google
            </button>
          </div>
        ) : loading ? (
          <p className="font-mono text-sm">Loading...</p>
        ) : orders.length === 0 ? (
          <div className={`${card} border p-8 text-center`}>
            <p className={`${muted} mb-4`}>No orders yet.</p>
            <Link href="/shop" className="underline text-sm">Start shopping →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className={`${card} border p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <p className="font-semibold">Order #{order.id}</p>
                  <span className={`text-[11px] font-mono uppercase px-2 py-1 rounded ${statusColor(order.status)}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>

                <p className={`text-sm ${muted}`}>
                  Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>

                <p className="font-mono text-sm text-[#2c6660] mt-2 font-semibold">
                  ₹{Number(order.total_amount).toLocaleString('en-IN')}
                </p>

                {/* Tracking steps */}
                <div className="mt-5 flex items-center gap-1 text-[10px] font-mono uppercase">
                  {['paid', 'shipped', 'delivered'].map((step, i) => {
                    const steps = ['paid', 'shipped', 'delivered']
                    const currentIndex = steps.indexOf(order.status)
                    const stepIndex = i
                    const done = currentIndex >= stepIndex || order.status === 'delivered'
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className={`flex-1 text-center py-2 border ${done ? 'bg-[#2c6660] text-white border-[#2c6660]' : 'border-gray-300 opacity-50'}`}>
                          {step}
                        </div>
                        {i < 2 && <div className={`w-2 h-0.5 ${done ? 'bg-[#2c6660]' : 'bg-gray-300'}`} />}
                      </div>
                    )
                  })}
                </div>

                {order.estimated_delivery && (
                  <p className={`text-xs ${muted} mt-3`}>
                    Estimated delivery: {new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                )}

                {order.tracking_note && (
                  <p className={`text-xs ${muted} mt-1`}>Note: {order.tracking_note}</p>
                )}

                <p className={`text-xs ${muted} mt-2`}>{order.address}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}