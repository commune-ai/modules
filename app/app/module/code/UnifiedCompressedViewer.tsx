'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, FolderIcon, FolderOpenIcon, MagnifyingGlassIcon, CodeBracketIcon, DocumentTextIcon, PhotoIcon, FilmIcon, MusicalNoteIcon, ArchiveBoxIcon, CubeIcon, DocumentChartBarIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { CopyButton } from '@/app/components/CopyButton'
import crypto from 'crypto'

interface UnifiedCompressedViewerProps {
  files: Record<string, string>;
  title?: string;
  defaultExpanded?: boolean;
  showFileTree?: boolean;
  defaultExpandedFolders?: boolean;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
  hash?: string;
  lineCount?: number;
  size?: string;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const iconMap: Record<string, any> = {
    ts: CodeBracketIcon,
    tsx: CodeBracketIcon,
    js: CodeBracketIcon,
    jsx: CodeBracketIcon,
    py: CodeBracketIcon,
    json: DocumentChartBarIcon,
    css: DocumentTextIcon,
    html: DocumentTextIcon,
    md: DocumentTextIcon,
    txt: DocumentTextIcon,
    jpg: PhotoIcon,
    jpeg: PhotoIcon,
    png: PhotoIcon,
    gif: PhotoIcon,
    svg: PhotoIcon,
    mp4: FilmIcon,
    avi: FilmIcon,
    mov: FilmIcon,
    mp3: MusicalNoteIcon,
    wav: MusicalNoteIcon,
    zip: ArchiveBoxIcon,
    tar: ArchiveBoxIcon,
    gz: ArchiveBoxIcon,
  }
  return iconMap[ext] || DocumentIcon
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

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  else return (bytes / 1048576).toFixed(1) + ' MB'
}

const buildFileTree = (files: Record<string, string>): FileNode[] => {
  const root: FileNode = {
    name: '',
    path: '',
    type: 'folder',
    children: [],
  }

  Object.entries(files).forEach(([path, content]) => {
    const parts = path.split('/').filter(Boolean)
    let current = root

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1
      const currentPath = parts.slice(0, index + 1).join('/')
      let child = current.children?.find((c) => c.name === part)

      if (!child) {
        child = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          content: isFile ? content : undefined,
          language: isFile ? getLanguageFromPath(part) : undefined,
          hash: isFile ? crypto.createHash('sha256').update(content).digest('hex').substring(0, 8) : undefined,
          lineCount: isFile ? content.split('\n').length : undefined,
          size: isFile ? formatFileSize(content.length) : undefined,
        }
        current.children!.push(child)
      }

      if (!isFile) {
        current = child
      }
    })
  })

  return root.children || []
}

