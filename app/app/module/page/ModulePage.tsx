'use client'
'use client'

import { useEffect, useState } from 'react'
import { Client } from '@/app/client/client'
import { Loading } from '@/app/components/Loading'
import { ModuleType } from '@/app/types/module'
import {
  CodeBracketIcon,
  ServerIcon,
  GlobeAltIcon,
  BeakerIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import { ShareIcon } from '@heroicons/react/20/solid'
import { CopyButton } from '@/app/components/CopyButton'
import { ModuleCode } from './ModuleCode'
import ModuleSchema from './ModuleSchema'
import Link from 'next/link'

type TabType = 'code' | 'api'

function shorten(str: string) {
  if (!str || str.length <= 12) return str
  return `${str.slice(0, 8)}...${str.slice(-4)}`
}

function time2str(time: number) {
  const d = new Date(time * 1000)
  return d.toLocaleString()
}

// Retro Loading Animation Component
function RetroLoader() {
  const [dots, setDots] = useState('')
  const [glitchText, setGlitchText] = useState('SYNCING')
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const text = 'SYNCING'
      let glitched = ''
      for (let i = 0; i < text.length; i++) {
        if (Math.random() > 0.7) {
          glitched += glitchChars[Math.floor(Math.random() * glitchChars.length)]
        } else {
          glitched += text[i]
        }
      }
      setGlitchText(glitched)
      setTimeout(() => setGlitchText(text), 100)
    }, 2000)
    return () => clearInterval(glitchInterval)
  }, [])
  
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        {/* Retro CRT TV effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent animate-pulse" />
        
        {/* Main content */}
        <div className="relative rounded-lg border-4 border-green-500 bg-black p-8 shadow-[0_0_50px_rgba(34,197,94,0.5)]">
          {/* Scanlines effect */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(34,197,94,0.1)_50%)] bg-[length:100%_4px] opacity-20" />
          
          {/* Loading text with glitch effect */}
          <div className="relative space-y-4">
            <h2 className="text-center font-mono text-4xl font-bold text-green-400">
              <span className="inline-block animate-pulse">{glitchText}</span>
              <span className="text-green-300">{dots}</span>
            </h2>
            
            {/* ASCII art style loading bar */}
            <div className="mx-auto w-64">
              <div className="mb-2 font-mono text-xs text-green-400">[ESTABLISHING CONNECTION]</div>
              <div className="h-4 overflow-hidden rounded border border-green-500 bg-black">
                <div className="h-full animate-[loading_2s_ease-in-out_infinite] bg-gradient-to-r from-green-500 via-green-400 to-green-500 bg-[length:200%_100%]" />
              </div>
            </div>
            
            {/* Matrix-style falling characters */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="font-mono text-xs text-green-400 opacity-60"
                  style={{
                    animation: `fall ${1.5 + i * 0.3}s linear infinite`,
                    animationDelay: `${i * 0.2}s`
                  }}
                >
                  {String.fromCharCode(65 + Math.floor(Math.random() * 26))}
                </div>
              ))}
            </div>
            
            {/* Status messages */}
            <div className="mt-6 space-y-1 font-mono text-xs text-green-300">
              <div className="animate-pulse">» Initializing quantum tunnels...</div>
              <div className="animate-pulse animation-delay-200">» Calibrating neural matrices...</div>
              <div className="animate-pulse animation-delay-400">» Synchronizing data streams...</div>
            </div>
          </div>
        </div>
        
        {/* Retro computer terminal corners */}
        <div className="absolute -top-2 -left-2 h-4 w-4 border-l-2 border-t-2 border-green-500" />
        <div className="absolute -top-2 -right-2 h-4 w-4 border-r-2 border-t-2 border-green-500" />
        <div className="absolute -bottom-2 -left-2 h-4 w-4 border-l-2 border-b-2 border-green-500" />
        <div className="absolute -bottom-2 -right-2 h-4 w-4 border-r-2 border-b-2 border-green-500" />
      </div>
      
      <style jsx>{`
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fall {
          0% { transform: translateY(-20px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-400 { animation-delay: 400ms; }
      `}</style>
    </div>
  )
}

