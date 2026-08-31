'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
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
    fetchUsers()
  }

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setUsers(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f2ede1] text-[#1b1b18]">
      <header className="border-b border-[#1b1b18]/20 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-sm font-mono text-[#1b1b18] hover:underline">
              ← Dashboard
            </Link>
            <span className="font-black text-xl uppercase text-[#1b1b18]">Users</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <p className="text-sm text-gray-600 mb-6">
          Users who signed in with Google.
        </p>

        {loading ? (
          <p className="font-mono text-sm">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-600">No users yet.</p>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-white border border-[#1b1b18]/15 p-4 flex items-center gap-4">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                    {(u.full_name || u.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[#1b1b18]">{u.full_name || 'No name'}</p>
                  <p className="text-sm text-gray-600">{u.email}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Joined {new Date(u.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}