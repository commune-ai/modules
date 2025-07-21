'use client'

import { useState, memo, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ModuleType } from '../../types/module'
import { CopyButton } from '@/app/components/CopyButton'
import Link from 'next/link'

// Helper functions
const shorten = (key: string, length = 6): string => {
  if (!key || typeof key !== 'string') return ''
  if (key.length <= length * 2 + 3) return key
  return `${key.slice(0, length)}...${key.slice(-length)}`
}

const time2str = (time: number): string => {
  const d = new Date(time * 1000)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()
}

// Generate unique color based on module name
const getModuleColor = (name: string): string => {
  const colors = [
    '#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff6600', 
    '#0099ff', '#ff0099', '#99ff00', '#9900ff', '#00ff99',
    '#ff9900', '#00ff66', '#6600ff', '#ff0066', '#66ff00'
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

// Generate cyberpunk pattern based on key
const generateCyberpunkPattern = (key: string, color: string): string => {
  if (!key) return ''
  
  // Create a deterministic pattern based on the key
  const canvas = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="black"/>
        <rect width="1" height="40" fill="${color}20" x="20"/>
        <rect width="40" height="1" fill="${color}20" y="20"/>
      </pattern>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="400" height="400" fill="url(#grid)"/>`
  
  // Generate circuit-like patterns based on key hash
  let paths = ''
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Create random but deterministic circuit paths
  const rand = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  
  for (let i = 0; i < 8; i++) {
    const x1 = Math.floor(rand(hash + i) * 400)
    const y1 = Math.floor(rand(hash + i + 1) * 400)
    const x2 = Math.floor(rand(hash + i + 2) * 400)
    const y2 = Math.floor(rand(hash + i + 3) * 400)
    
    paths += `<path d="M${x1},${y1} L${x2},${y2}" stroke="${color}" stroke-width="2" opacity="0.6" filter="url(#glow)"/>`
    
    // Add nodes
    if (i % 2 === 0) {
      paths += `<circle cx="${x1}" cy="${y1}" r="4" fill="${color}" filter="url(#glow)"/>`
      paths += `<circle cx="${x2}" cy="${y2}" r="4" fill="${color}" filter="url(#glow)"/>`
    }
  }
  
  // Add some data blocks
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(rand(hash + i + 10) * 350) + 25
    const y = Math.floor(rand(hash + i + 11) * 350) + 25
    const size = 20 + Math.floor(rand(hash + i + 12) * 30)
    
    paths += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}15" stroke="${color}" stroke-width="1" filter="url(#glow)"/>`
  }
  
  const svg = canvas + paths + '</svg>'
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

interface ModuleCardProps {
  module: ModuleType
  viewMode?: 'grid' | 'list'
}

const ModuleCard = memo(({ module, viewMode = 'grid' }: ModuleCardProps) => {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const moduleColor = getModuleColor(module.name)
  
  // Generate cyberpunk pattern
  const cyberpunkPattern = useMemo(() => {
    return generateCyberpunkPattern(module.key, moduleColor)
  }, [module.key, moduleColor])
  
  const handleCardClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLoading(true)
    await router.push(`module/${module.name}?color=${encodeURIComponent(moduleColor)}`)
  }, [router, module.name, moduleColor])

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className='w-full cursor-pointer border bg-black p-4 font-mono hover:shadow-lg transition-all duration-200 relative overflow-hidden'
        style={{ 
          borderColor: moduleColor,
          boxShadow: isHovered ? `0 0 10px ${moduleColor}60` : `0 0 3px ${moduleColor}20`
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4 flex-1'>
            <div className='flex flex-col'>
              <div className='flex items-center gap-2'>
                <span className='font-bold text-3xl' style={{ color: moduleColor }}>{module.name.toLowerCase()}</span>
                <span className='text-xl' style={{ color: `${moduleColor}80` }}>• {shorten(module.key, 6)}</span>
                {module.cid && (
                  <span className='text-xl' style={{ color: `${moduleColor}60` }}>• cid: {shorten(module.cid, 8)}</span>
                )}
              </div>
              {module.desc && (
                <span className='text-2xl mt-1' style={{ color: `${moduleColor}99` }}>{module.desc}</span>
              )}
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <span className='text-2xl' style={{ color: `${moduleColor}80` }}>{time2str(module.time)}</span>
            {module.url && (
              <Link
                href={module.url}
                onClick={(e) => e.stopPropagation()}
                className='px-4 py-2 border text-2xl hover:shadow-md transition-all'
                style={{ 
                  borderColor: moduleColor,
                  color: moduleColor,
                  backgroundColor: isHovered ? `${moduleColor}10` : 'transparent'
                }}
                target='_blank'
                rel='noopener noreferrer'
              >
                open →
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handleCardClick}
      className='cursor-pointer border-2 bg-black p-6 font-mono hover:shadow-2xl transition-all duration-300 relative overflow-hidden group flex flex-col h-[400px]'
      style={{ 
        borderColor: moduleColor,
        boxShadow: isHovered ? `0 0 30px ${moduleColor}80, inset 0 0 20px ${moduleColor}20` : `0 0 10px ${moduleColor}40`,
        borderWidth: isHovered ? '3px' : '2px',
        background: isHovered ? `radial-gradient(ellipse at center, ${moduleColor}10 0%, black 70%)` : 'black'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className='absolute inset-0 z-20 bg-black/90 flex items-center justify-center'>
          <div className='text-4xl font-bold animate-pulse' style={{ color: moduleColor }}>loading...</div>
        </div>
      )}
      
      {/* Cyberpunk background pattern */}
      {cyberpunkPattern && (
        <div 
          className='absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300'
          style={{
            backgroundImage: `url(${cyberpunkPattern})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(0.5px)'
          }}
        />
      )}
      
      {/* Header section with module name in top left and key in top right */}
      <div className='flex justify-between items-start mb-4 relative z-10'>
        <div className='flex flex-col'>
          <h3 className='font-bold text-4xl tracking-wider lowercase transition-all duration-300' 
              style={{ 
                color: moduleColor,
                textShadow: isHovered ? `0 0 15px ${moduleColor}80` : `0 0 5px ${moduleColor}40`,
                letterSpacing: '0.05em'
              }}>
            {module.name}
          </h3>
          <div className='text-lg font-mono mt-1' style={{ color: `${moduleColor}80` }}>
            [{module.network || 'commune'}]
          </div>
        </div>
        <div className='text-right'>
          <div className='flex items-center gap-2'>
            <code className='text-lg font-mono' style={{ color: `${moduleColor}CC` }}>
              {shorten(module.key, 8)}
            </code>
            <div onClick={(e) => e.stopPropagation()}>
              <CopyButton code={module.key} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content section */}
      <div className='flex-1 flex flex-col justify-center items-center text-center mb-6 px-4 relative z-10'>
        {/* Description */}
        {module.desc && (
          <p className='text-xl leading-relaxed max-w-full line-clamp-4' 
             style={{ color: `${moduleColor}B0` }}>
            {module.desc}
          </p>
        )}
      </div>

      {/* Tags section */}
      {module.tags && module.tags.length > 0 && (
        <div className='flex flex-wrap justify-center gap-2 mb-4 relative z-10'>
          {module.tags.slice(0, 4).map((tag, i) => (
            <span
              key={i}
              className='text-lg border px-3 py-1 lowercase tracking-wide transition-all duration-200 hover:scale-110'
              style={{ 
                borderColor: `${moduleColor}50`,
                color: moduleColor,
                backgroundColor: `${moduleColor}15`,
                boxShadow: isHovered ? `0 0 10px ${moduleColor}40` : 'none'
              }}
            >
              {tag}
            </span>
          ))}
          {module.tags.length > 4 && (
            <span className='text-lg px-2 py-1' style={{ color: `${moduleColor}60` }}>+{module.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Bottom section with CID and last update */}
      <div className='mt-auto space-y-3 relative z-10'>
        {/* Divider */}
        <div className='w-full h-px' style={{ background: `linear-gradient(to right, transparent, ${moduleColor}40, transparent)` }} />
        
        {/* CID and Last Update info */}
        <div className='flex justify-between items-center px-2'>
          <div className='flex items-center gap-2'>
            {module.cid && (
              <>
                <span className='text-lg lowercase font-bold' style={{ color: `${moduleColor}60` }}>cid:</span>
                <code className='text-lg font-mono' style={{ color: `${moduleColor}CC` }}>
                  {shorten(module.cid, 8)}
                </code>
              </>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-lg lowercase font-bold' style={{ color: `${moduleColor}60` }}>updated:</span>
            <span className='text-lg font-mono' style={{ color: `${moduleColor}CC` }}>
              {time2str(module.time)}
            </span>
          </div>
        </div>

        {/* Action button */}
        {module.url && (
          <Link
            href={module.url}
            onClick={(e) => e.stopPropagation()}
            className='block w-full text-center border-2 py-3 transition-all duration-300 text-xl font-bold lowercase tracking-widest rounded-lg'
            style={{ 
              borderColor: moduleColor,
              color: moduleColor,
              backgroundColor: isHovered ? `${moduleColor}20` : 'transparent',
              boxShadow: isHovered ? `0 0 20px ${moduleColor}60, inset 0 0 10px ${moduleColor}20` : 'none',
              transform: isHovered ? 'scale(1.02)' : 'scale(1)'
            }}
            target='_blank'
            rel='noopener noreferrer'
          >
            access module →
          </Link>
        )}
      </div>
      
      {/* Corner accents */}
      <div className='absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 transition-all duration-300'
           style={{ 
             borderColor: moduleColor,
             opacity: isHovered ? 1 : 0.5
           }} />
      <div className='absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 transition-all duration-300'
           style={{ 
             borderColor: moduleColor,
             opacity: isHovered ? 1 : 0.5
           }} />
      <div className='absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 transition-all duration-300'
           style={{ 
             borderColor: moduleColor,
             opacity: isHovered ? 1 : 0.5
           }} />
      <div className='absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 transition-all duration-300'
           style={{ 
             borderColor: moduleColor,
             opacity: isHovered ? 1 : 0.5
           }} />
    </div>
  )
})

ModuleCard.displayName = 'ModuleCard'

export default ModuleCard