'use client'
import { Suspense, useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Modules from './module/Modules'
import { CreateModule } from './module/explorer/ModuleCreate'

function TerminalLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-green-500 font-mono text-xl">
        <span>LOADING SYSTEM</span>
        <span className="cursor">_</span>
      </div>
    </div>
  )
}

export default function Home() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const refreshRef = useRef<(() => void) | null>(null)

  // Listen for search params changes
  useEffect(() => {
    const search = searchParams.get('search') || ''
    setSearchTerm(search)
  }, [searchParams])

  // Listen for global events from Header
  useEffect(() => {
    const handleCreateModule = () => setShowCreateForm(true)
    const handleRefreshModules = () => {
      if (refreshRef.current) {
        refreshRef.current()
      }
    }

    window.addEventListener('createModule', handleCreateModule)
    window.addEventListener('refreshModules', handleRefreshModules)

    return () => {
      window.removeEventListener('createModule', handleCreateModule)
      window.removeEventListener('refreshModules', handleRefreshModules)
    }
  }, [])

  const handleCloseCreateForm = useCallback(() => {
    setShowCreateForm(false)
  }, [])

  const handleCreateSuccess = useCallback(() => {
    setShowCreateForm(false)
    if (refreshRef.current) {
      refreshRef.current()
    }
  }, [])

  return (
    <>
      {/* Create Module Modal */}
      {showCreateForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black'>
          <div className='border border-green-500 bg-black p-4'>
            <CreateModule
              onClose={handleCloseCreateForm}
              onSuccess={handleCreateSuccess}
            />
          </div>
        </div>
      )}
      
      <Suspense fallback={<TerminalLoading />}>
        <Modules 
          searchTerm={searchTerm} 
          onRefresh={(fn) => { refreshRef.current = fn }}
        />
      </Suspense>
    </>
  )
}