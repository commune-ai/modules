'use client'

import { useState, useEffect } from 'react'
import { DocumentIcon, HashtagIcon } from '@heroicons/react/24/outline'
import { CopyButton } from '@/app/components/CopyButton'

interface FileHashViewerProps {
  files: Record<string, string>
}

export default function FileHashViewer({ files }: FileHashViewerProps) {
  const [fileHashes, setFileHashes] = useState<Record<string, string>>({})

  useEffect(() => {
    // Calculate hashes for each file
    const calculateHashes = async () => {
      const hashes: Record<string, string> = {}
      
      for (const [path, content] of Object.entries(files)) {
        // Simple hash function for demonstration
        const encoder = new TextEncoder()
        const data = encoder.encode(content)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        hashes[path] = hashHex
      }
      
      setFileHashes(hashes)
    }
    
    calculateHashes()
  }, [files])

  const getFileName = (path: string) => {
    return path.split('/').pop() || path
  }

  const shortenHash = (hash: string) => {
    if (!hash) return '...'
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`
  }

  return (
    <div className="min-h-screen bg-black p-6 font-mono">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-green-400">File Hash Viewer</h1>
        
        <div className="overflow-hidden rounded-lg border border-green-500/30 bg-black/90">
          <table className="w-full">
            <thead>
              <tr className="border-b border-green-500/30 bg-green-900/20">
                <th className="px-6 py-4 text-left text-sm font-medium text-green-400">
                  <div className="flex items-center gap-2">
                    <DocumentIcon className="h-4 w-4" />
                    File Name
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-green-400">
                  <div className="flex items-center gap-2">
                    <HashtagIcon className="h-4 w-4" />
                    SHA-256 Hash
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-green-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-500/20">
              {Object.entries(fileHashes).map(([path, hash]) => (
                <tr key={path} className="hover:bg-green-900/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-green-400">{getFileName(path)}</span>
                      <span className="text-xs text-gray-500">{path}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-400 text-sm">
                      {shortenHash(hash)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CopyButton code={hash} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 rounded-lg border border-green-500/30 bg-black/90 p-4">
          <p className="text-sm text-gray-400">
            Total files: <span className="text-green-400">{Object.keys(fileHashes).length}</span>
          </p>
        </div>
      </div>
    </div>
  )
}