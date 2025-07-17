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
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
  
  // Show relative time for recent items
  if (diff < 86400000) { // Less than 24 hours
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    }
    return `${hours}h ago`
  }
  
  return d.toLocaleDateString()
}

// Text to color function - generates unique color based on module name
const text2color = (text: string): string => {
  if (!text) return '#00ff00' // Default green
  
  // Create a hash from the text
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Convert hash to HSL color (keeping saturation and lightness consistent for readability)
  const hue = Math.abs(hash) % 360
  const saturation = 70 + (Math.abs(hash >> 8) % 30) // 70-100% saturation
  const lightness = 45 + (Math.abs(hash >> 16) % 15) // 45-60% lightness
  
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
}

const ModuleCard = memo(({ module, index = 0 }: ModuleCardProps) => {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
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

  const InfoBox = ({ label, value, icon: Icon, showCopy = false }: {
    label: string
    value: string
    icon: React.ComponentType<any>
    showCopy?: boolean
  }) => (
    <motion.div 
      className='flex items-center gap-2 w-full'
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div 
        className='flex items-center gap-2 px-3 py-2 rounded border-2 bg-black/80 transition-all duration-300 w-24'
        style={{ 
          borderColor: isHovered ? `${moduleColor}66` : `${moduleColor}1A`,
          backgroundColor: isHovered ? `${moduleColor}0D` : 'transparent'
        }}
      >
        <Icon className='h-4 w-4 transition-all duration-300' 
              style={{ color: isHovered ? `${moduleColor}CC` : `${moduleColor}66` }} />
        <span className='text-xs uppercase transition-all duration-300' 
              style={{ color: isHovered ? `${moduleColor}CC` : `${moduleColor}66` }}>
          {label}
        </span>
      </div>
      
      <div 
        className='flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded border-2 bg-black/80 transition-all duration-300'
        style={{ 
          borderColor: isHovered ? `${moduleColor}66` : `${moduleColor}1A`,
          backgroundColor: isHovered ? `${moduleColor}0D` : 'transparent'
        }}
      >
        <span className='text-sm font-mono transition-all duration-300' 
              style={{ color: isHovered ? moduleColor : `${moduleColor}80` }}>
          {label === 'time' ? value : (label === 'key' || label === 'cid' ? shorten(value) : value)}
        </span>
        {showCopy && (
          <div onClick={(e) => e.stopPropagation()}>
            <CopyButton code={value} />
          </div>
        )}
      </div>
    </motion.div>
  )

  // Module health/status indicator
  const getModuleStatus = () => {
    const hoursSinceUpdate = (Date.now() - module.time * 1000) / 3600000
    if (hoursSinceUpdate < 24) return { status: 'active', color: '#10b981', label: 'Active' }
    if (hoursSinceUpdate < 168) return { status: 'idle', color: '#f59e0b', label: 'Idle' }
    return { status: 'inactive', color: '#ef4444', label: 'Inactive' }
  }

  const status = getModuleStatus()

  return (
    <motion.article 
      className='relative h-[380px] w-full'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        onClick={handleCardClick}
        className='relative h-full w-full cursor-pointer rounded-lg border-3 
                   bg-black/95 font-mono transition-all duration-300 
                   hover:shadow-2xl overflow-hidden flex flex-col group'
        style={{ 
          borderColor: isHovered ? moduleColor : `${moduleColor}4D`,
          boxShadow: isHovered 
            ? `0 8px 30px ${moduleColor}66, inset 0 0 30px ${moduleColor}33` 
            : `0 2px 10px ${moduleColor}1A, inset 0 0 10px ${moduleColor}0D`,
          borderWidth: isHovered ? '4px' : '3px'
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
          <div className='absolute inset-0 z-10 flex items-center justify-center bg-black/80'>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <SparklesIcon className='h-8 w-8' style={{ color: moduleColor }} />
            </motion.div>
          </div>
        )}

        {/* Status indicator */}
        <div className='absolute top-4 right-4 z-10'>
          <motion.div
            className='flex items-center gap-2 px-2 py-1 rounded-full text-xs'
            style={{ backgroundColor: `${status.color}20`, color: status.color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className='h-2 w-2 rounded-full'
              style={{ backgroundColor: status.color }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {status.label}
          </motion.div>
        </div>

        {/* Header */}
        <header 
          className='flex items-center justify-between border-b-2 px-6 py-4 transition-all duration-300'
          style={{ 
            borderColor: isHovered ? `${moduleColor}66` : `${moduleColor}33`
          }}
        >
          <div className='flex items-center gap-3'>
            <motion.div
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <CodeBracketIcon className='h-6 w-6' style={{ color: moduleColor }} />
            </motion.div>
            <h3 className='text-lg font-semibold transition-all duration-300' 
                style={{ color: isHovered ? moduleColor : `${moduleColor}B3` }}>
              {module.name}
            </h3>
          </div>
          {module.network && module.network !== 'commune' && (
            <span 
              className='text-xs px-2 py-1 rounded transition-all duration-300'
              style={{ 
                color: isHovered ? moduleColor : `${moduleColor}80`,
                backgroundColor: isHovered ? `${moduleColor}1A` : `${moduleColor}0D`,
                border: `1px solid ${isHovered ? `${moduleColor}40` : `${moduleColor}1A`}`
              }}
            >
              {module.network}
            </span>
          )}
        </header>

        {/* Content */}
        <div className='flex-1 p-6 space-y-3'>
          {/* Description */}
          {module.desc && (
            <motion.p 
              className='text-sm mb-4 line-clamp-2'
              style={{ color: `${moduleColor}99` }}
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
              className='flex flex-wrap gap-2 mb-4'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {module.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className='inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-all duration-300 group-hover:scale-105'
                  style={{ 
                    backgroundColor: `${moduleColor}1A`,
                    color: `${moduleColor}CC`,
                    border: `1px solid ${moduleColor}33`
                  }}
                >
                  <TagIcon className='h-3 w-3' />
                  {tag}
                </span>
              ))}
              {module.tags.length > 3 && (
                <span className='text-xs' style={{ color: `${moduleColor}66` }}>+{module.tags.length - 3}</span>
              )}
            </motion.div>
          )}

          {/* Info Boxes Grid */}
          <div className='flex flex-col gap-3'>
            <InfoBox icon={KeyIcon} label='key' value={module.key} showCopy />
            {module.cid && <InfoBox icon={ServerIcon} label='cid' value={module.cid} showCopy />}
            <InfoBox icon={ClockIcon} label='time' value={time2str(module.time)} />
          </div>

          {/* App Link */}
          {module.url && (
            <motion.div 
              className='pt-4'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href={module.url}
                onClick={(e) => e.stopPropagation()}
                className='flex items-center justify-center gap-2 rounded 
                          border-2 px-4 py-3 text-sm 
                          transition-all hover:scale-105 group'
                style={{ 
                  borderColor: isHovered ? moduleColor : `${moduleColor}66`,
                  color: isHovered ? moduleColor : `${moduleColor}B3`,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${moduleColor}1A`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={`Open ${module.name} app in new tab`}
              >
                <GlobeAltIcon className='h-5 w-5 transition-transform group-hover:rotate-12' />
                <span>Open App</span>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Quick stats footer */}
        <motion.div 
          className='border-t px-6 py-3 flex items-center justify-between'
          style={{ borderColor: `${moduleColor}1A` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-1'>
              <ChartBarIcon className='h-4 w-4' style={{ color: `${moduleColor}66` }} />
              <span className='text-xs' style={{ color: `${moduleColor}66` }}>Score: 95</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.article>
  )
})

ModuleCard.displayName = 'ModuleCard'

export default ModuleCard