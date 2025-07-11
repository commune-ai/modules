'use client'

import { useState, useEffect, useMemo } from 'react'
import { CopyButton } from '@/app/components/CopyButton'
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, FolderIcon, FolderOpenIcon, MagnifyingGlassIcon, CodeBracketIcon, DocumentTextIcon, PhotoIcon, FilmIcon, MusicalNoteIcon, ArchiveBoxIcon, DocumentChartBarIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import crypto from 'crypto'

interface CompressedCodeViewerProps {
  files: Record<string, string>;
  title?: string;
  showSearch?: boolean;
  showFileTree?: boolean;
  compactMode?: boolean;
  defaultExpandedFolders?: boolean;
}

interface FileSection {
  path: string;
  name: string;
  content: string;
  language: string;
  hash: string;
  lineCount: number;
  size: string;
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

const calculateHash = (content: string): string => {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8)
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
          hash: isFile ? calculateHash(content) : undefined,
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
  onSelect,
  expandedFolders,
  toggleFolder,
  selectedPath,
  onCopy,
}: {
  node: FileNode;
  level: number;
  onSelect: (node: FileNode) => void;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
  selectedPath?: string;
  onCopy: (node: FileNode) => void;
}) {
  const isExpanded = expandedFolders.has(node.path)
  const isSelected = selectedPath === node.path
  const FileIcon = node.type === 'file' ? getFileIcon(node.name) : (isExpanded ? FolderOpenIcon : FolderIcon)

  const handleClick = () => {
    if (node.type === 'folder') {
      toggleFolder(node.path)
    } else {
      onSelect(node)
    }
  }

  return (
    <div>
      <div
        className={`group flex items-center px-2 py-1.5 cursor-pointer hover:bg-gray-800/50 rounded-md text-xs transition-all duration-150 ${
          isSelected ? 'bg-green-900/30 text-green-300' : 'text-gray-400'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' && (
          isExpanded ? (
            <ChevronDownIcon className="h-3 w-3 mr-1" />
          ) : (
            <ChevronRightIcon className="h-3 w-3 mr-1" />
          )
        )}
        <FileIcon className={`h-4 w-4 mr-2 flex-shrink-0 ${
          node.type === 'folder' ? 'text-yellow-500' : 'text-gray-400'
        }`} />
        <span className="truncate font-mono flex-1">{node.name}</span>
        {node.type === 'file' && (
          <>
            <span className="ml-2 text-xs opacity-60">{node.size}</span>
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
        {node.type === 'folder' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCopy(node)
            }}
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy folder contents"
          >
            <ClipboardDocumentIcon className="h-3 w-3 text-green-400 hover:text-green-300" />
          </button>
        )}
      </div>
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              selectedPath={selectedPath}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const CompressedCodeViewer: React.FC<CompressedCodeViewerProps> = ({ 
  files, 
  title = 'Compressed Code Viewer',
  showSearch = true,
  showFileTree = true,
  compactMode = false,
  defaultExpandedFolders = true
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  
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
  
  // Process files into sections
  const fileSections = useMemo(() => {
    return Object.entries(files).map(([path, content]) => ({
      path,
      name: path.split('/').pop() || path,
      content,
      language: getLanguageFromPath(path),
      hash: calculateHash(content),
      lineCount: content.split('\n').length,
      size: formatFileSize(content.length)
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
      totalSize: formatFileSize(totalSize)
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
  
  const handleFileSelect = (node: FileNode) => {
    if (node.type === 'file') {
      setSelectedFile(node.path)
    }
  }
  
  const copyFileContent = (node: FileNode) => {
    if (node.type === 'file' && node.content) {
      navigator.clipboard.writeText(node.content)
    } else if (node.type === 'folder') {
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
    <div className="rounded-lg bg-black/90 overflow-hidden">
      {/* Header */}
      <div className="bg-black/60 p-4">
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
          <div className="w-64 bg-black/40 p-4 max-h-[600px] overflow-y-auto">
            <h3 className="text-sm font-medium text-green-400 mb-3 flex items-center justify-between">
              <span>Files</span>
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
                  onSelect={handleFileSelect}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  selectedPath={selectedFile}
                  onCopy={copyFileContent}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Compressed Code View */}
        <div className="flex-1 max-h-[600px] overflow-y-auto">
          {filteredSections.map((section, index) => {
            const isCollapsed = collapsedFiles.has(section.path)
            const isSelected = selectedFile === section.path
            const FileIcon = getFileIcon(section.name)
            
            // If file tree is shown and a file is selected, only show that file
            if (showFileTree && selectedFile && !isSelected) {
              return null
            }
            
            return (
              <div 
                key={section.path} 
                className={`${
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
                    <FileIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-mono text-green-400">{section.path}</span>
                    <span className={`text-xs ${languageColors[section.language]}`}>
                      {section.language.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {section.size}
                    </span>
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
        <div className="bg-black/60 p-3">
          <div className="flex items-center justify-end">
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