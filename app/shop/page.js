'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    setProducts(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f2ede1] text-[#1b1b18]">
      <header className="border-b border-[#1b1b18]/20 sticky top-0 bg-[#f2ede1] z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl uppercase tracking-tight">
            Artbit
          </Link>
          <nav className="hidden md:flex gap-7 text-xs font-semibold uppercase tracking-widest">
            <Link href="/shop" className="text-[#2c6660]">Shop</Link>
            <Link href="/#custom" className="hover:text-[#2c6660] transition">Custom Prints</Link>
            <Link href="/#process" className="hover:text-[#2c6660] transition">Process</Link>
            <Link href="/#contact" className="hover:text-[#2c6660] transition">Contact</Link>
          </nav>
          <Link href="/admin/login" className="text-[11px] font-mono uppercase border border-[#1b1b18] px-3 py-1.5 hover:bg-[#1b1b18] hover:text-[#f2ede1] transition">
            Admin
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-12 md:py-16 border-b border-[#1b1b18]/15">
        <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#2c6660] mb-2">Full catalog</p>
        <h1 className="text-4xl md:text-5xl font-black uppercase">All Prints</h1>
        <p className="text-[#4a453d] mt-3 max-w-md">
          Every piece is printed to order in small batches. No dead stock, no compromises.
        </p>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          {loading ? (
            <p className="font-mono text-sm">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-gray-500">No products available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-[#1b1b18]/15 border border-[#1b1b18]/15">
              {products.map(p => (
                <Link href={`/product/${p.id}`} key={p.id} className="bg-[#f2ede1] group block">
                  <div className="aspect-[4/5] bg-[#e9e1d1] relative overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-mono text-gray-400">No image</div>
                    )}
                    {p.tag && (
                      <span className="absolute top-3 left-3 bg-[#1b1b18] text-[#f2ede1] text-[10px] font-mono uppercase tracking-wider px-2 py-1">
                        {p.tag}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[15px] mb-1">{p.name}</h3>
                    <p className="text-xs text-gray-500 mb-1">{p.sizes || 'S · M · L · XL'}</p>
                    <p className="font-mono text-sm text-[#2c6660]">
                      ₹{Number(p.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[#1b1b18]/15 py-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] font-mono text-gray-500">
          <span>© 2026 Artbit Print Co.</span>
          <Link href="/" className="hover:text-[#2c6660] transition">← Back to Home</Link>
        </div>
      </footer>
    </div>
  )
}