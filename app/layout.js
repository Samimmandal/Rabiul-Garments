export const dynamic = 'force-dynamic'

import './globals.css'

export const metadata = {
  title: 'Artbit — Screen-Printed Apparel',
  description: 'Small-batch screen print house',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}