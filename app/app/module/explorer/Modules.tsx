'use client'

import { useEffect, useState } from 'react'
import { Footer } from '@/app/components'
import { Client } from '@/app/client/client'
import { Loading } from '@/app/components/Loading'
import ModuleCard from '@/app/module/explorer/ModuleCard'
import { CreateModule } from '@/app/module/explorer/ModuleCreate'
import { ModuleType, DefaultModule } from '@/app/types/module'

export default function Modules() {
  const client = new Client()
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalModules, setTotalModules] = useState(0)
  const [modules, setModules] = useState<ModuleType[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchModules = async (currentPage?: number) => {
    setLoading(true)
    setError('')
    try {
      const pageToFetch = currentPage || page
      const data = await client.call('modules', {
        "search": searchTerm, 
        "page_size": pageSize, 
        "page": pageToFetch
      })
      if (!Array.isArray(data)) {
        throw new Error(`Invalid response: ${JSON.stringify(data)}`)
      }

      const n = await client.call('n', {'search': searchTerm})
      setTotalModules(n)
      
      setModules(data)
      // If we get a full page, assume there might be more
    } catch (err: any) {
      setError(err.message || 'Failed to fetch modules')
      setModules([])
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return
    setPage(newPage)
    fetchModules(newPage)
  }

  const handleSearch = () => {
    setPage(1) // Reset to first page on new search
    fetchModules(1)
  }

  useEffect(() => {
    fetchModules()
  }, [])

  const totalPages = Math.ceil(totalModules / pageSize)
  const hasNextPage = modules.length === pageSize
  const hasPrevPage = page > 1

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const delta = 2 // Number of pages to show around the current page2
    const range = []
    const rangeWithDots = []
    let l = 0

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i)
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    })

    return rangeWithDots
  }

  const PaginationControls = () => (
    <div className='flex items-center gap-2 font-mono text-sm'>
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={!hasPrevPage || loading}
        className='rounded border border-green-500/30 px-3 py-1 text-green-400 
                 transition-all hover:border-green-400 hover:bg-green-900/20 
                 disabled:cursor-not-allowed disabled:opacity-50'
      >
        ← prev
      </button>
      
      <div className='flex items-center gap-1'>
        {getPageNumbers().map((pageNum, idx) => (
          pageNum === '...' ? (
            <span key={`dots-${idx}`} className='px-2 text-gray-500'>...</span>
          ) : (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum as number)}
              disabled={loading}
              className={`rounded px-3 py-1 transition-all ${
                pageNum === page
                  ? 'bg-green-500/20 border border-green-400 text-green-300'
                  : 'border border-green-500/30 text-green-400 hover:border-green-400 hover:bg-green-900/20'
              } disabled:cursor-not-allowed`}
            >
              {pageNum}
            </button>
          )
        ))}
      </div>
      
      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={!hasNextPage || loading}
        className='rounded border border-green-500/30 px-3 py-1 text-green-400 
                 transition-all hover:border-green-400 hover:bg-green-900/20 
                 disabled:cursor-not-allowed disabled:opacity-50'
      >
        next →
      </button>
      
      <span className='ml-2 text-green-400/70'>
        | {totalModules} modules
      </span>
    </div>
  )

  return (
    <div className='flex min-h-screen flex-col items-center bg-black py-10 font-mono text-gray-200'>
      {error && (
        <div className='mb-4 flex w-full max-w-md items-center justify-between rounded-lg bg-red-500/80 px-4 py-2 text-white shadow-lg'>
          <span>{error}</span>
          <button onClick={() => setError('')} className='ml-4'>
            ✕
          </button>
        </div>
      )}

      <div className='mb-12 flex w-full max-w-3xl flex-col items-center gap-2 px-6 sm:flex-row sm:gap-4'>
        {/* Search Input (Full Width on Mobile) */}
        <div className='relative w-full rounded-lg border border-green-500/30 bg-black/90 sm:flex-1'>
          <div className='absolute left-4 top-1/2 -translate-y-1/2 text-green-400'>
            <span className='font-mono'>$</span>
          </div>
          <input
            type='text'
            placeholder='search modules...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className='w-full bg-transparent py-2 pl-10 pr-4 font-mono text-sm 
                text-green-400 placeholder-gray-500 focus:outline-none'
            disabled={loading}
          />
        </div>

        {/* Create Module Modal */}
        {showCreateForm && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
            <CreateModule
              onClose={() => setShowCreateForm(false)}
              onSuccess={() => {
                fetchModules()
                setShowCreateForm(false)
              }}
            />
          </div>
        )}

        {/* Buttons Container (Full Width on Mobile) */}
        <div className='grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-4'>
          <button
            onClick={handleSearch}
            disabled={loading}
            className='w-full rounded-lg border border-green-500/30 bg-black/90 px-3 
                py-2 font-mono text-sm 
                text-green-400 transition-all hover:border-green-400 hover:bg-green-900/20 sm:w-auto sm:px-4 sm:text-base'
          >
            
          </button>

          <button
            onClick={() => setShowCreateForm(true)}
            disabled={loading}
            className='w-full rounded-lg border border-green-500/30 bg-black/90 px-3 
                py-2 font-mono text-sm 
                text-green-400 transition-all hover:border-green-400 hover:bg-green-900/20 sm:w-auto sm:px-4 sm:text-base'
          >
            +
          </button>
        </div>
      </div>


      {/* Actual modules listing */}
      <div className='min-h-[500px] w-full max-w-full overflow-y-auto p-10 px-4'>
        {loading && <Loading />}
        {!loading && modules.length === 0 && (
          <div className='py-4 text-center text-gray-400'>
            {searchTerm ? 'No modules found.' : 'No modules available.'}
          </div>
        )}

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {modules.map((m) => (
            <ModuleCard key={m.key} module={m} />
          ))}
        </div>
      </div>

      {/* Pagination Controls Bottom */}
      {!loading && modules.length > 0 && (
        <div className='mt-6 mb-12'>
          <PaginationControls />
        </div>
      )}

      <Footer />
    </div>
  )
}
