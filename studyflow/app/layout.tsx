import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StudyFlow - Smart Study Planner for Indian Students',
  description: 'All-in-one AI-powered study planner + tracker for JEE, NEET, Board exams. Just ₹100/month.',
  keywords: ['study planner', 'JEE', 'NEET', 'board exams', 'study tracker', 'India'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
