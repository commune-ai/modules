'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Footer } from '@/app/components'
import { SearchBar } from '@/app/components/SearchBar'
import { Client } from '@/app/client/client'
import { Loading } from '@/app/components/Loading'
import ModuleCard from '@/app/module/explorer/ModuleCard'
import { CreateModule } from '@/app/module/explorer/ModuleCreate'
import { ModuleType } from '@/app/types/module'

interface ModulesState {
  modules: ModuleType[]
  totalModules: number
  loading: boolean
  error: string | null
}

export default function Modules() {
  const client = new Client()
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [state, setState] = useState<ModulesState>({
    modules: [],
    totalModules: 0,
    loading: false,
    error: null
  })

  // Memoized pagination calculations
  const totalPages = useMemo(() => 
    Math.ceil(state.totalModules / pageSize), 
    [state.totalModules, pageSize]
  )

  const hasNextPage = useMemo(() => 
    state.modules.length === pageSize && page < totalPages, 
    [state.modules.length, pageSize, page, totalPages]
  )

  const hasPrevPage = page > 1

  const fetchModules = async (currentPage?: number, search?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const pageToFetch = currentPage || page
      const searchQuery = search !== undefined ? search : searchTerm
      
      const [modulesData, totalCount] = await Promise.all([
        client.call('modules', {
          search: searchQuery, 
          page_size: pageSize, 
          page: pageToFetch
        }),
        client.call('n', { search: searchQuery })
      ])
      
      if (!Array.isArray(modulesData)) {
        throw new Error('Invalid response format')
      }

      setState({
        modules: modulesData,
        totalModules: totalCount,
        loading: false,
        error: null
      })
    } catch (err: any) {
      setState({
        modules: [],
        totalModules: 0,
        loading: false,
        error: err.message || 'Failed to fetch modules'
      })
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    setPage(newPage)
    fetchModules(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = useCallback((query: string) => {
    setSearchTerm(query)
    setPage(1)
    fetchModules(1, query)
  }, [])

  const handleCreateSuccess = () => {
    fetchModules(1)
    setShowCreateForm(false)
    setState(prev => ({ ...prev, error: null }))
  }

  useEffect(() => {
    fetchModules()
  }, [])

  const PaginationControls = () => (
    <nav className='flex items-center gap-2 font-mono text-sm' aria-label='Pagination'>
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={!hasPrevPage || state.loading}
        className='px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed uppercase transition-none'
        aria-label='Previous page'
      >
        [PREV]
      </button>
      
      <span className='px-3 text-green-500'>
        PAGE {page}/{totalPages}
      </span>
      
      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={!hasNextPage || state.loading}
        className='px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed uppercase transition-none'
        aria-label='Next page'
      >
        [NEXT]
      </button>
      
      <span className='ml-4 text-green-500' aria-live='polite'>
        TOTAL: {state.totalModules} MODULES
      </span>
    </nav>
  )

  return (
    <div className='min-h-screen bg-black text-green-500 font-mono'>
      {/* Error Banner */}
      {state.error && (
        <div className='flex items-center justify-between p-4 bg-black border border-red-500 text-red-500' role='alert'>
          <span>ERROR: {state.error}</span>
          <button 
            onClick={() => setState(prev => ({ ...prev, error: null }))} 
            className='hover:bg-red-500 hover:text-black px-2 transition-none'
            aria-label='Dismiss error'
          >
            [X]
          </button>
        </div>
      )}

      {/* Header */}
      <div className='border-b border-green-500 p-6'>
        
        {/* Search and Controls */}
        <div className='max-w-3xl mx-auto space-y-4'>
          {/* Search Bar - Case Insensitive */}
          <div className='w-full'>
            <div className='relative flex items-center'>
              <span className='absolute left-3 text-green-500'>></span>
              <input
                type='text'
                placeholder='SEARCH MODULES'
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className='w-full pl-8 pr-3 py-2 bg-black border border-green-500 text-green-500 placeholder-green-500/50 focus:outline-none focus:border-green-400 font-mono uppercase'
                style={{ textTransform: 'none' }}
              />
              <span className='absolute right-3 text-green-500 animate-pulse'>_</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-4 justify-center'>
            <button
              onClick={() => fetchModules()}
              disabled={state.loading}
              className='px-4 py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black disabled:opacity-50 uppercase transition-none'
              aria-label='Refresh modules'
            >
              [REFRESH]
            </button>

            <button
              onClick={() => setShowCreateForm(true)}
              disabled={state.loading}
              className='px-4 py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black disabled:opacity-50 uppercase transition-none'
              aria-label='Create new module'
            >
              [CREATE]
            </button>
          </div>
        </div>
      </div>

      {/* Create Module Modal */}
      {showCreateForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black'>
          <div className='border border-green-500 bg-black p-4'>
            <CreateModule
              onClose={() => setShowCreateForm(false)}
              onSuccess={handleCreateSuccess}
            />
          </div>
        </div>
      )}

      {/* Modules Grid */}
      <main className='p-6' role='main'>
        {state.loading && (
          <div className='text-center py-8'>
            <div className='text-green-500 text-xl'>LOADING...</div>
          </div>
        )}
        
        {!state.loading && state.modules.length === 0 && (
          <div className='py-8 text-center text-green-500' role='status'>
            {searchTerm ? `NO MODULES FOUND FOR "${searchTerm}".` : 'NO MODULES AVAILABLE.'}
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' role='list'>
          {state.modules.map((m) => (
            <div key={m.key} role='listitem'>
              <ModuleCard module={m} />
            </div>
          ))}
        </div>
      </main>

      {/* Pagination Controls Bottom */}
      {!state.loading && state.modules.length > 0 && (
        <div className='flex justify-center p-6 border-t border-green-500'>
          <PaginationControls />
        </div>
      )}

      <Footer />
    </div>
  )
}