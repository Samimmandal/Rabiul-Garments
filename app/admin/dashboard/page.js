'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2ede1] flex items-center justify-center">
        <p className="font-mono text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2ede1]">
      {/* Header */}
      <header className="border-b border-[#1b1b18]/20 bg-[#f2ede1]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-xl uppercase">Artbit</span>
            <span className="text-xs font-mono text-gray-500">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-xs font-mono uppercase border border-[#1b1b18] px-3 py-1.5 hover:bg-[#1b1b18] hover:text-[#f2ede1] transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black uppercase mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/products" className="bg-white border border-[#1b1b18]/15 p-6 hover:border-[#2c6660] transition">
            <p className="text-xs font-mono uppercase text-gray-500 mb-2">Manage</p>
            <h2 className="text-xl font-bold">Products</h2>
          </Link>

          <Link href="/admin/orders" className="bg-white border border-[#1b1b18]/15 p-6 hover:border-[#2c6660] transition">
            <p className="text-xs font-mono uppercase text-gray-500 mb-2">Manage</p>
            <h2 className="text-xl font-bold">Orders</h2>
          </Link>

          <Link href="/admin/custom-requests" className="bg-white border border-[#1b1b18]/15 p-6 hover:border-[#2c6660] transition">
            <p className="text-xs font-mono uppercase text-gray-500 mb-2">Manage</p>
            <h2 className="text-xl font-bold">Custom Requests</h2>
          </Link>

          <div className="bg-white border border-[#1b1b18]/15 p-6 opacity-60">
            <p className="text-xs font-mono uppercase text-gray-500 mb-2">Coming Soon</p>
            <h2 className="text-xl font-bold">Settings</h2>
          </div>
        </div>
      </main>
    </div>
  )
}