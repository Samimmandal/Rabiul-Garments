'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

const emptyForm = {
  name: '',
  price: '',
  compare_at_price: '',
  description: '',
  sizes: 'S, M, L, XL',
  colors: '',
  fabric: '',
  category: '',
  tag: '',
  offer_text: '',
  stock: '10',
  is_featured: false,
  image_url: '',
  images: '',
  size_guide_url: '',
  fit: '',
  neck: '',
  sleeve: '',
  hemline: '',
  design_note: ''
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
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
    fetchProducts()
  }

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`
    const { error } = await supabase.storage.from('product-images').upload(fileName, file)
    if (error) {
      alert('Upload error: ' + error.message)
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
    setForm(f => {
      const existing = f.images ? f.images.split(',').map(s => s.trim()).filter(Boolean) : []
      existing.push(publicUrl)
      return {
        ...f,
        image_url: f.image_url || publicUrl,
        images: existing.join(', ')
      }
    })
    setUploading(false)
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setForm({
      name: p.name || '',
      price: String(p.price || ''),
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '',
      description: p.description || '',
      sizes: p.sizes || 'S, M, L, XL',
      colors: p.colors || '',
      fabric: p.fabric || '',
      category: p.category || '',
      tag: p.tag || '',
      offer_text: p.offer_text || '',
      stock: String(p.stock ?? 10),
      is_featured: !!p.is_featured,
      image_url: p.image_url || '',
      images: (p.images && p.images.length) ? p.images.join(', ') : (p.image_url || ''),
      size_guide_url: p.size_guide_url || '',
      fit: p.fit || '',
      neck: p.neck || '',
      sleeve: p.sleeve || '',
      hemline: p.hemline || '',
      design_note: p.design_note || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const imagesArr = form.images
      ? form.images.split(',').map(s => s.trim()).filter(Boolean)
      : (form.image_url ? [form.image_url] : [])

    const payload = {
      name: form.name,
      price: parseFloat(form.price) || 0,
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      description: form.description || null,
      sizes: form.sizes || null,
      colors: form.colors || null,
      fabric: form.fabric || null,
      category: form.category || null,
      tag: form.tag || null,
      offer_text: form.offer_text || null,
      stock: parseInt(form.stock) || 0,
      is_featured: form.is_featured,
      image_url: form.image_url || imagesArr[0] || null,
      images: imagesArr,
      size_guide_url: form.size_guide_url || null,
      fit: form.fit || null,
      neck: form.neck || null,
      sleeve: form.sleeve || null,
      hemline: form.hemline || null,
      design_note: form.design_note || null
    }

    let error
    if (editingId) {
      ;({ error } = await supabase.from('products').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('products').insert([payload]))
    }

    if (error) alert('Error: ' + error.message)
    else {
      cancelEdit()
      fetchProducts()
      alert(editingId ? 'Product updated!' : 'Product added!')
    }
    setSaving(false)
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) alert('Error: ' + error.message)
    else fetchProducts()
  }

  return (
    <div className="min-h-screen bg-[#f2ede1] text-[#1b1b18]">
      <header className="border-b border-[#1b1b18]/20 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-sm font-mono hover:underline">← Dashboard</Link>
          <span className="font-black text-xl uppercase">Products</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#1b1b18]/15 p-6 mb-10 space-y-4">
          <h2 className="font-black uppercase text-lg">
            {editingId ? 'Edit Product' : 'Add Product'}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Name *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Category</label>
              <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Tees / Hoodies" className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Selling Price (₹) *</label>
              <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Original Price (₹)</label>
              <input type="number" value={form.compare_at_price} onChange={e => setForm({...form, compare_at_price: e.target.value})} placeholder="For discount %" className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Sizes</label>
              <input value={form.sizes} onChange={e => setForm({...form, sizes: e.target.value})} placeholder="S, M, L, XL" className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Colors</label>
              <input value={form.colors} onChange={e => setForm({...form, colors: e.target.value})} placeholder="White, Black, Navy" className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Fabric</label>
              <input value={form.fabric} onChange={e => setForm({...form, fabric: e.target.value})} placeholder="100% Cotton" className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Tag</label>
              <input value={form.tag} onChange={e => setForm({...form, tag: e.target.value})} placeholder="New / Bestseller" className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Offer Text</label>
              <input value={form.offer_text} onChange={e => setForm({...form, offer_text: e.target.value})} placeholder="Buy 3 Get 10% Off" className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Fit</label>
              <input value={form.fit} onChange={e => setForm({...form, fit: e.target.value})} placeholder="Regular / Oversized" className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Neck</label>
              <input value={form.neck} onChange={e => setForm({...form, neck: e.target.value})} placeholder="Crew / V-neck" className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Sleeve</label>
              <input value={form.sleeve} onChange={e => setForm({...form, sleeve: e.target.value})} placeholder="Half / Full" className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Hemline</label>
              <input value={form.hemline} onChange={e => setForm({...form, hemline: e.target.value})} placeholder="Straight / Curved" className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-gray-500">Design Note</label>
            <input value={form.design_note} onChange={e => setForm({...form, design_note: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-gray-500">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" rows={3} />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-gray-500">Main Image URL</label>
            <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-gray-500">All Images (comma separated URLs)</label>
            <textarea value={form.images} onChange={e => setForm({...form, images: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" rows={2} placeholder="url1, url2, url3" />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-gray-500">Upload Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm" />
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-gray-500">Size Guide Image URL</label>
            <input value={form.size_guide_url} onChange={e => setForm({...form, size_guide_url: e.target.value})} className="w-full border border-gray-300 px-3 py-2 text-sm outline-none" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} />
            Featured on homepage
          </label>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-[#2c6660] text-white px-6 py-2.5 font-mono text-xs uppercase disabled:opacity-50">
              {saving ? 'Saving...' : (editingId ? 'Update Product' : 'Add Product')}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="border border-gray-400 px-6 py-2.5 font-mono text-xs uppercase">
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* List */}
        <h2 className="font-black uppercase text-lg mb-4">All Products ({products.length})</h2>
        {loading ? (
          <p className="font-mono text-sm">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500">No products yet.</p>
        ) : (
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="bg-white border border-[#1b1b18]/15 p-4 flex gap-4 items-center">
                <div className="w-16 h-20 bg-gray-100 shrink-0 overflow-hidden">
                  {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-sm font-mono text-[#2c6660]">
                    ₹{Number(p.price).toLocaleString('en-IN')}
                    {p.compare_at_price && (
                      <span className="text-gray-400 line-through ml-2 text-xs">₹{Number(p.compare_at_price).toLocaleString('en-IN')}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{p.category || '—'} · Stock: {p.stock}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(p)} className="text-xs font-mono uppercase border px-3 py-1.5 hover:bg-[#1b1b18] hover:text-white transition">Edit</button>
                  <button onClick={() => deleteProduct(p.id)} className="text-xs font-mono uppercase border border-red-400 text-red-600 px-3 py-1.5 hover:bg-red-600 hover:text-white transition">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}