'use client'

import { useEffect, useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { ModuleType } from '../../types/module'
import { CopyButton } from '@/app/components/CopyButton'
import {
  GlobeAltIcon,
  ClockIcon,
  KeyIcon,
  ServerIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

// Helper functions
const shorten = (key: string, length = 10): string => {
  if (!key || typeof key !== 'string') return ''
  if (key.length <= length * 2) return key
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
}

const ModuleCard = memo(({ module }: ModuleCardProps) => {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [displayedDescription, setDisplayedDescription] = useState('')
  const description = module.desc || 'No description available'

  if (!isValidModule(module)) {
    console.error('Invalid module data:', module)
    return (
      <div className='rounded-lg border border-red-500/30 bg-black/90 p-6 text-red-500'>
        Invalid module data
      </div>
    )
  }

  // Typing effect for description
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let currentIndex = 0

    if (isHovered) {
      const typeNextChar = () => {
        if (currentIndex < description.length) {
          setDisplayedDescription(description.slice(0, currentIndex + 1))
          currentIndex++
          timeoutId = setTimeout(typeNextChar, 20)
        }
      }
      typeNextChar()
    } else {
      setDisplayedDescription('')
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isHovered, description])

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`module/${module.name}`)
  }

  const InfoRow = ({ icon: Icon, label, value, showCopy = false }: {
    icon: React.ComponentType<any>
    label: string
    value: string
    showCopy?: boolean
  }) => (
    <div className='flex items-center justify-between rounded border border-green-500/20 bg-black/60 p-3'>
      <div className='flex items-center gap-2'>
        <Icon className='h-4 w-4 text-green-400' />
        <span className='text-green-400'>{label}</span>
      </div>
      <div className='flex items-center gap-2'>
        <span className='text-xs text-green-400 font-mono'>
          {label === 'time' ? value : shorten(value)}
        </span>
        {showCopy && (
          <div onClick={(e) => e.stopPropagation()}>
            <CopyButton code={value} />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <article 
      className='relative h-[320px] w-full'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={handleCardClick}
        className='relative h-full w-full cursor-pointer rounded-lg border border-green-500/30 
                   bg-black/90 font-mono transition-all duration-300 hover:border-green-400 
                   hover:shadow-lg hover:shadow-green-500/20 overflow-hidden'
        role='button'
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e as any)}
        aria-label={`View details for ${module.name} module`}
      >
        {/* Main Content */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
          {/* Header */}
          <header className='flex items-center justify-between border-b border-green-500/30 px-6 py-4'>
            <h3 className='text-lg font-semibold text-green-400'>{module.name}</h3>
            {module.network && module.network !== 'commune' && (
              <span className='text-xs text-green-400/70 bg-green-900/20 px-2 py-1 rounded'>
                {module.network}
              </span>
            )}
          </header>

          {/* Content */}
          <div className='p-6 space-y-4'>
            <InfoRow icon={KeyIcon} label='key' value={module.key} showCopy />
            {module.cid && <InfoRow icon={ServerIcon} label='cid' value={module.cid} showCopy />}
            <InfoRow icon={ClockIcon} label='time' value={time2str(module.time)} />

            {/* Tags */}
            {module.tags && module.tags.length > 0 && (
              <div className='flex flex-wrap gap-2 pt-2'>
                {module.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className='rounded-full border border-green-500/30 bg-green-900/20 px-3 
                             py-1 text-xs text-green-400'
                  >
                    #{tag}
                  </span>
                ))}
                {module.tags.length > 3 && (
                  <span className='rounded-full border border-green-500/30 bg-green-900/20 px-3 
                                 py-1 text-xs text-green-400'>
                    +{module.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* App Link */}
            {module.url && (
              <div className='pt-4'>
                <Link
                  href={module.url}
                  onClick={(e) => e.stopPropagation()}
                  className='flex items-center justify-center gap-2 rounded 
                            border border-green-500/30 px-4 py-3 text-sm 
                            text-green-400 transition-colors hover:bg-green-900/20'
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={`Open ${module.name} app in new tab`}
                >
                  <GlobeAltIcon className='h-5 w-5' />
                  <span>Open App</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Description Overlay */}
        <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* Header */}
          <header className='flex items-center justify-between border-b border-green-500/30 px-6 py-4'>
            <h3 className='text-lg font-semibold text-green-400'>{module.name}</h3>
          </header>

          {/* Description */}
          <div className='flex-1 p-6 flex items-center justify-center'>
            <p className='text-green-400 text-sm leading-relaxed text-center max-w-[90%]'>
              {displayedDescription}
              {isHovered && displayedDescription.length < description.length && (
                <span className='inline-block w-2 h-4 bg-green-400 animate-pulse ml-1' aria-hidden='true' />
              )}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
})

ModuleCard.displayName = 'ModuleCard'

export default ModuleCard