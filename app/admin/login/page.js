'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f2ede1] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-[#1b1b18]/20 p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight">Artbit</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">Admin Panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-b border-gray-300 py-2 outline-none focus:border-[#2c6660] bg-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-b border-gray-300 py-2 outline-none focus:border-[#2c6660] bg-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1b1b18] text-[#f2ede1] py-3 font-mono text-sm uppercase tracking-wider hover:bg-transparent hover:text-[#1b1b18] border border-[#1b1b18] transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}