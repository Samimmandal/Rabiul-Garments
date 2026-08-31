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
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2ede1] flex items-center justify-center">
        <p className="font-mono text-sm text-[#1b1b18]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2ede1] text-[#1b1b18]">
      <header className="border-b border-[#1b1b18]/20 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-lg uppercase tracking-tight">Artbit</span>
            <span className="text-xs text-gray-500 font-mono">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-xs font-mono uppercase border border-[#1b1b18] px-3 py-1.5 hover:bg-[#1b1b18] hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10">
        <h1 className="text-3xl font-black uppercase mb-8 text-[#1b1b18]">Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/products"
            className="bg-white border border-[#1b1b18]/15 p-6 hover:border-[#1b1b18] transition block"
          >
            <p className="text-[11px] font-mono uppercase text-gray-500 mb-1">Manage</p>
            <h2 className="text-xl font-bold text-[#1b1b18]">Products</h2>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white border border-[#1b1b18]/15 p-6 hover:border-[#1b1b18] transition block"
          >
            <p className="text-[11px] font-mono uppercase text-gray-500 mb-1">Manage</p>
            <h2 className="text-xl font-bold text-[#1b1b18]">Orders</h2>
          </Link>

          <Link
            href="/admin/custom-requests"
            className="bg-white border border-[#1b1b18]/15 p-6 hover:border-[#1b1b18] transition block"
          >
            <p className="text-[11px] font-mono uppercase text-gray-500 mb-1">Manage</p>
            <h2 className="text-xl font-bold text-[#1b1b18]">Custom Requests</h2>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white border border-[#1b1b18]/15 p-6 hover:border-[#1b1b18] transition block"
          >
            <p className="text-[11px] font-mono uppercase text-gray-500 mb-1">Manage</p>
            <h2 className="text-xl font-bold text-[#1b1b18]">Users</h2>
          </Link>
        </div>
      </main>
    </div>
  )
}