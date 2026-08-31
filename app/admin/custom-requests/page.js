'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function AdminCustomRequests() {
  const [requests, setRequests] = useState([])
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
    fetchRequests()
  }

  const fetchRequests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('custom_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setRequests(data || [])
    setLoading(false)
  }

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('custom_requests')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
      return
    }
    fetchRequests()
  }

  return (
    <div className="min-h-screen bg-[#f2ede1]">
      <header className="border-b border-[#1b1b18]/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-sm font-mono hover:underline">← Dashboard</Link>
            <span className="font-black text-xl uppercase">Custom Requests</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <p className="font-mono text-sm">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-500">No custom requests yet.</p>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-white border border-[#1b1b18]/15 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">{req.name}</h3>
                    <p className="text-sm text-gray-600">{req.email}</p>
                    <p className="text-sm text-[#4a453d] mt-3 leading-relaxed whitespace-pre-wrap">
                      {req.details}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-3">
                      {new Date(req.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['new', 'contacted', 'quoted', 'done', 'rejected'].map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(req.id, s)}
                        className={`text-[11px] font-mono uppercase px-2.5 py-1 border transition ${
                          req.status === s
                            ? 'bg-[#1b1b18] text-[#f2ede1] border-[#1b1b18]'
                            : 'border-gray-300 hover:border-[#1b1b18]'
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