'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Footer } from '@/app/components'
import { Client } from '@/app/client/client'
import { Loading } from '@/app/components/Loading'
import ModuleCard from '@/app/module/explorer/ModuleCard'
import { CreateModule } from '@/app/module/explorer/ModuleCreate'
import { ModuleType } from '@/app/types/module'
import { AdvancedSearch, SearchFilters } from '@/app/module/explorer/search'
import { filterModules } from '@/app/module/explorer/search'
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'

interface ModulesState {
  modules: ModuleType[]
  allModules: ModuleType[]  // Store all modules for client-side filtering
  totalModules: number
  loading: boolean
  error: string | null
}

export default function Modules() {
  const client = new Client()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(true) // Default to open
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: '',
    includeTags: [],
    excludeTags: [],
    includeTerms: [],
    excludeTerms: []
  })
  const [state, setState] = useState<ModulesState>({
    modules: [],
    allModules: [],
    totalModules: 0,
    loading: false,
    error: null
  })

  // Apply client-side filtering
  const filteredModules = useMemo(() => {
    if (!searchFilters.searchTerm && 
        searchFilters.includeTerms.length === 0 &&
        searchFilters.excludeTerms.length === 0) {
      return state.modules
    }
    return filterModules(state.modules, searchFilters)
  }, [state.modules, searchFilters])

  // Pagination calculations
  const totalFilteredPages = Math.ceil(filteredModules.length / pageSize)
  const paginatedModules = filteredModules.slice((page - 1) * pageSize, page * pageSize)
  const hasNextPage = page < totalFilteredPages
  const hasPrevPage = page > 1

  const fetchModules = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Fetch all modules for client-side filtering
      const [modulesData, totalCount] = await Promise.all([
        client.call('modules', { page_size: 1000 }), // Get more modules for better filtering
        client.call('n', {})
      ])
      
      if (!Array.isArray(modulesData)) {
        throw new Error('Invalid response format')
      }

      setState({
        modules: modulesData,
        allModules: modulesData,
        totalModules: totalCount,
        loading: false,
        error: null
      })
    } catch (err: any) {
      setState({
        modules: [],
        allModules: [],
        totalModules: 0,
        loading: false,
        error: err.message || 'Failed to fetch modules'
      })
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalFilteredPages) return
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters)
    setPage(1) // Reset to first page on search
  }, [])

  const handleCreateSuccess = () => {
    fetchModules()
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
        PAGE {page}/{totalFilteredPages || 1}
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
        SHOWING: {paginatedModules.length} / {filteredModules.length} FILTERED
      </span>
    </nav>
  )

  return (
    <div className='min-h-screen bg-black text-green-500 font-mono flex'>
      {/* Left Side Panel - Advanced Search */}
      <div className={`fixed left-0 top-16 h-full bg-black border-r border-green-500 transition-all duration-300 z-40 ${showAdvancedSearch ? 'w-80' : 'w-0'} overflow-hidden`}>
        <div className='p-4 h-full overflow-y-auto'>
          {/* Header with Toggle Button */}
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-green-500 text-lg font-bold uppercase flex items-center gap-2'>
              <Filter size={20} />
              Search & Filters
            </h2>
            <button
              onClick={() => setShowAdvancedSearch(false)}
              className='p-1 text-green-500 hover:text-green-400'
              aria-label='Close search panel'
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          
          {/* Search and Filters */}
          <AdvancedSearch
            onSearch={handleSearch}
            availableTags={[]}
            isExpanded={true}
            onToggleExpanded={() => {}}
          />
          
          {/* Quick Stats */}
          <div className='mt-6 pt-6 border-t border-green-500/30'>
            <h3 className='text-green-500 text-sm font-bold mb-3 uppercase'>Module Stats</h3>
            <div className='space-y-2 text-xs'>
              <div className='flex justify-between'>
                <span className='text-green-500/70'>Total Modules:</span>
                <span className='text-green-500'>{state.totalModules}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-green-500/70'>Filtered:</span>
                <span className='text-green-500'>{filteredModules.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toggle Button when panel is closed */}
      {!showAdvancedSearch && (
        <button
          onClick={() => setShowAdvancedSearch(true)}
          className='fixed left-4 top-24 p-2 bg-black border border-green-500 text-green-500 hover:bg-green-500 hover:text-black z-50'
          aria-label='Open search panel'
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showAdvancedSearch ? 'ml-80' : 'ml-0'}`}>
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
          
          {!state.loading && paginatedModules.length === 0 && (
            <div className='py-8 text-center text-green-500' role='status'>
              {searchFilters.searchTerm || searchFilters.includeTerms.length > 0 || searchFilters.excludeTerms.length > 0
                ? 'NO MODULES MATCH YOUR FILTERS.'
                : 'NO MODULES AVAILABLE.'}
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' role='list'>
            {paginatedModules.map((m) => (
              <div key={m.key} role='listitem'>
                <ModuleCard module={m} />
              </div>
            ))}
          </div>
        </main>

        {/* Pagination Controls Bottom */}
        {!state.loading && paginatedModules.length > 0 && (
          <div className='flex justify-center p-6 border-t border-green-500'>
            <PaginationControls />
          </div>
        )}

        <Footer />
      </div>
    </div>
  )
}