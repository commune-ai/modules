'use client'
import Link from 'next/link'
import { useState, FormEvent, useEffect } from 'react'
import { Key } from '@/app/user/key'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { RefreshCw, LogOut, User, Search } from 'lucide-react'
import { UserProfile } from '@/app/user/profile/UserProfile'
import type { User as UserType } from '@/app/types/user'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'

interface HeaderProps {
  onSearch?: (term: string) => void
  onRefresh?: () => void
}

export const Header = ({ onSearch, onRefresh }: HeaderProps = {}) => {
  const [password, setPassword] = useState('')
  const [keyInstance, setKeyInstance] = useState<Key | null>(null)
  const [user, setUser] = useState<UserType | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  // Store user session in localStorage to persist across pages
  useEffect(() => {
    const initializeUser = async () => {
      const storedUser = localStorage.getItem('dhub_user')
      const storedPassword = localStorage.getItem('dhub_password')
      
      if (storedUser && storedPassword) {
        try {
          await cryptoWaitReady()
          const userData = JSON.parse(storedUser)
          const key = new Key(storedPassword)
          setUser(userData)
          setKeyInstance(key)
        } catch (error) {
          console.error('Failed to restore user session:', error)
          // Clear invalid session data
          localStorage.removeItem('dhub_user')
          localStorage.removeItem('dhub_password')
        }
      }
    }
    
    initializeUser()
  }, [])

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await cryptoWaitReady()
      const key = new Key(password)
      setKeyInstance(key)
      const userData = {
        address: key.address,
        crypto_type: key.crypto_type,
      }
      setUser(userData)
      
      // Store user session with encrypted password
      localStorage.setItem('dhub_user', JSON.stringify(userData))
      localStorage.setItem('dhub_password', password)
      
      setPassword('')
      setShowProfile(true) // Auto-open profile on login
    } catch (error) {
      console.error('Failed to create key:', error)
    }
  }

  const handleLogout = () => {
    setKeyInstance(null)
    setUser(null)
    setShowProfile(false)
    localStorage.removeItem('dhub_user')
    localStorage.removeItem('dhub_password')
  }

  const handleRefreshClick = () => {
    if (onRefresh) {
      onRefresh()
    } else if (pathname === '/') {
      // Trigger refresh via global event
      window.dispatchEvent(new CustomEvent('refreshModules'))
    }
  }

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      // Trigger search via global event for module explorer
      window.dispatchEvent(new CustomEvent('searchModules', { detail: searchQuery }))
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    // Real-time search
    if (onSearch) {
      onSearch(value)
    } else {
      window.dispatchEvent(new CustomEvent('searchModules', { detail: value }))
    }
  }

  return (
    <>
      <header className="fixed top-0 z-30 w-full bg-black border-b border-green-500 font-mono">
        <nav className="p-4 px-4 mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Logo only */}
            <Link href="/" className="flex items-center group">
              <div className="relative w-48 h-16">
                <Image
                  src="/commune-ai-logo.svg"
                  alt="Commune AI"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Center - Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
              <div className="flex items-center gap-2 px-3 py-2 border border-green-500 hover:border-green-400 transition-colors">
                <Search size={18} className="text-green-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="SEARCH MODULES..."
                  className="flex-1 bg-transparent text-green-500 placeholder-green-500/50 focus:outline-none font-mono uppercase text-sm"
                />
              </div>
            </form>

            {/* Right side - Refresh Button and User Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshClick}
                className="h-12 w-12 flex items-center justify-center border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors"
                title="Refresh"
              >
                <RefreshCw size={20} />
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className={`h-12 px-4 border-2 border-green-500 font-mono transition-all uppercase text-base tracking-wider flex items-center gap-3 group ${
                      showProfile 
                        ? 'bg-green-500 text-black' 
                        : 'text-green-500 hover:bg-green-500 hover:text-black'
                    }`}
                    title={`Address: ${user.address}`}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      showProfile
                        ? 'border-black bg-black/20'
                        : 'border-green-500 group-hover:border-black'
                    }`}>
                      <User size={18} className={showProfile ? 'text-black' : 'text-green-500 group-hover:text-black'} />
                    </div>
                    <span className="font-bold">{user.address.slice(0, 6)}...</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="h-12 w-12 flex items-center justify-center border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSignIn} className="flex gap-3">
                  <input
                    type="password"
                    placeholder="ENTROPY"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 px-4 bg-black border border-green-500 text-green-500 placeholder-green-500/50 focus:outline-none focus:border-green-400 w-36 font-mono uppercase text-sm"
                  />
                  <button
                    type="submit"
                    className="h-12 px-6 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-mono uppercase text-sm tracking-wider transition-colors"
                  >
                    LOGIN
                  </button>
                </form>
              )}
            </div>
          </div>
        </nav>
      </header>
      
      {/* User Profile Sidebar - Right side */}
      {user && keyInstance && (
        <UserProfile
          user={user}
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          keyInstance={keyInstance}
          onLogout={handleLogout}
        />
      )}
    </>
  )
}

export default Header