'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Found a better price',
  'Delivery taking too long',
  'Want different size/color',
  'Wrong address entered',
  'Other reason'
]

export default function AccountPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [cancelOrderId, setCancelOrderId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

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
    await fetchOrders(user)
  }

  const fetchOrders = async (u) => {
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (u?.id) {
      q = q.or(`user_id.eq.${u.id},customer_email.eq.${u.email}`)
    }
    const { data } = await q
    setOrders(data || [])
    setLoading(false)
  }

  const isCOD = (order) =>
    order.payment_method === 'cod' ||
    order.status === 'cod' ||
    order.status === 'money_received'

  const getSteps = (order) => {
    if (order.status === 'cancelled') {
      return isCOD(order)
        ? ['Order Placed', 'Cancelled']
        : ['Paid', 'Cancelled']
    }
    if (isCOD(order)) {
      return ['Order Placed', 'Shipped', 'Delivered']
    }
    return ['Paid', 'Shipped', 'Delivered']
  }

  const getActiveIndex = (order, steps) => {
    const s = order.status
    if (s === 'cancelled') return steps.length - 1
    if (isCOD(order)) {
      if (s === 'delivered' || s === 'money_received') return 2
      if (s === 'shipped') return 1
      return 0
    }
    if (s === 'delivered') return 2
    if (s === 'shipped') return 1
    if (s === 'paid') return 0
    return 0
  }

  const canCancel = (order) =>
    !['delivered', 'money_received', 'cancelled'].includes(order.status)

  const submitCancel = async () => {
    if (!cancelOrderId || !cancelReason) return
    setCancelling(true)
    await supabase
      .from('orders')
      .update({ status: 'cancelled', cancel_reason: cancelReason })
      .eq('id', cancelOrderId)
    setCancelOrderId(null)
    setCancelReason('')
    setCancelling(false)
    if (user) fetchOrders(user)
  }

  const statusLabel = (order) => {
    const map = {
      pending: 'Pending',
      paid: 'Paid',
      cod: 'Cash on Delivery',
      shipped: 'Shipped',
      delivered: 'Delivered',
      money_received: 'Delivered',
      cancelled: 'Cancelled'
    }
    return map[order.status] || order.status
  }

  const statusColor = (order) => {
    if (order.status === 'cancelled') return 'bg-red-100 text-red-700'
    if (['delivered', 'money_received'].includes(order.status)) return 'bg-emerald-100 text-emerald-800'
    if (order.status === 'shipped') return 'bg-blue-100 text-blue-800'
    return 'bg-amber-100 text-amber-800'
  }

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
        <h1 className="text-3xl font-black uppercase mb-2">My Orders</h1>
        <p className={`${muted} text-sm mb-8`}>Track your orders here.</p>

        {loading ? (
          <p className="font-mono text-sm">Loading...</p>
        ) : !user ? (
          <div className={`${card} border p-8 text-center`}>
            <p className={`${muted} mb-4`}>Please login to view your orders.</p>
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } })}
              className="bg-[#1b1b18] text-[#f2ede1] px-6 py-3 font-mono text-xs uppercase"
            >
              Continue with Google
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className={`${card} border p-8 text-center`}>
            <p className={`${muted} mb-4`}>No orders yet.</p>
            <Link href="/shop" className="underline text-sm">Browse products →</Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map(order => {
              const steps = getSteps(order)
              const active = getActiveIndex(order, steps)
              return (
                <div key={order.id} className={`${card} border p-5`}>
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div>
                      <p className="font-bold">Order #{order.id}</p>
                      {isCOD(order) && order.status !== 'cancelled' && (
                        <p className="text-[11px] font-mono uppercase text-[#e2a233] mt-0.5">Cash on Delivery</p>
                      )}
                      <p className={`text-xs ${muted} mt-1`}>
                        Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="font-mono text-[#2c6660] mt-1">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                    </div>
                    <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${statusColor(order)}`}>
                      {statusLabel(order)}
                    </span>
                  </div>

                  <div className="flex items-center gap-0 mb-4 overflow-x-auto">
                    {steps.map((step, i) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`text-[10px] font-mono uppercase px-2.5 py-1.5 whitespace-nowrap ${
                            i <= active
                              ? 'bg-[#2c6660] text-white'
                              : darkMode
                                ? 'bg-[#333] text-gray-400'
                                : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {step}
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`w-4 h-0.5 ${i < active ? 'bg-[#2c6660]' : darkMode ? 'bg-[#333]' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {order.estimated_delivery && (
                    <p className={`text-xs ${muted}`}>Estimated delivery: {order.estimated_delivery}</p>
                  )}
                  {order.tracking_note && (
                    <p className={`text-xs ${muted}`}>Note: {order.tracking_note}</p>
                  )}
                  {order.cancel_reason && (
                    <p className="text-xs text-red-600 mt-1">Cancel reason: {order.cancel_reason}</p>
                  )}
                  {order.address && (
                    <p className={`text-xs ${muted} mt-1`}>{order.address}</p>
                  )}

                  {canCancel(order) && (
                    <button
                      type="button"
                      onClick={() => { setCancelOrderId(order.id); setCancelReason('') }}
                      className="mt-4 text-xs text-red-600 underline font-mono"
                    >
                      Cancel order
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {cancelOrderId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`${bg} w-full max-w-md p-6 border ${border}`}>
            <h3 className="font-black uppercase text-sm mb-4">Cancel Order #{cancelOrderId}</h3>
            <p className={`text-sm ${muted} mb-3`}>Select a reason:</p>
            <div className="space-y-2 mb-5">
              {CANCEL_REASONS.map(r => (
                <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={cancelReason === r}
                    onChange={() => setCancelReason(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!cancelReason || cancelling}
                onClick={submitCancel}
                className="flex-1 bg-red-600 text-white py-2.5 font-mono text-xs uppercase disabled:opacity-40"
              >
                {cancelling ? '...' : 'Confirm Cancel'}
              </button>
              <button
                type="button"
                onClick={() => setCancelOrderId(null)}
                className={`flex-1 border py-2.5 font-mono text-xs uppercase ${border}`}
              >
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}