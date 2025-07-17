'use client'

import { useState, useCallback, useMemo } from 'react'
import { ModuleType } from '@/app/types/module'
import ModuleCard from './ModuleCard'
import ModulePreview from './ModulePreview'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid, List, SortAsc, SortDesc } from 'lucide-react'

interface ModuleGridProps {
  modules: ModuleType[]
  loading?: boolean
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
}

type SortField = 'name' | 'time' | 'network'
type SortOrder = 'asc' | 'desc'

export const ModuleGrid = ({ 
  modules, 
  loading = false,
  viewMode = 'grid',
  onViewModeChange 
}: ModuleGridProps) => {
  const [selectedModule, setSelectedModule] = useState<ModuleType | null>(null)
  const [sortField, setSortField] = useState<SortField>('time')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Text to color function
  const text2color = useCallback((text: string): string => {
    if (!text) return '#00ff00'
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    const saturation = 70 + (Math.abs(hash >> 8) % 30)
    const lightness = 45 + (Math.abs(hash >> 16) % 15)
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }, [])

  // Sort modules
  const sortedModules = useMemo(() => {
    const sorted = [...modules].sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'time':
          aVal = a.time
          bVal = b.time
          break
        case 'network':
          aVal = a.network || 'commune'
          bVal = b.network || 'commune'
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
    
    return sorted
  }, [modules, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 px-3 py-1 text-xs border transition-all ${
        sortField === field
          ? 'border-green-500 bg-green-500/20 text-green-400'
          : 'border-green-500/30 text-green-500/70 hover:border-green-500/50'
      }`}
    >
      {label}
      {sortField === field && (
        sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />
      )}
    </button>
  )

  return (
    <>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-green-500 text-sm">SORT BY:</span>
          <SortButton field="name" label="NAME" />
          <SortButton field="time" label="DATE" />
          <SortButton field="network" label="NETWORK" />
        </div>
        
        {onViewModeChange && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 border transition-all ${
                viewMode === 'grid'
                  ? 'border-green-500 bg-green-500/20 text-green-400'
                  : 'border-green-500/30 text-green-500/70 hover:border-green-500/50'
              }`}
              aria-label="Grid view"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 border transition-all ${
                viewMode === 'list'
                  ? 'border-green-500 bg-green-500/20 text-green-400'
                  : 'border-green-500/30 text-green-500/70 hover:border-green-500/50'
              }`}
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Module Grid/List */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
            <div className="text-green-500 text-xl animate-pulse">LOADING MODULES...</div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
              : 'space-y-4'
            }
          >
            {sortedModules.map((module, index) => (
              <motion.div
                key={module.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedModule(module)}
                className="cursor-pointer"
              >
                <ModuleCard module={module} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Preview Modal */}
      {selectedModule && (
        <ModulePreview
          module={selectedModule}
          isOpen={!!selectedModule}
          onClose={() => setSelectedModule(null)}
          moduleColor={text2color(selectedModule.name)}
        />
      )}
    </>
  )
}

export default ModuleGrid