'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  const checkAuthAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    fetchOrders()
  }

  const fetchOrders = async () => {
    setLoading(true)
    // সব স্ট্যাটাস দেখাবে — cod সহ
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['paid', 'shipped', 'delivered', 'pending', 'cod', 'cancelled'])
      .order('created_at', { ascending: false })

    if (!error) setOrders(data || [])
    setLoading(false)
  }

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
      return
    }
    fetchOrders()
  }

  const updateTracking = async (id, field, value) => {
    const { error } = await supabase
      .from('orders')
      .update({ [field]: value })
      .eq('id', id)

    if (error) alert('Error: ' + error.message)
    else fetchOrders()
  }

  const statusColor = (status) => {
    if (status === 'paid') return 'text-green-800 bg-green-100'
    if (status === 'cod') return 'text-yellow-800 bg-yellow-100'
    if (status === 'shipped') return 'text-blue-800 bg-blue-100'
    if (status === 'delivered') return 'text-teal-800 bg-teal-100'
    if (status === 'cancelled') return 'text-red-800 bg-red-100'
    return 'text-gray-700 bg-gray-100'
  }

  const statusLabel = (status) => {
    const map = {
      pending: 'Pending',
      paid: 'Paid',
      cod: 'Cash on Delivery',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    }
    return map[status] || status
  }

  return (
    <div className="min-h-screen bg-[#f2ede1] text-[#1b1b18]">
      <header className="border-b border-[#1b1b18]/20 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-sm font-mono hover:underline">
            ← Dashboard
          </Link>
          <span className="font-black text-xl uppercase">Orders</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <p className="text-sm text-gray-600 mb-6">
          All orders including Cash on Delivery.
        </p>

        {loading ? (
          <p className="font-mono text-sm">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-600">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white border border-[#1b1b18]/15 p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold">
                        #{order.id} — {order.customer_name}
                      </h3>
                      <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded ${statusColor(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700">
                      {order.customer_email} · {order.customer_phone}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{order.address}</p>

                    <p className="font-mono text-sm text-[#2c6660] mt-2 font-semibold">
                      ₹{Number(order.total_amount).toLocaleString('en-IN')}
                    </p>

                    <p className="text-[11px] text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleString('en-IN')}
                    </p>

                    {order.tracking_note && (
                      <p className="text-xs text-gray-500 mt-1">Note: {order.tracking_note}</p>
                    )}

                    <div className="mt-4 grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-gray-500">
                          Estimated Delivery
                        </label>
                        <input
                          type="date"
                          defaultValue={order.estimated_delivery || ''}
                          onBlur={(e) =>
                            updateTracking(order.id, 'estimated_delivery', e.target.value || null)
                          }
                          className="w-full border border-gray-300 px-2 py-1.5 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase text-gray-500">
                          Tracking Note
                        </label>
                        <input
                          type="text"
                          defaultValue={order.tracking_note || ''}
                          placeholder="e.g. Out for delivery"
                          onBlur={(e) =>
                            updateTracking(order.id, 'tracking_note', e.target.value || null)
                          }
                          className="w-full border border-gray-300 px-2 py-1.5 text-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['paid', 'cod', 'shipped', 'delivered', 'cancelled'].map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(order.id, s)}
                        className={`text-[11px] font-mono uppercase px-2.5 py-1 border transition ${
                          order.status === s
                            ? 'bg-[#1b1b18] text-white border-[#1b1b18]'
                            : 'border-gray-400 text-gray-700 hover:border-[#1b1b18]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
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