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
    // শুধু paid / shipped / delivered অর্ডার দেখাবে
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['paid', 'shipped', 'delivered'])
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

  const statusColor = (status) => {
    if (status === 'paid') return 'text-green-800 bg-green-100'
    if (status === 'shipped') return 'text-blue-800 bg-blue-100'
    if (status === 'delivered') return 'text-teal-800 bg-teal-100'
    return 'text-gray-700 bg-gray-100'
  }

  return (
    <div className="min-h-screen bg-[#f2ede1] text-[#1b1b18]">
      <header className="border-b border-[#1b1b18]/20 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-sm font-mono text-[#1b1b18] hover:underline">
              ← Dashboard
            </Link>
            <span className="font-black text-xl uppercase text-[#1b1b18]">Orders</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <p className="text-sm text-gray-600 mb-6">
          Only paid & completed orders are shown here.
        </p>

        {loading ? (
          <p className="font-mono text-sm text-[#1b1b18]">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-600">No paid orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white border border-[#1b1b18]/15 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-[#1b1b18]">
                        #{order.id} — {order.customer_name}
                      </h3>
                      <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded ${statusColor(order.status)}`}>
                        {order.status}
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
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['paid', 'shipped', 'delivered', 'cancelled'].map(s => (
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