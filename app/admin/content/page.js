'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function AdminContent() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', link_url: '' })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    fetchPages()
  }

  const fetchPages = async () => {
    setLoading(true)
    const { data } = await supabase.from('site_pages').select('*').order('id')
    setPages(data || [])
    setLoading(false)
  }

  const startEdit = (page) => {
    setEditing(page.id)
    setForm({
      title: page.title || '',
      content: page.content || '',
      link_url: page.link_url || ''
    })
  }

  const savePage = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('site_pages')
      .update({
        title: form.title,
        content: form.content,
        link_url: form.link_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', editing)

    if (error) alert('Error: ' + error.message)
    else {
      setEditing(null)
      fetchPages()
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#f2ede1] text-[#1b1b18]">
      <header className="border-b border-[#1b1b18]/20 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-sm font-mono hover:underline">← Dashboard</Link>
          <span className="font-black text-xl uppercase">Site Content</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        <p className="text-sm text-gray-600 mb-6">
          Edit About Us, Terms, Privacy Policy, and Hiring page content.
        </p>

        {loading ? (
          <p className="font-mono text-sm">Loading...</p>
        ) : (
          <div className="space-y-4">
            {pages.map(page => (
              <div key={page.id} className="bg-white border border-[#1b1b18]/15 p-5">
                {editing === page.id ? (
                  <div className="space-y-3">
                    <input
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
                      placeholder="Title"
                    />
                    <textarea
                      value={form.content}
                      onChange={e => setForm({ ...form, content: e.target.value })}
                      className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
                      rows={8}
                      placeholder="Page content..."
                    />
                    {page.id === 'hiring' && (
                      <input
                        value={form.link_url}
                        onChange={e => setForm({ ...form, link_url: e.target.value })}
                        className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
                        placeholder="WhatsApp / Form link (optional)"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={savePage}
                        disabled={saving}
                        className="bg-[#2c6660] text-white px-4 py-2 text-xs font-mono uppercase disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="border border-gray-400 px-4 py-2 text-xs font-mono uppercase"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold">{page.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">/{page.id}</p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{page.content}</p>
                    </div>
                    <button
                      onClick={() => startEdit(page)}
                      className="text-xs font-mono uppercase border border-[#1b1b18] px-3 py-1.5 shrink-0 hover:bg-[#1b1b18] hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}