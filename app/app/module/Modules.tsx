'use client'

import { useEffect, useState, useCallback } from 'react'
import { Footer } from '@/app/components'
import { Client } from '@/app/client/client'
import ModuleCard from '@/app/module/explorer/ModuleCard'
import { CreateModule } from '@/app/module/explorer/ModuleCreate'
import { ModuleType } from '@/app/types/module'

interface ModulesProps {
  searchTerm?: string
  onRefresh?: (refreshFn: () => void) => void
}

export default function Modules({ searchTerm = '', onRefresh }: ModulesProps) {
  const client = new Client()
  const [modules, setModules] = useState<ModuleType[]>([])
  const [totalModules, setTotalModules] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const pageSize = 20

  const fetchModules = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [modulesData, totalCount] = await Promise.all([
        client.call('modules', {
          search: searchTerm, 
          page_size: pageSize, 
          page: page
        }),
        client.call('n', { search: searchTerm })
      ])
      
      setModules(Array.isArray(modulesData) ? modulesData : [])
      setTotalModules(totalCount || 0)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch modules')
      setModules([])
      setTotalModules(0)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, page])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  useEffect(() => {
    if (onRefresh) {
      onRefresh(fetchModules)
    }
  }, [onRefresh, fetchModules])

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  const totalPages = Math.max(1, Math.ceil(totalModules / pageSize))
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCreateSuccess = () => {
    fetchModules()
    setShowCreateForm(false)
  }

  return (
    <div className='min-h-screen bg-black text-green-500 font-mono pt-[60px]'>
      {/* Error Banner */}
      {error && (
        <div className='p-4 bg-black border border-red-500 text-red-500'>
          ERROR: {error}
          <button onClick={() => setError(null)} className='float-right'>[X]</button>
        </div>
      )}


      {/* Create Module Modal */}
      {showCreateForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/90'>
          <div className='border border-green-500 bg-black p-4'>
            <CreateModule
              onClose={() => setShowCreateForm(false)}
              onSuccess={handleCreateSuccess}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className='p-6'>
        {loading && (
          <div className='text-center py-8'>
            <div className='text-green-500 text-xl'>LOADING...</div>
          </div>
        )}
        
        {!loading && modules.length === 0 && (
          <div className='py-8 text-center text-green-500'>
            {searchTerm ? `NO MODULES FOUND FOR "${searchTerm}"` : 'NO MODULES AVAILABLE'}
          </div>
        )}

        {/* Modules Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
          {modules.map((m) => (
            <ModuleCard key={m.key} module={m} />
          ))}
        </div>

        {/* Pagination */}
        {!loading && totalModules > 0 && (
          <div className='flex items-center justify-center gap-4 py-4 border-t border-green-500'>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={!hasPrevPage || loading}
              className='px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed'
            >
              PREV
            </button>
            
            <span className='text-green-500'>
              PAGE {page} OF {totalPages} ({totalModules} TOTAL)
            </span>
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!hasNextPage || loading}
              className='px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed'
            >
              NEXT
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}