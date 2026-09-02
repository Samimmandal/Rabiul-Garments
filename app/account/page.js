'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Want to change size / colour',
  'Delivery taking too long',
  'Changed my mind',
  'Duplicate order',
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
    const { data } = await supabase
      .from('orders')
      .select('*')
      .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  // payment_method দিয়ে COD চিনবে — status ship হলেও ঠিক থাকবে
  const isCOD = (order) =>
    order.payment_method === 'cod' ||
    order.status === 'cod' ||
    order.status === 'money_received'

  const getSteps = (order) => {
    if (isCOD(order)) {
      return ['Order Placed', 'Shipped', 'Delivered']
    }
    return ['Paid', 'Shipped', 'Delivered']
  }

  const getActiveIndex = (order) => {
    const s = order.status
    if (s === 'cancelled') return -1
    if (isCOD(order)) {
      if (s === 'cod' || s === 'pending') return 0
      if (s === 'shipped') return 1
      if (s === 'delivered' || s === 'money_received') return 2
      return 0
    }
    if (s === 'paid' || s === 'pending') return 0
    if (s === 'shipped') return 1
    if (s === 'delivered') return 2
    return 0
  }

  const statusLabel = (status) => {
    const map = {
      pending: 'Order Placed',
      paid: 'Payment Confirmed',
      cod: 'Cash on Delivery',
      shipped: 'Shipped',
      delivered: 'Delivered',
      money_received: 'Delivered',
      cancelled: 'Cancelled'
    }
    return map[status] || status
  }

  const statusColor = (status) => {
    if (status === 'paid') return 'bg-green-100 text-green-800'
    if (status === 'cod') return 'bg-yellow-100 text-yellow-800'
    if (status === 'shipped') return 'bg-blue-100 text-blue-800'
    if (status === 'delivered' || status === 'money_received') return 'bg-teal-100 text-teal-800'
    if (status === 'cancelled') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-700'
  }

  // delivered / money_received / cancelled ছাড়া সব অবস্থায় cancel
  const canCancel = (order) => {
    return !['delivered', 'money_received', 'cancelled'].includes(order.status)
  }

  const submitCancel = async () => {
    if (!cancelReason) {
      alert('Please select a reason')
      return
    }
    setCancelling(true)
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancel_reason: cancelReason,
        tracking_note: `Cancelled by customer: ${cancelReason}`
      })
      .eq('id', cancelOrderId)

    if (error) alert('Error: ' + error.message)
    else {
      setCancelOrderId(null)
      setCancelReason('')
      if (user) fetchOrders(user)
    }
    setCancelling(false)
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
              onClick={() =>
                supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: window.location.origin + '/account' }
                })
              }
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
            {orders.map(order => {
              const steps = getSteps(order)
              const activeIndex = getActiveIndex(order)
              const cancelled = order.status === 'cancelled'
              const cod = isCOD(order)

              return (
                <div key={order.id} className={`${card} border p-5`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <p className="font-semibold">Order #{order.id}</p>
                    <span className={`text-[11px] font-mono uppercase px-2 py-1 rounded ${statusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  {cod && order.status !== 'cancelled' && (
                    <p className="text-[11px] font-mono uppercase text-yellow-700 mb-2">Cash on Delivery</p>
                  )}

                  <p className={`text-sm ${muted}`}>
                    Placed on{' '}
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>

                  <p className="font-mono text-sm text-[#2c6660] mt-2 font-semibold">
                    ₹{Number(order.total_amount).toLocaleString('en-IN')}
                  </p>

                  {/* Tracking bar */}
                  <div className="mt-5 flex items-center gap-1 text-[10px] font-mono uppercase">
                    {cancelled ? (
                      <>
                        <div className="flex-1 text-center py-2 border bg-[#2c6660] text-white border-[#2c6660]">
                          {cod ? 'Order Placed' : 'Paid'}
                        </div>
                        <div className="w-2 h-0.5 bg-red-400" />
                        <div className="flex-1 text-center py-2 border bg-red-600 text-white border-red-600">
                          Cancelled
                        </div>
                      </>
                    ) : (
                      steps.map((step, i) => {
                        const done = activeIndex >= i
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div
                              className={`flex-1 text-center py-2 border ${
                                done
                                  ? 'bg-[#2c6660] text-white border-[#2c6660]'
                                  : 'border-gray-300 opacity-50'
                              }`}
                            >
                              {step}
                            </div>
                            {i < steps.length - 1 && (
                              <div
                                className={`w-2 h-0.5 ${
                                  done && activeIndex > i ? 'bg-[#2c6660]' : 'bg-gray-300'
                                }`}
                              />
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  {order.estimated_delivery && !cancelled && (
                    <p className={`text-xs ${muted} mt-3`}>
                      Estimated delivery:{' '}
                      {new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  )}

                  {order.tracking_note && (
                    <p className={`text-xs ${muted} mt-1`}>Note: {order.tracking_note}</p>
                  )}

                  {order.cancel_reason && (
                    <p className="text-xs text-red-600 mt-1">
                      Cancel reason: {order.cancel_reason}
                    </p>
                  )}

                  <p className={`text-xs ${muted} mt-2`}>{order.address}</p>

                  {canCancel(order) && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setCancelOrderId(order.id)
                          setCancelReason('')
                        }}
                        className="text-xs font-mono uppercase border border-red-500 text-red-600 px-4 py-2 hover:bg-red-600 hover:text-white transition"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {cancelOrderId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`${bg} w-full max-w-md p-6`}>
            <h3 className="font-black uppercase text-lg mb-2">
              Cancel Order #{cancelOrderId}
            </h3>
            <p className={`text-sm ${muted} mb-4`}>Please select a reason:</p>
            <div className="space-y-2 mb-6">
              {CANCEL_REASONS.map(reason => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 border cursor-pointer ${
                    cancelReason === reason
                      ? 'border-[#1b1b18] bg-black/5'
                      : darkMode
                        ? 'border-[#f2ede1]/20'
                        : 'border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                  />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={submitCancel}
                disabled={cancelling || !cancelReason}
                className="flex-1 bg-red-600 text-white py-3 font-mono text-xs uppercase disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
              <button
                onClick={() => setCancelOrderId(null)}
                className={`flex-1 border py-3 font-mono text-xs uppercase ${
                  darkMode ? 'border-[#f2ede1]/40' : 'border-[#1b1b18]'
                }`}
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