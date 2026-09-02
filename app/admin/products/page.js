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
  images: [],
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
  const [uploadingMain, setUploadingMain] = useState(false)
  const [uploadingExtra, setUploadingExtra] = useState(false)
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
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const uploadFile = async (file) => {
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    return publicUrl
  }

  // Main image — একটা ফাইল
  const handleMainUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingMain(true)
    try {
      const url = await uploadFile(file)
      setForm(f => {
        const extras = (f.images || []).filter(u => u !== f.image_url)
        return {
          ...f,
          image_url: url,
          images: [url, ...extras]
        }
      })
    } catch (err) {
      alert('Upload error: ' + err.message)
    }
    setUploadingMain(false)
    e.target.value = ''
  }

  // Extra images — একাধিক ফাইল
  const handleExtraUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploadingExtra(true)
    try {
      const urls = []
      for (const file of files) {
        const url = await uploadFile(file)
        urls.push(url)
      }
      setForm(f => {
        const existing = f.images || []
        const main = f.image_url
        const merged = main
          ? [main, ...existing.filter(u => u !== main), ...urls]
          : [...existing, ...urls]
        return {
          ...f,
          image_url: f.image_url || urls[0] || '',
          images: [...new Set(merged)]
        }
      })
    } catch (err) {
      alert('Upload error: ' + err.message)
    }
    setUploadingExtra(false)
    e.target.value = ''
  }

  const removeImage = (url) => {
    setForm(f => {
      const next = (f.images || []).filter(u => u !== url)
      const main = f.image_url === url ? (next[0] || '') : f.image_url
      return { ...f, images: next, image_url: main }
    })
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    const imgs = (p.images && p.images.length)
      ? p.images
      : (p.image_url ? [p.image_url] : [])
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
      image_url: p.image_url || imgs[0] || '',
      images: imgs,
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

    const imagesArr = form.images?.length
      ? form.images
      : (form.image_url ? [form.image_url] : [])

    const payload = {
      name: form.name,
      price: parseFloat(form.price) || 0,
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      description: form.description || '',
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
      size_guide_url: null,
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
          <Link href="/admin/dashboard" className="text-sm font-mono hover:underline">
            ← Dashboard
          </Link>
          <span className="font-black text-xl uppercase">Products</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <form onSubmit={handleSubmit} className="bg-white border border-[#1b1b18]/15 p-6 mb-10 space-y-4">
          <h2 className="font-black uppercase text-lg">
            {editingId ? 'Edit Product' : 'Add Product'}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Name *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Category</label>
              <input
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="Tees / Hoodies"
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Selling Price (₹) *</label>
              <input
                required
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Original Price (₹)</label>
              <input
                type="number"
                value={form.compare_at_price}
                onChange={e => setForm({ ...form, compare_at_price: e.target.value })}
                placeholder="For discount %"
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Sizes</label>
              <input
                value={form.sizes}
                onChange={e => setForm({ ...form, sizes: e.target.value })}
                placeholder="S, M, L, XL"
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Colors</label>
              <input
                value={form.colors}
                onChange={e => setForm({ ...form, colors: e.target.value })}
                placeholder="White, Black, Navy"
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Fabric</label>
              <input
                value={form.fabric}
                onChange={e => setForm({ ...form, fabric: e.target.value })}
                placeholder="100% Cotton"
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Tag</label>
              <input
                value={form.tag}
                onChange={e => setForm({ ...form, tag: e.target.value })}
                placeholder="New / Bestseller"
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Offer Text</label>
              <input
                value={form.offer_text}
                onChange={e => setForm({ ...form, offer_text: e.target.value })}
                placeholder="Buy 3 Get 10% Off"
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Fit</label>
              <input
                value={form.fit}
                onChange={e => setForm({ ...form, fit: e.target.value })}
                placeholder="Regular / Oversized"
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Neck</label>
              <input
                value={form.neck}
                onChange={e => setForm({ ...form, neck: e.target.value })}
                placeholder="Crew / V-neck"
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Sleeve</label>
              <input
                value={form.sleeve}
                onChange={e => setForm({ ...form, sleeve: e.target.value })}
                placeholder="Half / Full"
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-500">Hemline</label>
              <input
                value={form.hemline}
                onChange={e => setForm({ ...form, hemline: e.target.value })}
                placeholder="Straight / Curved"
                className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-gray-500">Design Note</label>
            <input
              value={form.design_note}
              onChange={e => setForm({ ...form, design_note: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-gray-500">Description *</label>
            <textarea
              required
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none"
              rows={3}
            />
          </div>

          {/* MAIN IMAGE — file only */}
          <div>
            <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">
              Main Photo (from PC)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainUpload}
              className="w-full text-sm"
            />
            {uploadingMain && (
              <p className="text-xs text-gray-500 mt-1">Uploading main photo...</p>
            )}
            {form.image_url && (
              <div className="mt-3 relative inline-block">
                <img
                  src={form.image_url}
                  alt="Main"
                  className="w-28 h-36 object-cover border border-gray-300"
                />
                <span className="absolute bottom-1 left-1 bg-black text-white text-[9px] px-1 font-mono">
                  MAIN
                </span>
              </div>
            )}
          </div>

          {/* EXTRA IMAGES — multiple files */}
          <div>
            <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">
              More Photos (from PC — multiple allowed)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleExtraUpload}
              className="w-full text-sm"
            />
            {uploadingExtra && (
              <p className="text-xs text-gray-500 mt-1">Uploading photos...</p>
            )}
            {form.images?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {form.images.map(url => (
                  <div key={url} className="relative">
                    <img
                      src={url}
                      alt=""
                      className="w-20 h-24 object-cover border border-gray-300"
                    />
                    {url === form.image_url && (
                      <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[8px] text-center font-mono">
                        MAIN
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-xs rounded-full leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Size guide uses the default chart on the product page. No upload needed.
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={e => setForm({ ...form, is_featured: e.target.checked })}
            />
            Featured on homepage
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || uploadingMain || uploadingExtra}
              className="bg-[#2c6660] text-white px-6 py-2.5 font-mono text-xs uppercase disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="border border-gray-400 px-6 py-2.5 font-mono text-xs uppercase"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <h2 className="font-black uppercase text-lg mb-4">
          All Products ({products.length})
        </h2>
        {loading ? (
          <p className="font-mono text-sm">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500">No products yet.</p>
        ) : (
          <div className="space-y-3">
            {products.map(p => (
              <div
                key={p.id}
                className="bg-white border border-[#1b1b18]/15 p-4 flex gap-4 items-center"
              >
                <div className="w-16 h-20 bg-gray-100 shrink-0 overflow-hidden">
                  {p.image_url && (
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-sm font-mono text-[#2c6660]">
                    ₹{Number(p.price).toLocaleString('en-IN')}
                    {p.compare_at_price && (
                      <span className="text-gray-400 line-through ml-2 text-xs">
                        ₹{Number(p.compare_at_price).toLocaleString('en-IN')}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.category || '—'} · Stock: {p.stock}
                    {p.images?.length > 1 ? ` · ${p.images.length} photos` : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(p)}
                    className="text-xs font-mono uppercase border px-3 py-1.5 hover:bg-[#1b1b18] hover:text-white transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="text-xs font-mono uppercase border border-red-400 text-red-600 px-3 py-1.5 hover:bg-red-600 hover:text-white transition"
                  >
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