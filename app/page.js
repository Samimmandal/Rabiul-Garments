'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('artbit-theme')
    if (saved === 'dark') setDarkMode(true)
    fetchProducts()
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) saveProfile(session.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('artbit-theme', next ? 'dark' : 'light')
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const saveProfile = async (user) => {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      updated_at: new Date().toISOString()
    })
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(4)
    setProducts(data || [])
    setLoading(false)
  }

  const bg = darkMode ? 'bg-[#1b1b18]' : 'bg-[#f2ede1]'
  const text = darkMode ? 'text-[#f2ede1]' : 'text-[#1b1b18]'
  const muted = darkMode ? 'text-gray-400' : 'text-[#4a453d]'
  const border = darkMode ? 'border-[#f2ede1]/15' : 'border-[#1b1b18]/15'
  const cardBg = darkMode ? 'bg-[#252522]' : 'bg-[#f2ede1]'
  const hoverBg = darkMode ? 'hover:bg-[#2a2a27]' : 'hover:bg-[#e9e1d1]'
  const iconBtn = `inline-flex items-center justify-center w-10 h-10 border transition ${
    darkMode
      ? 'border-[#f2ede1]/30 hover:bg-[#f2ede1] hover:text-[#1b1b18]'
      : 'border-[#1b1b18] hover:bg-[#1b1b18] hover:text-[#f2ede1]'
  }`

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      <header className={`border-b ${border} sticky top-0 ${bg} z-50`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl uppercase tracking-tight">Artbit</Link>
          <nav className="hidden md:flex gap-7 text-xs font-semibold uppercase tracking-widest">
            <Link href="/shop" className="hover:text-[#2c6660] transition">Shop</Link>
            <a href="#custom" className="hover:text-[#2c6660] transition">Custom Prints</a>
            <a href="#process" className="hover:text-[#2c6660] transition">Process</a>
            <a href="#contact" className="hover:text-[#2c6660] transition">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            {/* Dark / Light */}
            <button onClick={toggleTheme} className={iconBtn} aria-label="Toggle theme" title={darkMode ? 'Light' : 'Dark'}>
              {darkMode ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            {/* Cart */}
            <Link href="/cart" className={iconBtn} aria-label="Cart" title="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </Link>
            {/* Orders */}
            <Link href="/account" className={iconBtn} aria-label="My Orders" title="My Orders">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
            </Link>
            {/* Login / Logout */}
            {user ? (
              <button onClick={handleLogout} className={iconBtn} aria-label="Logout" title="Logout">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            ) : (
              <button onClick={handleGoogleLogin} className={iconBtn} aria-label="Login" title="Login">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </button>
            )}
            {/* Admin */}
            <Link href="/admin/login" className={`${iconBtn} hidden sm:inline-flex`} aria-label="Admin" title="Admin">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </Link>
          </div>
        </div>
      </header>

      <section className={`max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24 border-b ${border}`}>
        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#2c6660] mb-5">Small-batch screen print house</p>
        <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-black uppercase leading-[0.92] tracking-tight">
          Printed by<br />Hand, Worn<br />On Purpose.
        </h1>
        <p className={`max-w-md ${muted} mt-6 text-[15px] leading-relaxed`}>
          Every tee, hoodie and tote passes through our press before it reaches yours — mixed inks, hand-pulled squeegees, zero shortcuts.
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link href="/shop" className="bg-[#1b1b18] text-[#f2ede1] px-6 py-3.5 font-mono text-xs uppercase tracking-wider border border-[#1b1b18] hover:opacity-90 transition">Shop the Line</Link>
          <a href="#custom" className={`border px-6 py-3.5 font-mono text-xs uppercase tracking-wider transition ${darkMode ? 'border-[#f2ede1]/40 hover:bg-[#f2ede1] hover:text-[#1b1b18]' : 'border-[#1b1b18] hover:bg-[#1b1b18] hover:text-[#f2ede1]'}`}>Start a Custom Order</a>
        </div>
      </section>

      <section className={`border-b ${border}`}>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { num: '01', name: 'Tees' },
            { num: '02', name: 'Hoodies' },
            { num: '03', name: 'Oversized' },
            { num: '04', name: 'Kids' },
          ].map((cat, i) => (
            <Link key={cat.name} href="/shop" className={`p-6 md:p-8 min-h-[130px] flex flex-col justify-between ${hoverBg} transition ${border} ${i % 2 === 1 ? 'border-l' : ''} ${i >= 2 ? 'border-t md:border-t-0' : ''} md:border-l ${i === 0 ? 'md:border-l-0' : ''}`}>
              <span className="text-[11px] font-mono text-[#2c6660]">{cat.num}</span>
              <div className="flex items-end justify-between">
                <h3 className="text-xl font-black uppercase">{cat.name}</h3>
                <span className="font-mono text-sm">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#2c6660] mb-1">On press this week</p>
              <h2 className="text-3xl md:text-4xl font-black uppercase">Featured Prints</h2>
            </div>
            <Link href="/shop" className="text-xs font-mono border-b border-current pb-0.5 hover:text-[#2c6660] transition shrink-0">View full catalog →</Link>
          </div>
          {loading ? (
            <p className="font-mono text-sm">Loading...</p>
          ) : products.length === 0 ? (
            <p className={muted}>No featured products yet.</p>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px ${darkMode ? 'bg-[#f2ede1]/10' : 'bg-[#1b1b18]/15'} border ${border}`}>
              {products.map(p => (
                <Link href={`/product/${p.id}`} key={p.id} className={`${cardBg} group block`}>
                  <div className={`aspect-[4/5] ${darkMode ? 'bg-[#2a2a27]' : 'bg-[#e9e1d1]'} relative overflow-hidden`}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-mono opacity-40">No image</div>
                    )}
                    {p.tag && (
                      <span className="absolute top-3 left-3 bg-[#1b1b18] text-[#f2ede1] text-[10px] font-mono uppercase tracking-wider px-2 py-1">{p.tag}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[15px] mb-1">{p.name}</h3>
                    <p className={`text-xs ${muted} mb-2`}>{p.sizes || 'S · M · L · XL'}</p>
                    <p className="font-mono text-sm text-[#2c6660]">₹{Number(p.price).toLocaleString('en-IN')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="custom" className="bg-[#1b1b18] text-[#f2ede1] py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#e2a233] mb-3">Bring your own art</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase leading-tight mb-5">Design It.<br />We'll Press It.</h2>
            <p className="text-[#cfc9bb] max-w-md mb-8 leading-relaxed">Upload your artwork or sketch an idea with us — we'll match inks, pick the right garment, and print a sample before the full run ever hits the press.</p>
            <a href="#contact" className="inline-block bg-[#e2a233] text-[#1b1b18] px-6 py-3.5 font-mono text-xs uppercase tracking-wider hover:bg-[#f2ede1] transition">Start Your Design</a>
          </div>
          <div className="aspect-square bg-[repeating-linear-gradient(45deg,#2c6660_0_2px,transparent_2px_22px)] bg-[#e9e1d1] relative flex items-center justify-center">
            <span className="bg-[#f2ede1] text-[#1b1b18] px-4 py-2 font-mono text-xs uppercase tracking-wider">Your Art Here</span>
          </div>
        </div>
      </section>

      <section id="process" className={`py-16 md:py-20 border-b ${border}`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#2c6660] mb-1">How a print gets made</p>
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-10">The Artbit Process</h2>
          <div className={`grid md:grid-cols-3 border ${border}`}>
            {[
              { num: '01 / Art', title: 'Separate the art', desc: 'We break your design into layers, one screen per colour, checking registration before a single squeegee pass.' },
              { num: '02 / Press', title: 'Pull the print', desc: 'Each garment is loaded by hand and printed one pass at a time on our manual press — no shortcuts.' },
              { num: '03 / Cure', title: 'Cure & finish', desc: 'Ink is flash-cured for durability, then every piece is folded, tagged and quality-checked before it ships.' },
            ].map((step, i) => (
              <div key={step.num} className={`p-6 md:p-8 ${i < 2 ? `border-b md:border-b-0 md:border-r ${border}` : ''}`}>
                <span className="text-xs font-mono text-[#bd4632] block mb-3">{step.num}</span>
                <h3 className="text-lg font-black uppercase mb-3">{step.title}</h3>
                <p className={`text-sm ${muted} leading-relaxed`}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#2c6660] mb-2">Let's talk prints</p>
          <h2 className="text-3xl font-black uppercase mb-4">Have a Custom Order in Mind?</h2>
          <p className={`${muted} max-w-md mb-8 leading-relaxed`}>Tell us about the run — quantity, garment, deadline — and we'll get back with a quote within one business day.</p>
          <div className="flex flex-wrap items-center gap-3">
            <a href="https://www.instagram.com/artbit.co.in?igsh=ZHJyNXFhb2VwY2xr" target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href="https://www.facebook.com/share/19Eop63Sz3/" target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="mailto:artbit.hq@gmail.com" className={iconBtn} aria-label="Email">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
            </a>
          </div>
        </div>
      </section>

      <footer className={`border-t ${border} py-10`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <span className="font-black text-lg uppercase">Artbit</span>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono uppercase tracking-wider">
              <Link href="/page/about" className="hover:text-[#2c6660] transition">About Us</Link>
              <Link href="/page/terms" className="hover:text-[#2c6660] transition">Terms & Conditions</Link>
              <Link href="/page/privacy" className="hover:text-[#2c6660] transition">Privacy Policy</Link>
              <Link href="/page/hiring" className="hover:text-[#2c6660] transition">We Are Hiring</Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] font-mono text-gray-500 border-t border-current/10 pt-6">
            <span>© 2026 Artbit Print Co. All rights reserved.</span>
            <span>Printed to order, batch by batch.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}