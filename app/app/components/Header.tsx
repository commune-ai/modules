'use client'
import Link from 'next/link'
import { useState, FormEvent, useEffect } from 'react'
import { Key } from '@/app/user/key'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { Search, Plus, RefreshCw, User as UserIcon } from 'lucide-react'
import { UserProfile } from '@/app/user/profile/UserProfile'
import type { User } from '@/app/types/user'
import { useRouter, usePathname } from 'next/navigation'
import { CopyButton } from './CopyButton'

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
    const initializeFromStorage = async () => {
      const storedUser = localStorage.getItem('dhub_user')
      const storedKeyData = localStorage.getItem('dhub_key_data')
      
      if (storedUser && storedKeyData) {
        try {
          await cryptoWaitReady()
          const userData = JSON.parse(storedUser)
          const keyData = JSON.parse(storedKeyData)
          
          // Recreate the key instance from stored data
          const key = new Key()
          // Set the properties from stored data
          Object.assign(key, keyData)
          
          setUser(userData)
          setKeyInstance(key)
        } catch (error) {
          console.error('Failed to restore user session:', error)
          // Clear invalid storage
          localStorage.removeItem('dhub_user')
          localStorage.removeItem('dhub_key_data')
        }
      }
    }
    
    initializeFromStorage()
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
      
      // Store user session with key data
      localStorage.setItem('dhub_user', JSON.stringify(userData))
      // Store key data for restoration
      const keyData = {
        address: key.address,
        public_key: key.public_key,
        crypto_type: key.crypto_type,
        // Note: We don't store private key for security
      }
      localStorage.setItem('dhub_key_data', JSON.stringify(keyData))
      
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
    localStorage.removeItem('dhub_key_data')
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-2 px-3 py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-mono transition-colors"
                    title="Open profile"
                  >
                    <UserIcon size={16} />
                    <span>{user.address.slice(0, 6)}...</span>
                  </button>
                  <CopyButton code={user.address} />
                </div>
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
      
      {/* User Profile Sidebar - Only render if keyInstance exists */}
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