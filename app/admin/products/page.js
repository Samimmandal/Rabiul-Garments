'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    sizes: 'S,M,L,XL',
    stock: 0,
    tag: '',
    is_featured: false,
    image_url: ''
  })
  const [imageFile, setImageFile] = useState(null)
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
    fetchProducts()
  }

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setProducts(data || [])
    setLoading(false)
  }

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase.storage
      .from('product-image')   // তোমার বাকেটের নাম
      .upload(filePath, file)

    if (error) {
      throw error
    }

    const { data } = supabase.storage
      .from('product-image')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)

    try {
      let imageUrl = form.image_url

      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const { error } = await supabase.from('products').insert([{
        name: form.name,
        price: parseFloat(form.price),
        description: form.description,
        sizes: form.sizes,
        stock: parseInt(form.stock),
        tag: form.tag,
        is_featured: form.is_featured,
        image_url: imageUrl,
        slug: form.name.toLowerCase().replace(/\s+/g, '-')
      }])

      if (error) {
        alert('Error: ' + error.message)
        setUploading(false)
        return
      }

      setForm({
        name: '',
        price: '',
        description: '',
        sizes: 'S,M,L,XL',
        stock: 0,
        tag: '',
        is_featured: false,
        image_url: ''
      })
      setImageFile(null)
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      alert('Upload error: ' + err.message)
    }

    setUploading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  return (
    <div className="min-h-screen bg-[#f2ede1]">
      <header className="border-b border-[#1b1b18]/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-sm font-mono hover:underline">← Dashboard</Link>
            <span className="font-black text-xl uppercase">Products</span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#1b1b18] text-[#f2ede1] px-4 py-2 text-sm font-mono uppercase"
          >
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-[#1b1b18]/15 p-6 mb-8 space-y-4">
            <h2 className="font-bold text-lg mb-4">Add New Product</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border-b border-gray-300 py-2 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Price (₹) *</label>
                <input
                  required
                  type="number"
                  value={form.price}
                  onChange={e => setForm({...form, price: e.target.value})}
                  className="w-full border-b border-gray-300 py-2 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Sizes</label>
                <input
                  value={form.sizes}
                  onChange={e => setForm({...form, sizes: e.target.value})}
                  className="w-full border-b border-gray-300 py-2 outline-none"
                  placeholder="S,M,L,XL"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Stock</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={e => setForm({...form, stock: e.target.value})}
                  className="w-full border-b border-gray-300 py-2 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Tag</label>
                <input
                  value={form.tag}
                  onChange={e => setForm({...form, tag: e.target.value})}
                  className="w-full border-b border-gray-300 py-2 outline-none"
                  placeholder="Best seller / New / Kids"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-gray-500">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files[0])}
                  className="w-full py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-gray-500">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full border border-gray-300 p-2 mt-1 outline-none"
                rows={3}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={e => setForm({...form, is_featured: e.target.checked})}
              />
              Featured Product
            </label>

            <button 
              type="submit" 
              disabled={uploading}
              className="bg-[#2c6660] text-white px-6 py-2 font-mono text-sm uppercase disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Save Product'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="font-mono text-sm">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500">No products yet. Add your first product.</p>
        ) : (
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="bg-white border border-[#1b1b18]/15 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name} className="w-14 h-14 object-cover rounded" />
                  )}
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-gray-500">₹{p.price} · Stock: {p.stock} · {p.tag || 'No tag'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-600 text-sm font-mono hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}