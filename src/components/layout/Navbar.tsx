'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, User, LogOut } from 'lucide-react'

export const Navbar = () => {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-slate-900">
          BuildSmart AI
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
          <Link href="/#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
          
          {session ? (
             <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <User size={16} />
                  {session.user?.name || session.user?.email}
                </span>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 text-slate-600 hover:text-red-600 transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
                <Link href="/app" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Go to App
                </Link>
             </div>
          ) : (
            <>
              <Link href="/auth/signin" className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors">
                Sign In
              </Link>
              <Link href="/app" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-slate-600"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 py-4 px-6 space-y-4">
          <Link href="/#features" className="block text-slate-600">Features</Link>
          <Link href="/#pricing" className="block text-slate-600">Pricing</Link>
          {session ? (
            <>
              <div className="text-sm text-slate-500 pb-2 border-b border-slate-100">
                Signed in as {session.user?.email}
              </div>
              <Link href="/app" className="block text-blue-600 font-medium">
                Go to App
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="block text-red-600 w-full text-left"
              >
                Sign Out
              </button>
            </>
          ) : (
             <>
               <Link href="/auth/signin" className="block text-slate-600">Sign In</Link>
               <Link href="/app" className="block text-blue-600 font-medium">Get Started</Link>
             </>
          )}
        </div>
      )}
    </nav>
  )
}
