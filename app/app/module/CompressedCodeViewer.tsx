'use client'

import { useState, useEffect, useMemo } from 'react'
import { CopyButton } from '@/app/components/CopyButton'
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, FolderIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import crypto from 'crypto'

interface CompressedCodeViewerProps {
  files: Record<string, string>;
  title?: string;
  showSearch?: boolean;
  showFileTree?: boolean;
  compactMode?: boolean;
}

interface FileSection {
  path: string;
  name: string;
  content: string;
  language: string;
  hash: string;
  lineCount: number;
}

const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    json: 'json',
    css: 'css',
    html: 'html',
    md: 'markdown',
  }
  return langMap[ext] || 'text'
}

const languageColors: Record<string, string> = {
  typescript: 'text-blue-400',
  javascript: 'text-yellow-400',
  python: 'text-green-400',
  json: 'text-orange-400',
  css: 'text-pink-400',
  html: 'text-red-400',
  markdown: 'text-gray-400',
  text: 'text-gray-300',
}

const calculateHash = (content: string): string => {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8)
}

export const CompressedCodeViewer: React.FC<CompressedCodeViewerProps> = ({ 
  files, 
  title = 'Compressed Code Viewer',
  showSearch = true,
  showFileTree = true,
  compactMode = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  
  // Process files into sections
  const fileSections = useMemo(() => {
    return Object.entries(files).map(([path, content]) => ({
      path,
      name: path.split('/').pop() || path,
      content,
      language: getLanguageFromPath(path),
      hash: calculateHash(content),
      lineCount: content.split('\n').length
    }))
  }, [files])
  
  // Filter files based on search
  const filteredSections = useMemo(() => {
    if (!searchTerm) return fileSections
    
    const term = searchTerm.toLowerCase()
    return fileSections.filter(section => 
      section.path.toLowerCase().includes(term) ||
      section.content.toLowerCase().includes(term)
    )
  }, [fileSections, searchTerm])
  
  // Calculate total stats
  const stats = useMemo(() => {
    const totalLines = filteredSections.reduce((sum, section) => sum + section.lineCount, 0)
    const totalSize = filteredSections.reduce((sum, section) => sum + section.content.length, 0)
    return {
      fileCount: filteredSections.length,
      totalLines,
      totalSize: (totalSize / 1024).toFixed(2) + ' KB'
    }
  }, [filteredSections])
  
  const toggleFile = (path: string) => {
    setCollapsedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }
  
  const renderLineNumbers = (content: string, startLine: number = 1) => {
    const lines = content.split('\n')
    return (
      <div className="text-gray-500 text-xs font-mono pr-2 select-none">
        {lines.map((_, index) => (
          <div key={index} className="text-right">
            {startLine + index}
          </div>
        ))}
      </div>
    )
  }
  
  const renderCode = (content: string, language: string) => {
    const langColor = languageColors[language] || 'text-gray-300'
    return (
      <pre className="overflow-x-auto flex-1">
        <code className={`text-xs ${langColor} font-mono leading-relaxed`}>
          {content}
        </code>
      </pre>
    )
  }
  
  return (
    <div className="rounded-lg border border-green-500/20 bg-black/90 overflow-hidden">
      {/* Header */}
      <div className="border-b border-green-500/20 bg-black/60 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-green-400">{title}</h2>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{stats.fileCount} files</span>
            <span>{stats.totalLines} lines</span>
            <span>{stats.totalSize}</span>
          </div>
        </div>
        
        {/* Search Bar */}
        {showSearch && (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/60 border border-green-500/20 rounded-lg 
                       text-green-400 placeholder-gray-500 text-sm
                       focus:outline-none focus:border-green-400"
            />
          </div>
        )}
      </div>
      
      {/* File Tree Sidebar (optional) */}
      <div className="flex">
        {showFileTree && (
          <div className="w-64 border-r border-green-500/20 bg-black/40 p-4 max-h-[600px] overflow-y-auto">
            <h3 className="text-sm font-medium text-green-400 mb-3">File Tree</h3>
            <div className="space-y-1">
              {filteredSections.map((section) => (
                <button
                  key={section.path}
                  onClick={() => setSelectedFile(section.path)}
                  className={`w-full text-left px-2 py-1 rounded text-xs font-mono transition-colors
                    ${selectedFile === section.path 
                      ? 'bg-green-900/30 text-green-300 border-l-2 border-green-400' 
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <DocumentIcon className="h-3 w-3" />
                    <span className="truncate">{section.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs opacity-60">
                    <span>{section.lineCount} lines</span>
                    <span>#{section.hash}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Compressed Code View */}
        <div className="flex-1 max-h-[600px] overflow-y-auto">
          {filteredSections.map((section, index) => {
            const isCollapsed = collapsedFiles.has(section.path)
            const isSelected = selectedFile === section.path
            
            // If file tree is shown and a file is selected, only show that file
            if (showFileTree && selectedFile && !isSelected) {
              return null
            }
            
            return (
              <div 
                key={section.path} 
                className={`border-b border-green-500/10 last:border-b-0 ${
                  isSelected ? 'bg-green-900/10' : ''
                }`}
              >
                {/* File Header */}
                <div 
                  className="flex items-center justify-between p-3 bg-black/40 hover:bg-black/60 cursor-pointer"
                  onClick={() => toggleFile(section.path)}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    )}
                    <DocumentIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-mono text-green-400">{section.path}</span>
                    <span className={`text-xs ${languageColors[section.language]}`}>
                      {section.language.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {section.lineCount} lines
                    </span>
                    <span className="text-xs font-mono text-green-400">
                      #{section.hash}
                    </span>
                    <CopyButton code={section.content} />
                  </div>
                </div>
                
                {/* File Content */}
                {!isCollapsed && (
                  <div className="flex bg-gray-950/50">
                    {!compactMode && renderLineNumbers(section.content)}
                    <div className="flex-1 p-3 overflow-x-auto">
                      {renderCode(section.content, section.language)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Footer with quick actions */}
      {!compactMode && (
        <div className="border-t border-green-500/20 bg-black/60 p-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setCollapsedFiles(new Set())}
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={() => setCollapsedFiles(new Set(fileSections.map(s => s.path)))}
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                Collapse All
              </button>
            </div>
            <button
              onClick={() => {
                const allCode = filteredSections.map(s => `// ${s.path}\n${s.content}`).join('\n\n')
                navigator.clipboard.writeText(allCode)
              }}
              className="flex items-center gap-2 text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              <DocumentIcon className="h-3 w-3" />
              Copy All Code
            </button>
          </div>
        </div>
      )}
    </div>
  )
}