'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }) {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('artbit-theme')
    if (saved === 'dark') setDarkMode(true)
  }, [])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('artbit-theme', next ? 'dark' : 'light')
  }

  const bg = darkMode ? 'bg-[#1b1b18]' : 'bg-[#f2ede1]'
  const text = darkMode ? 'text-[#f2ede1]' : 'text-[#1b1b18]'

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={toggleTheme}
          className={`text-[11px] font-mono uppercase border px-4 py-2 shadow-lg transition ${
            darkMode
              ? 'bg-[#252522] border-[#f2ede1]/30 text-[#f2ede1] hover:bg-[#f2ede1] hover:text-[#1b1b18]'
              : 'bg-white border-[#1b1b18] text-[#1b1b18] hover:bg-[#1b1b18] hover:text-white'
          }`}
        >
          {darkMode ? '☀ Light' : '☾ Dark'}
        </button>
      </div>
      {children}
    </div>
  )
}