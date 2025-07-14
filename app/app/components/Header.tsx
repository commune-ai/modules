'use client'
import Link from 'next/link'
import { useState, FormEvent, useEffect } from 'react'
import { Key } from '@/app/user/key'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { Search, Plus, RefreshCw } from 'lucide-react'
import { UserProfile } from '@/app/user/profile/UserProfile'
import type { User } from '@/app/types/user'
import { useRouter, usePathname } from 'next/navigation'

interface HeaderProps {
  onSearch?: (term: string) => void
  onRefresh?: () => void
  onCreateModule?: () => void
}

export const Header = ({ onSearch, onRefresh, onCreateModule }: HeaderProps = {}) => {
  const [password, setPassword] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [keyInstance, setKeyInstance] = useState<Key | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Store user session in localStorage to persist across pages
  useEffect(() => {
    const storedUser = localStorage.getItem('dhub_user')
    const storedKey = localStorage.getItem('dhub_key')
    if (storedUser && storedKey) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        // Note: We can't fully restore the Key instance from localStorage
        // but we can maintain the user session appearance
      } catch (error) {
        console.error('Failed to restore user session:', error)
      }
    }
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    if (onSearch) {
      onSearch(value)
    } else if (pathname === '/') {
      // If we're on the home page, trigger a search via URL params
      const params = new URLSearchParams(window.location.search)
      if (value) {
        params.set('search', value)
      } else {
        params.delete('search')
      }
      router.push(`/?${params.toString()}`)
    }
  }

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
      
      // Store user session
      localStorage.setItem('dhub_user', JSON.stringify(userData))
      localStorage.setItem('dhub_key', 'true') // Just a flag
      
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
    localStorage.removeItem('dhub_key')
  }

  const handleCreateClick = () => {
    if (onCreateModule) {
      onCreateModule()
    } else if (pathname === '/') {
      // Trigger create module via URL params or global event
      window.dispatchEvent(new CustomEvent('createModule'))
    }
  }

  const handleRefreshClick = () => {
    if (onRefresh) {
      onRefresh()
    } else if (pathname === '/') {
      // Trigger refresh via global event
      window.dispatchEvent(new CustomEvent('refreshModules'))
    }
  }

  return (
    <>
      <header className="fixed top-0 z-50 w-full bg-black border-b border-green-500 font-mono">
        <nav className="p-3 px-5 mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="text-green-500 text-4xl font-bold">©</Link>

            {/* Search Bar */}
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="flex-1 max-w-2xl px-3 py-2 bg-black border border-green-500 text-green-500 placeholder-green-500/50 focus:outline-none font-mono uppercase"
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {pathname === '/' && (
                <>
                  <button
                    onClick={handleCreateClick}
                    className="p-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black"
                    title="Create"
                  >
                    <Plus size={18} />
                  </button>

                  <button
                    onClick={handleRefreshClick}
                    className="p-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black"
                    title="Refresh"
                  >
                    <RefreshCw size={18} />
                  </button>
                </>
              )}

              {/* User Section */}
              {user ? (
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="px-3 py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-mono"
                >
                  {user.address.slice(0, 6)}...
                </button>
              ) : (
                <form onSubmit={handleSignIn} className="flex gap-2">
                  <input
                    type="password"
                    placeholder="PASSWORD"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="px-3 py-2 bg-black border border-green-500 text-green-500 placeholder-green-500/50 focus:outline-none w-32 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-mono"
                  >
                    LOGIN
                  </button>
                </form>
              )}
            </div>
          </div>
        </nav>
      </header>
      
      {/* User Profile Sidebar */}
      {user && (
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