'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, Search, Filter, Tag, Hash, ChevronRight, ChevronLeft } from 'lucide-react'
import { debounce } from 'lodash'

export interface SearchFilters {
  searchTerm: string
  includeTags: string[]
  excludeTags: string[]
  includeTerms: string[]
  excludeTerms: string[]
}

interface AdvancedSearchSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (filters: SearchFilters) => void
  availableTags?: string[]
  // Pagination props
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export const AdvancedSearchSidebar = ({ 
  isOpen, 
  onClose,
  onSearch, 
  availableTags = [],
  currentPage = 1,
  totalPages = 1,
  onPageChange
}: AdvancedSearchSidebarProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    includeTags: [],
    excludeTags: [],
    includeTerms: [],
    excludeTerms: []
  })

  const [tagInput, setTagInput] = useState('')
  const [termInput, setTermInput] = useState('')
  const [activeFilter, setActiveFilter] = useState<'includeTags' | 'excludeTags' | 'includeTerms' | 'excludeTerms' | null>(null)

  // Handle search submission
  const handleSearchSubmit = () => {
    onSearch(filters)
  }

  const handleSearchTermChange = (value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }))
  }

  const addToFilter = (filterType: keyof SearchFilters, value: string) => {
    if (!value.trim()) return
    
    const normalizedValue = value.toLowerCase().trim()
    if (Array.isArray(filters[filterType]) && !filters[filterType].includes(normalizedValue)) {
      setFilters(prev => ({
        ...prev,
        [filterType]: [...prev[filterType], normalizedValue]
      }))
    }
    
    // Clear inputs
    if (filterType.includes('Tags')) {
      setTagInput('')
    } else {
      setTermInput('')
    }
  }

  const removeFromFilter = (filterType: keyof SearchFilters, value: string) => {
    if (Array.isArray(filters[filterType])) {
      setFilters(prev => ({
        ...prev,
        [filterType]: prev[filterType].filter(item => item !== value)
      }))
    }
  }

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      includeTags: [],
      excludeTags: [],
      includeTerms: [],
      excludeTerms: []
    })
    setTagInput('')
    setTermInput('')
  }

  const hasActiveFilters = filters.searchTerm || 
                          filters.includeTags.length > 0 || 
                          filters.excludeTags.length > 0 || 
                          filters.includeTerms.length > 0 || 
                          filters.excludeTerms.length > 0

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Right Sidebar */}
      <div className="fixed right-0 top-0 h-full w-80 bg-black border-l border-green-500 z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-green-500">
          <div className="flex items-center justify-between">
            <h2 className="text-green-500 text-xl font-mono uppercase flex items-center gap-2">
              <Search size={20} />
              ADVANCED SEARCH
            </h2>
            <button
              onClick={onClose}
              className="text-green-500 hover:text-green-400 transition-colors"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main Search Input */}
          <div className="space-y-2">
            <label className="text-green-500 text-sm font-mono uppercase">SEARCH QUERY</label>
            <input
              type="text"
              placeholder="Enter search terms..."
              value={filters.searchTerm}
              onChange={(e) => handleSearchTermChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit()
                }
              }}
              className="w-full px-3 py-2 bg-black border border-green-500 text-green-500 placeholder-green-500/50 focus:outline-none focus:border-green-400"
            />
          </div>

          {/* Pagination Controls */}
          {onPageChange && totalPages > 1 && (
            <div className="space-y-2 p-3 bg-green-500/10 border border-green-500/30 rounded">
              <label className="text-green-500 text-sm font-mono uppercase">PAGE NAVIGATION</label>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed uppercase transition-none"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-green-500 text-sm font-mono">
                  PAGE {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed uppercase transition-none"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              
              {/* Quick page jump */}
              <div className="mt-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value)
                      if (page >= 1 && page <= totalPages) {
                        onPageChange(page)
                      }
                    }}
                    className="flex-1 px-2 py-1 bg-black border border-green-500 text-green-500 text-center font-mono text-sm focus:outline-none focus:border-green-400"
                    placeholder="PAGE #"
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="number"]') as HTMLInputElement
                      const page = parseInt(input.value)
                      if (page >= 1 && page <= totalPages) {
                        onPageChange(page)
                      }
                    }}
                    className="px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black uppercase text-xs font-mono"
                  >
                    GO
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Include Tags */}
          <div className="space-y-2">
            <label className="text-green-500 text-sm flex items-center gap-2">
              <Tag size={14} />
              INCLUDE TAGS
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.includeTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500 text-green-400 text-xs"
                >
                  #{tag}
                  <button
                    onClick={() => removeFromFilter('includeTags', tag)}
                    className="hover:text-green-300"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addToFilter('includeTags', tagInput)
                    }
                  }}
                  placeholder="ADD TAG"
                  className="px-2 py-1 bg-black border border-green-500/50 text-green-500 placeholder-green-500/30 focus:outline-none text-xs uppercase w-24"
                />
              </div>
            </div>
          </div>

          {/* Exclude Tags */}
          <div className="space-y-2">
            <label className="text-green-500 text-sm flex items-center gap-2">
              <Tag size={14} className="opacity-50" />
              EXCLUDE TAGS
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.excludeTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500 text-red-400 text-xs"
                >
                  #{tag}
                  <button
                    onClick={() => removeFromFilter('excludeTags', tag)}
                    className="hover:text-red-300"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={activeFilter === 'excludeTags' ? tagInput : ''}
                  onChange={(e) => {
                    setActiveFilter('excludeTags')
                    setTagInput(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addToFilter('excludeTags', tagInput)
                      setActiveFilter(null)
                    }
                  }}
                  placeholder="EXCLUDE TAG"
                  className="px-2 py-1 bg-black border border-red-500/50 text-red-500 placeholder-red-500/30 focus:outline-none text-xs uppercase w-24"
                />
              </div>
            </div>
          </div>

          {/* Include Terms */}
          <div className="space-y-2">
            <label className="text-green-500 text-sm flex items-center gap-2">
              <Hash size={14} />
              INCLUDE TERMS
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.includeTerms.map(term => (
                <span
                  key={term}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500 text-green-400 text-xs"
                >
                  "{term}"
                  <button
                    onClick={() => removeFromFilter('includeTerms', term)}
                    className="hover:text-green-300"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={activeFilter === 'includeTerms' ? termInput : ''}
                  onChange={(e) => {
                    setActiveFilter('includeTerms')
                    setTermInput(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addToFilter('includeTerms', termInput)
                      setActiveFilter(null)
                    }
                  }}
                  placeholder="INCLUDE TERM"
                  className="px-2 py-1 bg-black border border-green-500/50 text-green-500 placeholder-green-500/30 focus:outline-none text-xs uppercase w-32"
                />
              </div>
            </div>
          </div>

          {/* Exclude Terms */}
          <div className="space-y-2">
            <label className="text-green-500 text-sm flex items-center gap-2">
              <Hash size={14} className="opacity-50" />
              EXCLUDE TERMS
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.excludeTerms.map(term => (
                <span
                  key={term}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500 text-red-400 text-xs"
                >
                  "{term}"
                  <button
                    onClick={() => removeFromFilter('excludeTerms', term)}
                    className="hover:text-red-300"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={activeFilter === 'excludeTerms' ? termInput : ''}
                  onChange={(e) => {
                    setActiveFilter('excludeTerms')
                    setTermInput(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addToFilter('excludeTerms', termInput)
                      setActiveFilter(null)
                    }
                  }}
                  placeholder="EXCLUDE TERM"
                  className="px-2 py-1 bg-black border border-red-500/50 text-red-500 placeholder-red-500/30 focus:outline-none text-xs uppercase w-32"
                />
              </div>
            </div>
          </div>

          {/* Quick Tag Suggestions */}
          {availableTags.length > 0 && (
            <div className="pt-2 border-t border-green-500/30">
              <label className="text-green-500 text-sm">POPULAR TAGS</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableTags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    onClick={() => addToFilter('includeTags', tag)}
                    className="px-2 py-1 bg-black border border-green-500/30 text-green-500/70 hover:border-green-500 hover:text-green-500 text-xs"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer with Action Buttons */}
        <div className="p-4 border-t border-green-500 space-y-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="w-full px-4 py-2 text-green-500 border border-green-500/50 hover:bg-green-500/10 transition-colors text-sm font-mono uppercase"
            >
              CLEAR ALL FILTERS
            </button>
          )}
          
          {/* GO Button */}
          <button
            onClick={handleSearchSubmit}
            className="w-full px-4 py-3 bg-green-500 text-black hover:bg-green-400 transition-colors font-mono uppercase font-bold flex items-center justify-center gap-2"
          >
            <Search size={20} />
            GO
          </button>
        </div>
      </div>
    </>
  )
}

export default AdvancedSearchSidebar