export default function ModuleClient({ module_name, code, api }: { module_name: string; code: boolean; api: boolean }) {
  const client = new Client()
  const [module, setModule] = useState<ModuleType | undefined>()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [codeMap, setCodeMap] = useState<Record<string, string>>({})
  const initialTab: TabType = code ? 'code' : api ? 'api' : 'code'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [updateModule, setUpdateModule] = useState<boolean>(false)
  const [isRetrying, setIsRetrying] = useState<boolean>(false)

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const params = { module: module_name, update: updateModule }
        const foundModule = await client.call('module', params)
        if (updateModule) {
          // Add a small delay to show the animation
          await new Promise(resolve => setTimeout(resolve, 2000))
          setUpdateModule(false)
          setIsRetrying(false)
        }
        if (foundModule) {
          setModule(foundModule)
          if (foundModule.code && typeof foundModule.code === 'object') {
            setCodeMap(foundModule.code as Record<string, string>)
          }
        } else {
          setError(`Module ${module_name} not found`)
        }
      } catch (err) {
        setError('Failed to fetch module')
        setIsRetrying(false)
      } finally {
        setLoading(false)
      }
    }
    fetchModule()
  }, [module_name, updateModule, client])

  if (loading && !isRetrying) return <Loading />
  if (error || !module)
    return (
      <div className='flex min-h-screen items-center justify-center bg-black text-red-500'>
        {error}
      </div>
    )

  const tabs = [
    { id: 'code', label: 'CODE', icon: CodeBracketIcon },
    { id: 'api', label: 'SCHEMA', icon: ServerIcon },
  ]

  const handleRetry = () => {
    setIsRetrying(true)
    setUpdateModule(true)
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-black to-gray-950 p-3 font-mono text-green-400'>
      <div className='mx-auto max-w-7xl space-y-4'>
        {/* Header */}
        <div className='overflow-hidden rounded-2xl border border-green-500/30 bg-black/90 shadow-xl backdrop-blur-sm'>
          <div className='space-y-3 border-b border-green-500/30 p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <h1 className='text-2xl font-bold text-green-400'>
                  {module.name}
                </h1>
                {module.tags?.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    {module.tags.map((tag, i) => (
                      <span
                        key={i}
                        className='rounded-full border border-green-500/30 bg-green-900/20 px-2 py-0.5 text-xs text-green-400'
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button className='flex items-center space-x-2 rounded-lg border border-green-500/30 bg-green-900/20 p-2 text-green-400 hover:bg-green-900/40 md:px-4 md:py-2'
                onClick={handleRetry}>
                <GlobeAltIcon className='h-4 w-4'  />
                <span className='hidden md:inline'>retry</span>
              </button>
            </div>


            <div className='flex flex-wrap gap-3'>
              {[
                { label: 'key', value: module.key || 'N/A' },
                { label: 'cid', value: module.cid || 'N/A' },
                { label: 'created', value: time2str(module.time) },
              ].map((item, i) => (
                <div
                  key={i}
                  className='flex items-center gap-2 rounded-lg border border-green-500/30 bg-black/60 px-3 py-1.5 backdrop-blur-sm'
                >
                  <span className='text-xs text-gray-400'>{item.label}:</span>
                  <div className='flex items-center gap-1'>
                    <span className='font-mono text-xs text-green-400'>
                      {shorten(item.value)}
                    </span>
                    <CopyButton code={item.value} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className='flex border-b border-green-500/30'>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as TabType)}
                className={`flex items-center space-x-2 px-6 py-3 transition-all ${
                  activeTab === id
                    ? 'border-b-2 border-green-400 bg-green-900/20 text-green-400'
                    : 'text-gray-400 hover:bg-green-900/10 hover:text-green-400'
                }`}
              >
                <Icon className='h-4 w-4' />
                <span className='text-sm'>{label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className='p-4'>
            {isRetrying ? (
              <RetroLoader />
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='flex flex-wrap items-center justify-between gap-2 sm:gap-4'>
          <Link
            href="/"
            className='flex w-full items-center justify-center space-x-2 rounded-xl border border-green-500/30 bg-black/90 px-4 py-2 text-center text-sm text-green-400 transition-all hover:bg-green-900/20 sm:w-auto'
          >
            <ArrowLeftIcon className='h-4 w-4' />
            <span>Back to Modules</span>
          </Link>

          <div className='flex w-full flex-wrap justify-center gap-2 sm:w-auto sm:justify-end sm:gap-4'>
            <button className='w-full rounded-xl border border-green-500/30 bg-black/90 px-4 py-2 text-center text-sm text-green-400 transition-all hover:bg-green-900/20 sm:w-auto'>
              Documentation
            </button>
            <button className='w-full rounded-xl border border-green-500/30 bg-black/90 px-4 py-2 text-center text-sm text-green-400 transition-all hover:bg-green-900/20 sm:w-auto'>
              Report Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}