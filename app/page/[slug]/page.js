'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function SitePage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) fetchPage()
  }, [slug])

  const fetchPage = async () => {
    const { data } = await supabase
      .from('site_pages')
      .select('*')
      .eq('id', slug)
      .single()
    setPage(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2ede1] flex items-center justify-center">
        <p className="font-mono text-sm">Loading...</p>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-[#f2ede1] flex flex-col items-center justify-center gap-4">
        <p className="font-mono">Page not found</p>
        <Link href="/" className="underline text-sm">← Home</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2ede1] text-[#1b1b18]">
      <header className="border-b border-[#1b1b18]/20 sticky top-0 bg-[#f2ede1] z-50">
        <div className="max-w-6xl mx-auto px-5 py-4 flex justify-between items-center">
          <Link href="/" className="font-black text-xl uppercase">Artbit</Link>
          <Link href="/" className="text-xs font-mono uppercase hover:underline">← Home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-black uppercase mb-8">{page.title}</h1>
        <div className="prose prose-sm max-w-none text-[#4a453d] leading-relaxed whitespace-pre-wrap">
          {page.content}
        </div>

        {page.id === 'hiring' && (
          <div className="mt-10 space-y-4">
            {page.link_url && (
              <a
                href={page.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#2c6660] text-white px-6 py-3 font-mono text-sm uppercase"
              >
                Apply / WhatsApp
              </a>
            )}
            <a
              href={`https://wa.me/91YOUR_NUMBER?text=${encodeURIComponent('Hi, I am interested in joining Artbit.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-[#1b1b18] px-6 py-3 font-mono text-sm uppercase ml-0 sm:ml-3"
            >
              Message on WhatsApp
            </a>
          </div>
        )}
      </main>
    </div>
  )
}