'use client'

import { useEffect, useState, memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ModuleType } from '../../types/module'
import { CopyButton } from '@/app/components/CopyButton'
import {
  GlobeAltIcon,
  ClockIcon,
  KeyIcon,
  ServerIcon,
  SparklesIcon,
  ChartBarIcon,
  CodeBracketIcon,
  TagIcon,
  CpuChipIcon,
  SignalIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// Helper functions
const shorten = (key: string, length = 4): string => {
  if (!key || typeof key !== 'string') return ''
  if (key.length <= length * 2 + 3) return key
  return `${key.slice(0, length)}...${key.slice(-length)}`
}

const time2str = (time: number): string => {
  const d = new Date(time * 1000)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  
  return d.toLocaleDateString()
}

// Enhanced color generation with better distribution
const text2color = (text: string): string => {
  if (!text) return '#00ff00'
  
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Use golden ratio for better color distribution
  const golden_ratio = 0.618033988749895
  const hue = (hash * golden_ratio * 360) % 360
  const saturation = 65 + (Math.abs(hash >> 8) % 25)
  const lightness = 50 + (Math.abs(hash >> 16) % 15)
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

const isValidModule = (module: any): module is ModuleType => {
  return (
    typeof module === 'object' &&
    module !== null &&
    'name' in module &&
    'key' in module &&
    'time' in module 
  )
}

interface ModuleCardProps {
  module: ModuleType
  index?: number
  viewMode?: 'grid' | 'list'
}

const ModuleCard = memo(({ module, index = 0, viewMode = 'grid' }: ModuleCardProps) => {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  // Generate unique color for this module
  const moduleColor = text2color(module.name)

  if (!isValidModule(module)) {
    console.error('Invalid module data:', module)
    return (
      <div className='rounded-lg border-2 border-red-500 bg-black p-6 text-red-500 shadow-lg shadow-red-500/30'>
        Invalid module data
      </div>
    )
  }

  const handleCardClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLoading(true)
    await router.push(`module/${module.name}`)
  }, [router, module.name])

  // Module health/status indicator
  const getModuleStatus = () => {
    const hoursSinceUpdate = (Date.now() - module.time * 1000) / 3600000
    if (hoursSinceUpdate < 24) return { status: 'active', color: '#10b981', label: 'Active', pulse: true }
    if (hoursSinceUpdate < 168) return { status: 'idle', color: '#f59e0b', label: 'Idle', pulse: false }
    return { status: 'inactive', color: '#ef4444', label: 'Inactive', pulse: false }
  }

  const status = getModuleStatus()

  // Calculate module score (mock data for now)
  const moduleScore = Math.floor(Math.random() * 30) + 70
  const moduleActivity = Math.floor(Math.random() * 100)

  const InfoBox = ({ label, value, icon: Icon, showCopy = false }: {
    label: string
    value: string
    icon: React.ComponentType<any>
    showCopy?: boolean
  }) => (
    <motion.div 
      className='group relative'
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className='flex items-center gap-2 p-2 rounded-lg transition-all duration-300'
           style={{ 
             backgroundColor: isHovered ? `${moduleColor}10` : 'transparent',
             borderColor: `${moduleColor}20`
           }}>
        <Icon className='h-4 w-4 transition-all duration-300' 
              style={{ color: isHovered ? moduleColor : `${moduleColor}80` }} />
        <span className='text-xs uppercase tracking-wider opacity-70'>{
          label}
        </span>
        <span className='flex-1 text-sm font-medium' 
              style={{ color: isHovered ? moduleColor : `${moduleColor}CC` }}>
          {label === 'time' ? value : (label === 'key' || label === 'cid' ? shorten(value) : value)}
        </span>
        {showCopy && (
          <div onClick={(e) => e.stopPropagation()} className='opacity-0 group-hover:opacity-100 transition-opacity'>
            <CopyButton code={value} />
          </div>
        )}
      </div>
    </motion.div>
  )

  if (viewMode === 'list') {
    return (
      <motion.article 
        className='relative w-full'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
      >
        <div
          onClick={handleCardClick}
          className='relative w-full cursor-pointer rounded-lg border-2 
                     bg-black/95 p-4 font-mono transition-all duration-300 
                     hover:shadow-xl flex items-center gap-4'
          style={{ 
            borderColor: isHovered ? moduleColor : `${moduleColor}4D`,
            boxShadow: isHovered ? `0 4px 20px ${moduleColor}40` : 'none'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Status */}
          <div className='flex items-center gap-2'>
            <motion.div
              className='h-2 w-2 rounded-full'
              style={{ backgroundColor: status.color }}
              animate={status.pulse ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          {/* Name and Network */}
          <div className='flex-1'>
            <h3 className='text-base font-semibold' style={{ color: moduleColor }}>
              {module.name}
            </h3>
            {module.network && module.network !== 'commune' && (
              <span className='text-xs opacity-60'>{module.network}</span>
            )}
          </div>

          {/* Tags */}
          {module.tags && module.tags.length > 0 && (
            <div className='flex gap-1'>
              {module.tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className='px-2 py-0.5 text-xs rounded-full'
                  style={{ 
                    backgroundColor: `${moduleColor}20`,
                    color: moduleColor
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Time */}
          <div className='text-sm opacity-60'>
            {time2str(module.time)}
          </div>

          {/* Score */}
          <div className='flex items-center gap-1'>
            <ChartBarIcon className='h-4 w-4' style={{ color: `${moduleColor}80` }} />
            <span className='text-sm' style={{ color: moduleColor }}>{moduleScore}</span>
          </div>

          {/* Actions */}
          {module.url && (
            <Link
              href={module.url}
              onClick={(e) => e.stopPropagation()}
              className='p-2 rounded hover:bg-white/10 transition-colors'
              target='_blank'
              rel='noopener noreferrer'
            >
              <GlobeAltIcon className='h-4 w-4' style={{ color: moduleColor }} />
            </Link>
          )}
        </div>
      </motion.article>
    )
  }

  return (
    <motion.article 
      className='relative h-[420px] w-full'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setShowPreview(true)}
      onHoverEnd={() => setShowPreview(false)}
    >
      <div
        onClick={handleCardClick}
        className='relative h-full w-full cursor-pointer rounded-xl border-2 
                   bg-gradient-to-br from-black via-black/95 to-black/90 
                   font-mono transition-all duration-300 
                   hover:shadow-2xl overflow-hidden flex flex-col group'
        style={{ 
          borderColor: isHovered ? moduleColor : `${moduleColor}4D`,
          boxShadow: isHovered 
            ? `0 20px 40px ${moduleColor}40, inset 0 0 60px ${moduleColor}10` 
            : `0 4px 20px ${moduleColor}10`
        }}
        role='button'
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e as any)}
        aria-label={`View details for ${module.name} module`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className='absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm'>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <SparklesIcon className='h-8 w-8' style={{ color: moduleColor }} />
            </motion.div>
          </div>
        )}

        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-5'>
          <div className='h-full w-full' 
               style={{
                 backgroundImage: `radial-gradient(circle at 20% 50%, ${moduleColor} 0%, transparent 50%)`,
               }} />
        </div>

        {/* Status indicator */}
        <div className='absolute top-4 right-4 z-10'>
          <motion.div
            className='flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm'
            style={{ backgroundColor: `${status.color}20`, color: status.color }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className='h-2 w-2 rounded-full'
              style={{ backgroundColor: status.color }}
              animate={status.pulse ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className='text-xs font-medium'>{status.label}</span>
          </motion.div>
        </div>

        {/* Header */}
        <header className='relative z-10 p-6 pb-4'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <motion.div
                className='p-2 rounded-lg'
                style={{ backgroundColor: `${moduleColor}20` }}
                animate={{ rotate: isHovered ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <CodeBracketIcon className='h-6 w-6' style={{ color: moduleColor }} />
              </motion.div>
              <div>
                <h3 className='text-lg font-bold transition-all duration-300' 
                    style={{ color: isHovered ? moduleColor : `${moduleColor}E6` }}>
                  {module.name}
                </h3>
                {module.network && module.network !== 'commune' && (
                  <span className='text-xs opacity-60'>{module.network}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className='mt-4 grid grid-cols-3 gap-2'>
            <div className='text-center p-2 rounded-lg' style={{ backgroundColor: `${moduleColor}10` }}>
              <div className='text-lg font-bold' style={{ color: moduleColor }}>{moduleScore}</div>
              <div className='text-xs opacity-60'>Score</div>
            </div>
            <div className='text-center p-2 rounded-lg' style={{ backgroundColor: `${moduleColor}10` }}>
              <div className='text-lg font-bold' style={{ color: moduleColor }}>{moduleActivity}%</div>
              <div className='text-xs opacity-60'>Activity</div>
            </div>
            <div className='text-center p-2 rounded-lg' style={{ backgroundColor: `${moduleColor}10` }}>
              <SignalIcon className='h-5 w-5 mx-auto mb-1' style={{ color: moduleColor }} />
              <div className='text-xs opacity-60'>Live</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className='flex-1 px-6 space-y-3 relative z-10'>
          {/* Description */}
          {module.desc && (
            <motion.p 
              className='text-sm line-clamp-2 opacity-80'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {module.desc}
            </motion.p>
          )}

          {/* Tags */}
          {module.tags && module.tags.length > 0 && (
            <motion.div 
              className='flex flex-wrap gap-2'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {module.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className='inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-all duration-300 hover:scale-105'
                  style={{ 
                    backgroundColor: `${moduleColor}20`,
                    color: moduleColor,
                    border: `1px solid ${moduleColor}40`
                  }}
                >
                  <TagIcon className='h-3 w-3' />
                  {tag}
                </span>
              ))}
              {module.tags.length > 3 && (
                <span className='px-3 py-1 text-xs rounded-full' 
                      style={{ backgroundColor: `${moduleColor}10`, color: `${moduleColor}80` }}>
                  +{module.tags.length - 3}
                </span>
              )}
            </motion.div>
          )}

          {/* Info Boxes */}
          <div className='space-y-2'>
            <InfoBox icon={KeyIcon} label='key' value={module.key} showCopy />
            {module.cid && <InfoBox icon={ServerIcon} label='cid' value={module.cid} showCopy />}
            <InfoBox icon={ClockIcon} label='updated' value={time2str(module.time)} />
          </div>
        </div>

        {/* Footer Actions */}
        <motion.div 
          className='p-6 pt-4 flex items-center justify-between border-t'
          style={{ borderColor: `${moduleColor}20` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className='flex items-center gap-3'>
            <motion.button
              className='p-2 rounded-lg transition-all hover:scale-110'
              style={{ 
                backgroundColor: `${moduleColor}20`,
                color: moduleColor
              }}
              whileHover={{ backgroundColor: `${moduleColor}30` }}
              whileTap={{ scale: 0.95 }}
            >
              <CpuChipIcon className='h-4 w-4' />
            </motion.button>
            <motion.button
              className='p-2 rounded-lg transition-all hover:scale-110'
              style={{ 
                backgroundColor: `${moduleColor}20`,
                color: moduleColor
              }}
              whileHover={{ backgroundColor: `${moduleColor}30` }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowTrendingUpIcon className='h-4 w-4' />
            </motion.button>
          </div>

          {module.url && (
            <Link
              href={module.url}
              onClick={(e) => e.stopPropagation()}
              className='flex items-center gap-2 px-4 py-2 rounded-lg 
                        transition-all hover:scale-105 group'
              style={{ 
                backgroundColor: moduleColor,
                color: 'black'
              }}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={`Open ${module.name} app in new tab`}
            >
              <GlobeAltIcon className='h-4 w-4 transition-transform group-hover:rotate-12' />
              <span className='text-sm font-medium'>Open App</span>
            </Link>
          )}
        </motion.div>

        {/* Hover Preview Tooltip */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              className='absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full 
                         bg-black/95 backdrop-blur-md rounded-lg p-3 shadow-xl z-50 min-w-[200px]'
              style={{ borderColor: moduleColor, borderWidth: 1 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className='text-xs space-y-1'>
                <div className='font-semibold' style={{ color: moduleColor }}>Quick Preview</div>
                <div className='opacity-80'>Click to view full details</div>
                <div className='opacity-60'>Last active: {time2str(module.time)}</div>
              </div>
              <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full 
                            w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent 
                            border-t-8'
                   style={{ borderTopColor: moduleColor }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  )
})

ModuleCard.displayName = 'ModuleCard'

export default ModuleCard