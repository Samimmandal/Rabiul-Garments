'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

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

  return (
    <div className="min-h-screen bg-[#f2ede1] text-[#1b1b18]">
      {/* Header */}
      <header className="border-b border-[#1b1b18]/20 sticky top-0 bg-[#f2ede1] z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl uppercase tracking-tight">
            Artbit
          </Link>
          <nav className="hidden md:flex gap-7 text-xs font-semibold uppercase tracking-widest">
            <Link href="/shop" className="hover:text-[#2c6660] transition">Shop</Link>
            <a href="#custom" className="hover:text-[#2c6660] transition">Custom Prints</a>
            <a href="#process" className="hover:text-[#2c6660] transition">Process</a>
            <a href="#contact" className="hover:text-[#2c6660] transition">Contact</a>
          </nav>
          <Link href="/admin/login" className="text-[11px] font-mono uppercase border border-[#1b1b18] px-3 py-1.5 hover:bg-[#1b1b18] hover:text-[#f2ede1] transition">
            Admin
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24 border-b border-[#1b1b18]/15">
        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#2c6660] mb-5">
          Small-batch screen print house
        </p>

        <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-black uppercase leading-[0.92] tracking-tight">
          Printed by<br />
          Hand, Worn<br />
          On Purpose.
        </h1>

        <p className="max-w-md text-[#4a453d] mt-6 text-[15px] leading-relaxed">
          Every tee, hoodie and tote passes through our press before it reaches yours — mixed inks, hand-pulled squeegees, zero shortcuts.
        </p>

        <div className="flex flex-wrap gap-3 mt-8">
          <Link href="/shop" className="bg-[#1b1b18] text-[#f2ede1] px-6 py-3.5 font-mono text-xs uppercase tracking-wider hover:bg-transparent hover:text-[#1b1b18] border border-[#1b1b18] transition">
            Shop the Line
          </Link>
          <a href="#custom" className="border border-[#1b1b18] px-6 py-3.5 font-mono text-xs uppercase tracking-wider hover:bg-[#1b1b18] hover:text-[#f2ede1] transition">
            Start a Custom Order
          </a>
        </div>
      </section>

      {/* Category Strip */}
      <section className="border-b border-[#1b1b18]/15">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { num: '01', name: 'Tees' },
            { num: '02', name: 'Hoodies' },
            { num: '03', name: 'Oversized' },
            { num: '04', name: 'Kids' },
          ].map((cat, i) => (
            <Link
              key={cat.name}
              href="/shop"
              className={`p-6 md:p-8 min-h-[130px] flex flex-col justify-between hover:bg-[#e9e1d1] transition border-[#1b1b18]/15 ${
                i % 2 === 1 ? 'border-l' : ''
              } ${i >= 2 ? 'border-t md:border-t-0' : ''} md:border-l ${i === 0 ? 'md:border-l-0' : ''}`}
            >
              <span className="text-[11px] font-mono text-[#2c6660]">{cat.num}</span>
              <div className="flex items-end justify-between">
                <h3 className="text-xl font-black uppercase">{cat.name}</h3>
                <span className="font-mono text-sm">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#2c6660] mb-1">On press this week</p>
              <h2 className="text-3xl md:text-4xl font-black uppercase">Featured Prints</h2>
            </div>
            <Link href="/shop" className="text-xs font-mono border-b border-[#1b1b18] pb-0.5 hover:text-[#2c6660] transition shrink-0">
              View full catalog →
            </Link>
          </div>

          {loading ? (
            <p className="font-mono text-sm">Loading...</p>
          ) : products.length === 0 ? (
            <p className="text-gray-500">No featured products yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1b1b18]/15 border border-[#1b1b18]/15">
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
                    <p className="text-xs text-gray-500 mb-2">{p.sizes || 'S · M · L · XL'}</p>
                    <p className="font-mono text-sm text-[#2c6660]">₹{Number(p.price).toLocaleString('en-IN')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Custom Banner */}
      <section id="custom" className="bg-[#1b1b18] text-[#f2ede1] py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#e2a233] mb-3">Bring your own art</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase leading-tight mb-5">
              Design It.<br />We'll Press It.
            </h2>
            <p className="text-[#cfc9bb] max-w-md mb-8 leading-relaxed">
              Upload your artwork or sketch an idea with us — we'll match inks, pick the right garment, and print a sample before the full run ever hits the press.
            </p>
            <a href="#contact" className="inline-block bg-[#e2a233] text-[#1b1b18] px-6 py-3.5 font-mono text-xs uppercase tracking-wider hover:bg-[#f2ede1] transition">
              Start Your Design
            </a>
          </div>
          <div className="aspect-square bg-[repeating-linear-gradient(45deg,#2c6660_0_2px,transparent_2px_22px)] bg-[#e9e1d1] relative flex items-center justify-center">
            <span className="bg-[#f2ede1] text-[#1b1b18] px-4 py-2 font-mono text-xs uppercase tracking-wider">
              Your Art Here
            </span>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="py-16 md:py-20 border-b border-[#1b1b18]/15">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#2c6660] mb-1">How a print gets made</p>
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-10">The Artbit Process</h2>

          <div className="grid md:grid-cols-3 border border-[#1b1b18]/15">
            {[
              { num: '01 / Art', title: 'Separate the art', desc: 'We break your design into layers, one screen per colour, checking registration before a single squeegee pass.' },
              { num: '02 / Press', title: 'Pull the print', desc: 'Each garment is loaded by hand and printed one pass at a time on our manual press — no shortcuts.' },
              { num: '03 / Cure', title: 'Cure & finish', desc: 'Ink is flash-cured for durability, then every piece is folded, tagged and quality-checked before it ships.' },
            ].map((step, i) => (
              <div key={step.num} className={`p-6 md:p-8 ${i < 2 ? 'border-b md:border-b-0 md:border-r border-[#1b1b18]/15' : ''}`}>
                <span className="text-xs font-mono text-[#bd4632] block mb-3">{step.num}</span>
                <h3 className="text-lg font-black uppercase mb-3">{step.title}</h3>
                <p className="text-sm text-[#4a453d] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#2c6660] mb-2">Let's talk prints</p>
          <h2 className="text-3xl font-black uppercase mb-4">Have a Custom Order in Mind?</h2>
          <p className="text-[#4a453d] max-w-md mb-6 leading-relaxed">
            Tell us about the run — quantity, garment, deadline — and we'll get back with a quote within one business day.
          </p>
          <p className="font-mono text-sm">
            Email: <a href="mailto:hello@artbit.com" className="underline hover:text-[#2c6660]">hello@artbit.com</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1b1b18]/15 py-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] font-mono text-gray-500">
          <span>© 2026 Artbit Print Co. All rights reserved.</span>
          <span>Printed to order, batch by batch.</span>
        </div>
      </footer>
    </div>
  )
}