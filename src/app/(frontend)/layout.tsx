import React from 'react'
import './styles.css'

export const metadata = {
  description:
    'AI-powered UI which generates document outline for user after asking user a series of increasingly specific questions about what they plan on writing a document about.',
  title: 'AI document outline generator',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
