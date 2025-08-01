'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Client } from '@/app/client/client'
import { Loading } from '@/app/components/Loading'
import { ModuleType } from '@/app/types/module'
import {
  CodeBracketIcon,
  ServerIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { CopyButton } from '@/app/components/CopyButton'
import { ModuleCode } from './ModuleCode'
import ModuleSchema from './ModuleApi'
import Link from 'next/link'

type TabType = 'code' | 'api'

interface ModuleClientProps {
  module_name: string
  code: boolean
  api: boolean
}

const shorten = (str: string): string => {
  if (!str || str.length <= 12) return str
  return `${str.slice(0, 8)}...${str.slice(-4)}`
}

const time2str = (time: number): string => {
  const d = new Date(time * 1000)
  return d.toLocaleString()
}

// Retro gaming color palette
const retroColors = [
  '#00ff00', // Matrix green
  '#ff00ff', // Hot magenta
  '#00ffff', // Cyan
  '#ffff00', // Yellow
  '#ff6600', // Orange
  '#0099ff', // Sky blue
  '#ff0099', // Pink
]

// Text to color function - generates retro color based on module name
const text2color = (text: string): string => {
  if (!text) return '#00ff00' // Default matrix green
  
  // Create a hash from the text
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Pick from retro color palette
  return retroColors[Math.abs(hash) % retroColors.length]
}

export default function ModuleClient({ module_name, code, api }: ModuleClientProps) {
  // Create client instance once using useMemo to prevent recreation
  const client = useMemo(() => new Client(), [])
  
  const [module, setModule] = useState<ModuleType | undefined>()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [syncing, setSyncing] = useState<boolean>(false)
  const [codeMap, setCodeMap] = useState<Record<string, string>>({})
  const initialTab: TabType = code ? 'code' : api ? 'api' : 'code'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  
  // Track if we've already fetched to prevent duplicate calls
  const [hasFetched, setHasFetched] = useState(false)

  const fetchModule = useCallback(async (update = false) => {
    try {
      if (update) {
        setSyncing(true)
      } else {
        setLoading(true)
      }
      
      const params = { module: module_name, update: update, code: true }
      const foundModule = await client.call('module', params)
      
      if (foundModule) {
        setModule(foundModule)
        if (foundModule.code && typeof foundModule.code === 'object') {
          setCodeMap(foundModule.code as Record<string, string>)
        }
        setError('')
      } else {
        setError(`Module ${module_name} not found`)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch module')
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [module_name, client])

  // Initial fetch - only run once
  useEffect(() => {
    if (!hasFetched) {
      setHasFetched(true)
      fetchModule(false)
    }
  }, [hasFetched, fetchModule])

  const handleSync = useCallback(() => {
    fetchModule(true)
  }, [fetchModule])

  if (loading) return <Loading />
  
  if (error || !module) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-black'>
        <div className='max-w-md text-center font-mono'>
          <div className='mb-6 text-6xl text-red-500 animate-pulse'>ERROR</div>
          <ExclamationTriangleIcon className='mx-auto h-16 w-16 text-red-500 mb-4' />
          <h2 className='text-2xl font-bold text-red-500 mb-2 uppercase tracking-wider'>System Failure</h2>
          <p className='text-green-400 mb-6 font-mono text-lg'>{error}</p>
          <Link
            href='/'
            className='inline-flex items-center gap-2 border-2 border-green-500 bg-black px-6 py-3 text-green-500 hover:bg-green-500 hover:text-black font-mono uppercase tracking-wider transition-none'
          >
            <ArrowLeftIcon className='h-5 w-5' />
            <span>[RETURN]</span>
          </Link>
        </div>
      </div>
    )
  }

  // Generate the module color based on its name
  const moduleColor = text2color(module.name)

  const tabs = [
    { id: 'code', label: 'CODE', icon: CodeBracketIcon },
    { id: 'api', label: 'SCHEMA', icon: ServerIcon },
  ]

  return (
    <div className='min-h-screen bg-black font-mono'>
      {/* Retro scanlines effect */}
      <div className='fixed inset-0 pointer-events-none opacity-10' style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          ${moduleColor}33 2px,
          ${moduleColor}33 4px
        )`
      }} />
      
      <div className='relative z-10 mx-auto max-w-7xl p-4'>
        {/* Header with retro terminal style */}
        <div className='mb-6'>
          {/* Terminal header bar */}
          <div className='border-2 bg-black' style={{ borderColor: moduleColor }}>
            <div className='flex items-center justify-between border-b-2 p-2' style={{ borderColor: moduleColor }}>
              <div className='flex items-center gap-2'>
                <div className='h-3 w-3 rounded-full bg-red-500' />
                <div className='h-3 w-3 rounded-full bg-yellow-500' />
                <div className='h-3 w-3 rounded-full bg-green-500' />
              </div>
              <div className='text-xs uppercase' style={{ color: moduleColor }}>MODULE://SYSTEM//{module.name}</div>
              <Link
                href='/'
                className='text-xs uppercase hover:underline' 
                style={{ color: moduleColor }}
              >
                [EXIT]
              </Link>
            </div>
            
            {/* Module info section */}
            <div className='p-6'>
              <div className='mb-4 flex items-center justify-between'>
                <h1 className='text-4xl font-bold uppercase tracking-wider animate-pulse' style={{ color: moduleColor }}>
                  {module.name}
                </h1>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className='group flex items-center gap-2 border-2 px-4 py-2 uppercase transition-none hover:bg-opacity-20'
                  style={{ 
                    borderColor: moduleColor,
                    color: moduleColor,
                    backgroundColor: syncing ? `${moduleColor}20` : 'transparent'
                  }}
                >
                  <ArrowPathIcon className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'SYNCING...' : '[SYNC]'}</span>
                </button>
              </div>

              {/* Key info in retro style */}
              <div className='grid grid-cols-1 gap-2 text-sm md:grid-cols-3'>
                {module.key && (
                  <div className='flex items-center gap-2'>
                    <span className='text-green-500'>KEY:</span>
                    <span className='font-mono' style={{ color: moduleColor }}>
                      {shorten(module.key)}
                    </span>
                    <CopyButton code={module.key} />
                  </div>
                )}
                {module.cid && (
                  <div className='flex items-center gap-2'>
                    <span className='text-green-500'>CID:</span>
                    <span className='font-mono' style={{ color: moduleColor }}>
                      {shorten(module.cid)}
                    </span>
                    <CopyButton code={module.cid} />
                  </div>
                )}
                <div className='flex items-center gap-2'>
                  <span className='text-green-500'>CREATED:</span>
                  <span className='font-mono' style={{ color: moduleColor }}>
                    {time2str(module.time)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {module.desc && (
                <div className='mt-4 border-l-4 pl-4' style={{ borderColor: moduleColor }}>
                  <p className='text-green-400'>{module.desc}</p>
                </div>
              )}
              
              {/* Tags in retro style */}
              {module.tags?.length > 0 && (
                <div className='mt-4 flex flex-wrap gap-2'>
                  {module.tags.map((tag, i) => (
                    <span
                      key={i}
                      className='border-2 px-3 py-1 text-xs uppercase'
                      style={{ 
                        borderColor: moduleColor,
                        color: moduleColor
                      }}
                    >
                      [{tag}]
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content with retro terminal style */}
        <div className='border-2 bg-black' style={{ borderColor: moduleColor }}>
          {/* Retro tab navigation */}
          <div className='flex border-b-2' style={{ borderColor: moduleColor }}>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as TabType)}
                className={`flex items-center gap-2 px-6 py-3 uppercase transition-none ${
                  activeTab === id
                    ? 'border-b-4'
                    : 'hover:bg-opacity-10'
                }`}
                style={{
                  borderColor: activeTab === id ? moduleColor : 'transparent',
                  backgroundColor: activeTab === id ? `${moduleColor}20` : 'transparent',
                  color: activeTab === id ? moduleColor : '#00ff00'
                }}
              >
                <Icon className='h-5 w-5' />
                <span>[{label}]</span>
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className='p-6'>
            {activeTab === 'code' && (
              <ModuleCode
                files={codeMap}
                title=''
                showSearch={true}
                showFileTree={Object.keys(codeMap).length > 3}
                compactMode={false}
              />
            )}
            {activeTab === 'api' && <ModuleSchema mod={module} />}
          </div>
        </div>

        {/* Footer Actions in retro style */}
        <div className='mt-6 flex flex-wrap items-center justify-center gap-4'>
          {module.url && (
            <a
              href={module.url}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 border-2 px-6 py-3 uppercase transition-none hover:bg-opacity-20'
              style={{ 
                borderColor: moduleColor,
                color: moduleColor,
                backgroundColor: 'transparent'
              }}
            >
              <span>[LAUNCH APP]</span>
            </a>
          )}
          <button className='flex items-center gap-2 border-2 px-6 py-3 uppercase transition-none hover:bg-opacity-20'
                  style={{ 
                    borderColor: moduleColor,
                    color: moduleColor
                  }}>
            <DocumentTextIcon className='h-5 w-5' />
            <span>[DOCS]</span>
          </button>
          <button className='flex items-center gap-2 border-2 px-6 py-3 uppercase transition-none hover:bg-opacity-20'
                  style={{ 
                    borderColor: moduleColor,
                    color: moduleColor
                  }}>
            <ExclamationTriangleIcon className='h-5 w-5' />
            <span>[REPORT]</span>
          </button>
        </div>
        
        {/* Retro footer text */}
        <div className='mt-8 text-center text-xs uppercase' style={{ color: moduleColor }}>
          <p>SYSTEM READY // MODULE LOADED // {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}