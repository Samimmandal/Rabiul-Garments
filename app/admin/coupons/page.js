'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_percent: '',
    discount_amount: '',
    is_active: true
  })
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
    fetchCoupons()
  }

  const fetchCoupons = async () => {
    setLoading(true)
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('coupons').insert([{
      code: form.code.toUpperCase().trim(),
      description: form.description || null,
      discount_percent: form.discount_percent ? parseInt(form.discount_percent) : 0,
      discount_amount: form.discount_amount ? parseInt(form.discount_amount) : 0,
      is_active: form.is_active
    }])
    if (error) alert('Error: ' + error.message)
    else {
      setForm({ code: '', description: '', discount_percent: '', discount_amount: '', is_active: true })
      fetchCoupons()
    }
    setSaving(false)
  }

  const toggleActive = async (id, current) => {
    await supabase.from('coupons').update({ is_active: !current }).eq('id', id)
    fetchCoupons()
  }

  const deleteCoupon = async (id) => {
    if (!confirm('Delete coupon?')) return
    await supabase.from('coupons').delete().eq('id', id)
    fetchCoupons()
  }

  return (
    <div className="min-h-screen bg-[#f2ede1] text-[#1b1b18]">
      <header className="border-b border-[#1b1b18]/20 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-sm font-mono hover:underline">← Dashboard</Link>
          <span className="font-black text-xl uppercase">Coupons</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        <form onSubmit={handleSubmit} className="bg-white border border-[#1b1b18]/15 p-6 mb-8 space-y-3">
          <h2 className="font-black uppercase text-lg mb-2">Create Coupon</h2>
          <input required placeholder="Code (e.g. ARTBIT10)" value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm outline-none uppercase" />
          <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Discount %" value={form.discount_percent} onChange={e => setForm({...form, discount_percent: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            <input type="number" placeholder="Discount ₹" value={form.discount_amount} onChange={e => setForm({...form, discount_amount: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
            Active
          </label>
          <button type="submit" disabled={saving} className="bg-[#2c6660] text-white px-6 py-2.5 font-mono text-xs uppercase disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Coupon'}
          </button>
        </form>

        {loading ? (
          <p className="font-mono text-sm">Loading...</p>
        ) : coupons.length === 0 ? (
          <p className="text-gray-500">No coupons yet.</p>
        ) : (
          <div className="space-y-3">
            {coupons.map(c => (
              <div key={c.id} className="bg-white border border-[#1b1b18]/15 p-4 flex justify-between items-center gap-4">
                <div>
                  <p className="font-mono font-bold text-[#2c6660]">{c.code}</p>
                  <p className="text-sm text-gray-600">
                    {c.description || (c.discount_percent ? `${c.discount_percent}% off` : `₹${c.discount_amount} off`)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{c.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(c.id, c.is_active)} className="text-xs font-mono uppercase border px-3 py-1.5">
                    {c.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => deleteCoupon(c.id)} className="text-xs font-mono uppercase border border-red-400 text-red-600 px-3 py-1.5">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}