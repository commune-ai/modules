'use client'

import { useState, useEffect } from 'react'
import { ModuleType } from '@/app/types/module'
import { X, Code, Globe, Clock, Key, Tag, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModulePreviewProps {
  module: ModuleType
  isOpen: boolean
  onClose: () => void
  moduleColor: string
}

export const ModulePreview = ({ module, isOpen, onClose, moduleColor }: ModulePreviewProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'actions'>('overview')

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative w-full max-w-2xl rounded-xl border-2 bg-black/95 shadow-2xl"
            style={{ 
              borderColor: moduleColor,
              boxShadow: `0 0 40px ${moduleColor}40`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: `${moduleColor}40` }}>
              <h2 className="text-xl font-bold" style={{ color: moduleColor }}>
                {module.name}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close preview"
              >
                <X size={20} style={{ color: moduleColor }} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: `${moduleColor}20` }}>
              {(['overview', 'details', 'actions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2 text-sm font-medium capitalize transition-all ${
                    activeTab === tab
                      ? 'border-b-2'
                      : 'hover:bg-white/5'
                  }`}
                  style={{
                    borderColor: activeTab === tab ? moduleColor : 'transparent',
                    color: activeTab === tab ? moduleColor : `${moduleColor}80`
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2" style={{ color: `${moduleColor}CC` }}>Description</h3>
                    <p className="text-sm text-gray-400">
                      {module.desc || 'No description available'}
                    </p>
                  </div>
                  
                  {module.tags && module.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2" style={{ color: `${moduleColor}CC` }}>Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {module.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs rounded-full border"
                            style={{ 
                              borderColor: `${moduleColor}40`,
                              backgroundColor: `${moduleColor}10`,
                              color: `${moduleColor}CC`
                            }}
                          >
                            <Tag size={10} className="inline mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border" 
                       style={{ borderColor: `${moduleColor}20`, backgroundColor: `${moduleColor}05` }}>
                    <div className="flex items-center gap-2">
                      <Key size={16} style={{ color: `${moduleColor}80` }} />
                      <span className="text-sm" style={{ color: `${moduleColor}CC` }}>Key</span>
                    </div>
                    <code className="text-xs font-mono" style={{ color: moduleColor }}>
                      {module.key}
                    </code>
                  </div>
                  
                  {module.cid && (
                    <div className="flex items-center justify-between p-3 rounded-lg border" 
                         style={{ borderColor: `${moduleColor}20`, backgroundColor: `${moduleColor}05` }}>
                      <div className="flex items-center gap-2">
                        <Code size={16} style={{ color: `${moduleColor}80` }} />
                        <span className="text-sm" style={{ color: `${moduleColor}CC` }}>CID</span>
                      </div>
                      <code className="text-xs font-mono" style={{ color: moduleColor }}>
                        {module.cid}
                      </code>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border" 
                       style={{ borderColor: `${moduleColor}20`, backgroundColor: `${moduleColor}05` }}>
                    <div className="flex items-center gap-2">
                      <Clock size={16} style={{ color: `${moduleColor}80` }} />
                      <span className="text-sm" style={{ color: `${moduleColor}CC` }}>Created</span>
                    </div>
                    <span className="text-xs" style={{ color: moduleColor }}>
                      {new Date(module.time * 1000).toLocaleString()}
                    </span>
                  </div>
                  
                  {module.network && (
                    <div className="flex items-center justify-between p-3 rounded-lg border" 
                         style={{ borderColor: `${moduleColor}20`, backgroundColor: `${moduleColor}05` }}>
                      <div className="flex items-center gap-2">
                        <Globe size={16} style={{ color: `${moduleColor}80` }} />
                        <span className="text-sm" style={{ color: `${moduleColor}CC` }}>Network</span>
                      </div>
                      <span className="text-xs" style={{ color: moduleColor }}>
                        {module.network}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="space-y-3">
                  <button
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition-all hover:scale-105"
                    style={{ 
                      borderColor: moduleColor,
                      color: moduleColor,
                      backgroundColor: `${moduleColor}10`
                    }}
                    onClick={() => window.open(`/module/${module.name}`, '_blank')}
                  >
                    <ExternalLink size={16} />
                    View Full Details
                  </button>
                  
                  {module.url && (
                    <button
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition-all hover:scale-105"
                      style={{ 
                        borderColor: moduleColor,
                        color: moduleColor,
                        backgroundColor: `${moduleColor}10`
                      }}
                      onClick={() => window.open(module.url, '_blank')}
                    >
                      <Globe size={16} />
                      Open App
                    </button>
                  )}
                  
                  <button
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition-all hover:scale-105"
                    style={{ 
                      borderColor: `${moduleColor}40`,
                      color: `${moduleColor}CC`,
                      backgroundColor: 'transparent'
                    }}
                  >
                    <Code size={16} />
                    View Code
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ModulePreview