function FileTreeItem({
  node,
  level,
  expandedFolders,
  toggleFolder,
  onCopy,
}: {
  node: FileNode;
  level: number;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
  onCopy: (node: FileNode) => void;
}) {
  const isExpanded = expandedFolders.has(node.path)
  const FileIcon = node.type === 'file' ? getFileIcon(node.name) : (isExpanded ? FolderOpenIcon : FolderIcon)

  const handleClick = () => {
    if (node.type === 'folder') {
      toggleFolder(node.path)
    }
  }

  return (
    <div>
      <div
        className={`group flex items-center px-2 py-1.5 cursor-pointer hover:bg-gray-800/50 rounded-md text-xs transition-all duration-150`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' && (
          isExpanded ? (
            <ChevronDownIcon className="h-3 w-3 mr-1 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-3 w-3 mr-1 text-gray-400" />
          )
        )}
        <FileIcon className={`h-4 w-4 mr-2 flex-shrink-0 ${
          node.type === 'folder' ? 'text-yellow-500' : 'text-gray-400'
        }`} />
        <span className="truncate font-mono text-gray-300 flex-1">{node.name}</span>
        {node.type === 'file' && (
          <>
            <span className="ml-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {node.size}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCopy(node)
              }}
              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copy file content"
            >
              <ClipboardDocumentIcon className="h-3 w-3 text-green-400 hover:text-green-300" />
            </button>
          </>
        )}
      </div>
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const UnifiedCompressedViewer: React.FC<UnifiedCompressedViewerProps> = ({ 
  files, 
  title = 'Compressed Code Bundle',
  defaultExpanded = false,
  showFileTree = false,
  defaultExpandedFolders = true
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [showTree, setShowTree] = useState(showFileTree)
  
  // Build file tree on mount or when files change
  useEffect(() => {
    const tree = buildFileTree(files)
    setFileTree(tree)
    
    // Auto-expand all folders by default if specified
    if (defaultExpandedFolders) {
      const allFolders = new Set<string>()
      const collectFolders = (nodes: FileNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'folder') {
            allFolders.add(node.path)
            if (node.children) collectFolders(node.children)
          }
        })
      }
      collectFolders(tree)
      setExpandedFolders(allFolders)
    }
  }, [files, defaultExpandedFolders])
  
  // Process and combine all files
  const processedData = useMemo(() => {
    const allContent: string[] = []
    const fileMetadata: Array<{
      path: string;
      name: string;
      language: string;
      lineCount: number;
      hash: string;
      startLine: number;
      endLine: number;
      size: string;
    }> = []
    
    let currentLine = 1
    
    Object.entries(files).forEach(([path, content]) => {
      const lines = content.split('\n')
      const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 8)
      
      fileMetadata.push({
        path,
        name: path.split('/').pop() || path,
        language: getLanguageFromPath(path),
        lineCount: lines.length,
        hash,
        startLine: currentLine,
        endLine: currentLine + lines.length - 1,
        size: formatFileSize(content.length)
      })
      
      // Add file header comment
      allContent.push(`// ===== FILE: ${path} [${hash}] =====`)

      allContent.push(...lines)
      allContent.push('') // Empty line between files
      
      currentLine += lines.length + 2 // +2 for header and empty line
    })
    
    const combinedContent = allContent.join('\n')
    const totalSize = combinedContent.length
    
    return {
      content: combinedContent,
      metadata: fileMetadata,
      totalLines: currentLine - 1,
      totalSize: formatFileSize(totalSize),
      fileCount: fileMetadata.length
    }
  }, [files])
  
  // Filter content based on search
  const filteredContent = useMemo(() => {
    if (!searchTerm) return processedData.content
    
    const lines = processedData.content.split('\n')
    const term = searchTerm.toLowerCase()
    const matchingLines: number[] = []
    
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(term)) {
        // Include context: 2 lines before and after
        for (let i = Math.max(0, index - 2); i <= Math.min(lines.length - 1, index + 2); i++) {
          if (!matchingLines.includes(i)) {
            matchingLines.push(i)
          }
        }
      }
    })
    
    if (matchingLines.length === 0) return '// No matches found'
    
    // Group consecutive lines
    const groups: number[][] = []
    let currentGroup: number[] = [matchingLines[0]]
    
    for (let i = 1; i < matchingLines.length; i++) {
      if (matchingLines[i] === matchingLines[i - 1] + 1) {
        currentGroup.push(matchingLines[i])
      } else {
        groups.push(currentGroup)
        currentGroup = [matchingLines[i]]
      }
    }
    groups.push(currentGroup)
    
    // Build filtered content
    const filteredLines: string[] = []
    groups.forEach((group, index) => {
      if (index > 0) filteredLines.push('// ...')
      group.forEach(lineNum => {
        filteredLines.push(`${lineNum + 1}: ${lines[lineNum]}`)
      })
    })
    
    return filteredLines.join('\n')
  }, [processedData.content, searchTerm])
  
  const toggleFile = (path: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }
  
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }
  
  const copyFileContent = (node: FileNode) => {
    if (node.content) {
      navigator.clipboard.writeText(node.content)
    }
  }
  
  const copyFolderContent = (node: FileNode) => {
    const folderContent: string[] = []
    const collectContent = (n: FileNode) => {
      if (n.type === 'file' && n.content) {
        folderContent.push(`// ${n.path}\n${n.content}`)
      } else if (n.children) {
        n.children.forEach(collectContent)
      }
    }
    collectContent(node)
    navigator.clipboard.writeText(folderContent.join('\n\n'))
  }
  
  const handleCopy = (node: FileNode) => {
    if (node.type === 'file') {
      copyFileContent(node)
    } else {
      copyFolderContent(node)
    }
  }
  
  const copyAllCode = () => {
    navigator.clipboard.writeText(processedData.content)
  }
  
  const downloadAsFile = () => {
    const blob = new Blob([processedData.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'compressed-code-bundle.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="rounded-lg bg-black/90 overflow-hidden">
      {/* Header */}
      <div className="bg-black/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <CodeBracketIcon className="h-6 w-6 text-green-400" />
            <h2 className="text-lg font-semibold text-green-400">{title}</h2>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{processedData.fileCount} files</span>
            <span>{processedData.totalLines} lines</span>
            <span>{processedData.totalSize}</span>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-3">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search across all files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/60 border border-green-500/20 rounded-lg 
                     text-green-400 placeholder-gray-500 text-sm
                     focus:outline-none focus:border-green-400"
          />
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
              {isExpanded ? 'Collapse' : 'Expand'} Code View
            </button>
            <button
              onClick={() => setShowTree(!showTree)}
              className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              <FolderIcon className="h-4 w-4" />
              {showTree ? 'Hide' : 'Show'} File Tree
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={copyAllCode}
              className="text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              Copy All
            </button>
            <button
              onClick={downloadAsFile}
              className="text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      </div>
      
      {/* File Tree and Content Container */}
      <div className="flex">
        {/* File Tree Sidebar */}
        {showTree && (
          <div className="w-64 bg-black/40 p-4 max-h-[600px] overflow-y-auto">
            <h3 className="text-sm font-medium text-green-400 mb-3 flex items-center justify-between">
              <span>File Structure</span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    const allFolders = new Set<string>()
                    const collectFolders = (nodes: FileNode[]) => {
                      nodes.forEach(node => {
                        if (node.type === 'folder') {
                          allFolders.add(node.path)
                          if (node.children) collectFolders(node.children)
                        }
                      })
                    }
                    collectFolders(fileTree)
                    setExpandedFolders(allFolders)
                  }}
                  className="text-xs text-green-400 hover:text-green-300"
                  title="Expand all folders"
                >
                  <ChevronDownIcon className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setExpandedFolders(new Set())}
                  className="text-xs text-green-400 hover:text-green-300"
                  title="Collapse all folders"
                >
                  <ChevronRightIcon className="h-3 w-3" />
                </button>
              </div>
            </h3>
            <div className="space-y-0">
              {fileTree.map((node) => (
                <FileTreeItem
                  key={node.path}
                  node={node}
                  level={0}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Main Content Area */}
        <div className="flex-1">
          {/* File Index */}
          <div className="bg-black/50 p-4">
            <h3 className="text-sm font-medium text-green-400 mb-2">File Index</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {processedData.metadata.map((file) => {
                const FileIcon = getFileIcon(file.name)
                return (
                  <button
                    key={file.path}
                    onClick={() => toggleFile(file.path)}
                    className="flex items-center justify-between p-2 rounded-md 
                             bg-black/40 hover:bg-black/60 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-mono text-green-400 truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className={languageColors[file.language]}>{file.language}</span>
                      <span>{file.size}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Compressed Code View */}
          {isExpanded && (
            <div className="max-h-[600px] overflow-y-auto bg-gray-950/50">
              <div className="flex">
                {/* Line Numbers */}
                <div className="text-gray-500 text-xs font-mono p-4 pr-2 select-none">
                  {(searchTerm ? filteredContent : processedData.content).split('\n').map((_, index) => (
                    <div key={index}>{searchTerm ? '' : index + 1}</div>
                  ))}
                </div>
                
                {/* Code Content */}
                <div className="flex-1 p-4 pl-4">
                  <pre className="overflow-x-auto">
                    <code className="text-xs font-mono leading-relaxed">
                      {searchTerm ? (
                        <span className="text-green-400">{filteredContent}</span>
                      ) : (
                        processedData.content.split('\n').map((line, index) => {
                          // Check if this is a file header
                          if (line.startsWith('// ===== FILE:')) {
                            return (
                              <div key={index} className="text-yellow-400 font-bold mt-2 mb-1">
                                {line}
                              </div>
                            )
                          }
                          
                          // Find which file this line belongs to
                          const fileInfo = processedData.metadata.find(
                            f => index + 1 >= f.startLine && index + 1 <= f.endLine
                          )
                          
                          const langColor = fileInfo ? languageColors[fileInfo.language] : 'text-gray-300'
                          
                          return (
                            <div key={index} className={langColor}>
                              {line}
                            </div>
                          )
                        })
                      )}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Footer */}
      <div className="bg-black/60 p-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Unified code bundle ready for compression</span>
          <span className="font-mono">SHA: {crypto.createHash('sha256').update(processedData.content).digest('hex').substring(0, 16)}</span>
        </div>
      </div>
    </div>
  )
}