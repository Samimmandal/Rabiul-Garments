'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('artbit-theme')
    if (saved === 'dark') setDarkMode(true)
    fetchProducts()
  }, [])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('artbit-theme', next ? 'dark' : 'light')
  }

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const bg = darkMode ? 'bg-[#000000]' : 'bg-[#f2ede1]'
  const text = darkMode ? 'text-[#ffffff]' : 'text-[#000000]'
  const muted = darkMode ? 'text-[#cccccc]' : 'text-[#333333]'
  const border = darkMode ? 'border-[#ffffff]/20' : 'border-[#000000]/15'
  const cardBg = darkMode ? 'bg-[#0a0a0a]' : 'bg-[#f2ede1]'
  const iconCls = `p-1.5 transition opacity-90 hover:opacity-100 ${
    darkMode ? 'hover:text-[#e2a233]' : 'hover:text-[#2c6660]'
  }`

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      <header className={`border-b ${border} sticky top-0 ${bg} z-50`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0 flex items-center">
            <img src={darkMode ? '/logo-white.png' : '/logo.png'} alt="Artbit" className="h-8 sm:h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/wishlist" className={iconCls} aria-label="Wishlist" title="Wishlist">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </Link>
            <Link href="/cart" className={iconCls} aria-label="Cart" title="Cart">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </Link>
            <Link href="/account" className={iconCls} aria-label="My Orders" title="My Orders">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </Link>
            <button onClick={toggleTheme} className={iconCls} aria-label="Theme" title={darkMode ? 'Light' : 'Dark'}>
              {darkMode ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-12 md:py-16">
        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#2c6660] mb-3">Full catalog</p>
        <h1 className="text-4xl md:text-5xl font-black uppercase mb-3">All Prints</h1>
        <p className={`${muted} max-w-lg mb-10 leading-relaxed`}>
          Every piece is printed to order in small batches. No dead stock, no compromises.
        </p>

        {loading ? (
          <p className="font-mono text-sm">Loading...</p>
        ) : products.length === 0 ? (
          <p className={muted}>No products yet.</p>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px ${darkMode ? 'bg-[#ffffff]/15' : 'bg-[#000000]/15'} border ${border}`}>
            {products.map(p => {
              const price = Number(p.price)
              const compare = p.compare_at_price ? Number(p.compare_at_price) : null
              const discountPct = compare && compare > price ? Math.round(((compare - price) / compare) * 100) : null
              return (
                <Link key={p.id} href={`/product/${p.id}`} className={`${cardBg} group block`}>
                  <div className={`aspect-[3/4] ${darkMode ? 'bg-[#111111]' : 'bg-[#e9e1d1]'} relative overflow-hidden`}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-mono opacity-40">No image</div>
                    )}
                    {p.tag && (
                      <span className="absolute top-3 left-3 bg-[#000000] text-[#ffffff] text-[10px] font-mono uppercase tracking-wider px-2 py-1">{p.tag}</span>
                    )}
                    {discountPct && (
                      <span className="absolute top-3 right-3 bg-[#bd4632] text-white text-[10px] font-mono uppercase px-2 py-1">{discountPct}% OFF</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className={`text-[10px] font-mono uppercase ${muted} mb-1`}>{p.category || 'Apparel'}</p>
                    <h3 className="font-semibold text-[15px] mb-1">{p.name}</h3>
                    <p className={`text-xs ${muted} mb-2`}>{p.sizes || 'S · M · L · XL'}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-[#2c6660]">₹{price.toLocaleString('en-IN')}</p>
                      {compare && compare > price && (
                        <p className={`font-mono text-xs line-through ${muted}`}>₹{compare.toLocaleString('en-IN')}</p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <footer className={`border-t ${border} py-8`}>
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono uppercase tracking-wider justify-center">
          <Link href="/" className="hover:text-[#2c6660]">Home</Link>
          <Link href="/page/about" className="hover:text-[#2c6660]">About</Link>
          <Link href="/page/terms" className="hover:text-[#2c6660]">Terms</Link>
          <Link href="/page/privacy" className="hover:text-[#2c6660]">Privacy</Link>
        </div>
      </footer>
    </div>
  )
}