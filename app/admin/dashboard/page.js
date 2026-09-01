'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('artbit-theme')
    if (saved === 'dark') setDarkMode(true)
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

  const bg = darkMode ? 'bg-[#1b1b18]' : 'bg-[#f2ede1]'
  const text = darkMode ? 'text-[#f2ede1]' : 'text-[#1b1b18]'
  const card = darkMode ? 'bg-[#252522] border-[#f2ede1]/15' : 'bg-white border-[#1b1b18]/15'
  const headerBg = darkMode ? 'bg-[#252522]' : 'bg-white'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'

  if (loading) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center`}>
        <p className={`font-mono text-sm ${text}`}>Loading...</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      <header className={`border-b ${darkMode ? 'border-[#f2ede1]/15' : 'border-[#1b1b18]/20'} ${headerBg}`}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-lg uppercase tracking-tight">Artbit</span>
            <span className={`text-xs font-mono ${muted}`}>Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${muted} hidden sm:block`}>{user?.email}</span>
            <button
              onClick={handleLogout}
              className={`text-xs font-mono uppercase border px-3 py-1.5 transition ${
                darkMode
                  ? 'border-[#f2ede1]/40 hover:bg-[#f2ede1] hover:text-[#1b1b18]'
                  : 'border-[#1b1b18] hover:bg-[#1b1b18] hover:text-white'
              }`}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10">
        <h1 className="text-3xl font-black uppercase mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/products" className={`${card} border p-6 hover:opacity-90 transition block`}>
            <p className={`text-[11px] font-mono uppercase ${muted} mb-1`}>Manage</p>
            <h2 className="text-xl font-bold">Products</h2>
          </Link>

          <Link href="/admin/orders" className={`${card} border p-6 hover:opacity-90 transition block`}>
            <p className={`text-[11px] font-mono uppercase ${muted} mb-1`}>Manage</p>
            <h2 className="text-xl font-bold">Orders</h2>
          </Link>

          <Link href="/admin/coupons" className={`${card} border p-6 hover:opacity-90 transition block`}>
            <p className={`text-[11px] font-mono uppercase ${muted} mb-1`}>Manage</p>
            <h2 className="text-xl font-bold">Coupons</h2>
          </Link>

          <Link href="/admin/custom-requests" className={`${card} border p-6 hover:opacity-90 transition block`}>
            <p className={`text-[11px] font-mono uppercase ${muted} mb-1`}>Manage</p>
            <h2 className="text-xl font-bold">Custom Requests</h2>
          </Link>

          <Link href="/admin/users" className={`${card} border p-6 hover:opacity-90 transition block`}>
            <p className={`text-[11px] font-mono uppercase ${muted} mb-1`}>Manage</p>
            <h2 className="text-xl font-bold">Users</h2>
          </Link>

          <Link href="/admin/content" className={`${card} border p-6 hover:opacity-90 transition block`}>
            <p className={`text-[11px] font-mono uppercase ${muted} mb-1`}>Manage</p>
            <h2 className="text-xl font-bold">Site Content</h2>
          </Link>
        </div>
      </main>
    </div>
  )
}