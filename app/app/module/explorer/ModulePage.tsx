'use client'

import { useEffect, useState, useCallback } from 'react'
import { Client } from '@/app/client/client'
import { Loading } from '@/app/components/Loading'
import { ModuleType } from '@/app/types/module'
import {
  CodeBracketIcon,
  ServerIcon,
  GlobeAltIcon,
  BeakerIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { CopyButton } from '@/app/components/CopyButton'
import { ModuleCode } from '../page/ModuleCode'
import ModuleSchema from './ModuleSchema'
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

interface InfoCardProps {
  label: string
  value: string
  showCopy?: boolean
}

const InfoCard = ({ label, value, showCopy = true }: InfoCardProps) => (
  <div className='rounded-xl border border-green-500/30 bg-black/60 p-4 backdrop-blur-sm'>
    <div className='mb-2 flex items-center justify-between'>
      <span className='text-gray-400'>{label}</span>
      {showCopy && <CopyButton code={value} />}
    </div>
    <div className='truncate font-mono text-sm text-green-400'>
      {label === 'created' ? value : shorten(value)}
    </div>
  </div>
)

export default function ModuleClient({ module_name, code, api }: ModuleClientProps) {
  const client = new Client()
  const [module, setModule] = useState<ModuleType | undefined>()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [syncing, setSyncing] = useState<boolean>(false)
  const [codeMap, setCodeMap] = useState<Record<string, string>>({})
  const initialTab: TabType = code ? 'code' : api ? 'api' : 'code'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  const fetchModule = useCallback(async (update = false) => {
    try {
      if (update) setSyncing(true)
      const params = { module: module_name, update }
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

  useEffect(() => {
    fetchModule()
  }, [fetchModule])

  const handleSync = () => {
    fetchModule(true)
  }

  if (loading) return <Loading />
  
  if (error || !module) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-black'>
        <div className='max-w-md text-center'>
          <ExclamationTriangleIcon className='mx-auto h-12 w-12 text-red-500 mb-4' />
          <h2 className='text-xl font-semibold text-red-500 mb-2'>Error Loading Module</h2>
          <p className='text-gray-400 mb-6'>{error}</p>
          <Link
            href='/'
            className='inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-black/90 px-4 py-2 text-green-400 hover:bg-green-900/20'
          >
            <ArrowLeftIcon className='h-4 w-4' />
            Back to Modules
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'code', label: 'CODE', icon: CodeBracketIcon },
    { id: 'api', label: 'SCHEMA', icon: ServerIcon },
  ]

  return (
    <div className='min-h-screen bg-gradient-to-b from-black to-gray-950 p-6 font-mono text-green-400'>
      <div className='mx-auto max-w-7xl space-y-6'>
        {/* Header */}
        <div className='overflow-hidden rounded-2xl border border-green-500/30 bg-black/90 shadow-xl backdrop-blur-sm'>
          <div className='space-y-6 border-b border-green-500/30 p-8'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <BeakerIcon className='h-8 w-8 text-green-400' />
                <div>
                  <h1 className='text-3xl font-bold text-green-400'>
                    {module.name}
                  </h1>
                  <p className='mt-1 text-gray-400'>
                    {module.network || 'commune'}
                  </p>
                </div>
              </div>
              <div className='flex space-x-4'>
                <button 
                  className='flex items-center space-x-2 rounded-lg border border-green-500/30 bg-green-900/20 p-2 text-green-400 hover:bg-green-900/40 disabled:opacity-50 md:px-6 md:py-3'
                  onClick={handleSync}
                  disabled={syncing}
                  aria-label='Sync module data'
                >
                  <ArrowPathIcon className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
                  <span className='hidden md:inline'>{syncing ? 'syncing...' : 'sync'}</span>
                </button>
              </div>
            </div>

            <p className='max-w-3xl text-gray-400'>
              {module.desc || 'No description available'}
            </p>

            {module.tags?.length > 0 && (
              <div className='flex flex-wrap gap-2' role='list' aria-label='Module tags'>
                {module.tags.map((tag, i) => (
                  <span
                    key={i}
                    className='rounded-full border border-green-500/30 bg-green-900/20 px-3 py-1 text-sm text-green-400'
                    role='listitem'
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {module.key && <InfoCard label='key' value={module.key} />}
              {module.cid && <InfoCard label='cid' value={module.cid} />}
              <InfoCard label='created' value={time2str(module.time)} showCopy={false} />
            </div>
          </div>

          {/* Tabs */}
          <div className='flex border-b border-green-500/30' role='tablist'>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as TabType)}
                className={`flex items-center space-x-2 px-8 py-4 transition-all ${
                  activeTab === id
                    ? 'border-b-2 border-green-400 bg-green-900/20 text-green-400'
                    : 'text-gray-400 hover:bg-green-900/10 hover:text-green-400'
                }`}
                role='tab'
                aria-selected={activeTab === id}
                aria-controls={`tabpanel-${id}`}
              >
                <Icon className='h-5 w-5' />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className='p-8' role='tabpanel' id={`tabpanel-${activeTab}`}>
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

        {/* Footer Actions */}
        <nav className='flex flex-wrap items-center justify-between gap-2 sm:gap-4' aria-label='Module actions'>
          <Link
            href='/'
            className='flex w-full items-center justify-center space-x-2 rounded-xl border border-green-500/30 bg-black/90 px-6 py-3 text-center text-green-400 transition-all hover:bg-green-900/20 sm:w-auto'
          >
            <ArrowLeftIcon className='h-5 w-5' />
            <span>Back to Modules</span>
          </Link>

          <div className='flex w-full flex-wrap justify-center gap-2 sm:w-auto sm:justify-end sm:gap-4'>
            {module.url && (
              <a
                href={module.url}
                target='_blank'
                rel='noopener noreferrer'
                className='w-full rounded-xl border border-green-500/30 bg-black/90 px-6 py-3 text-center text-green-400 transition-all hover:bg-green-900/20 sm:w-auto flex items-center justify-center gap-2'
              >
                <GlobeAltIcon className='h-5 w-5' />
                <span>Visit App</span>
              </a>
            )}
            <button className='w-full rounded-xl border border-green-500/30 bg-black/90 px-6 py-3 text-center text-green-400 transition-all hover:bg-green-900/20 sm:w-auto flex items-center justify-center gap-2'>
              <DocumentTextIcon className='h-5 w-5' />
              <span>Documentation</span>
            </button>
            <button className='w-full rounded-xl border border-green-500/30 bg-black/90 px-6 py-3 text-center text-green-400 transition-all hover:bg-green-900/20 sm:w-auto flex items-center justify-center gap-2'>
              <ExclamationTriangleIcon className='h-5 w-5' />
              <span>Report Issue</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}