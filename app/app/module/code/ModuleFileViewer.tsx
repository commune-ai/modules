'use client'

import { useState, useEffect, useRef } from 'react'
import { CopyButton } from '@/app/components/CopyButton'
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, FolderIcon, XMarkIcon, CodeBracketIcon, DocumentTextIcon, PhotoIcon, FilmIcon, MusicalNoteIcon, ArchiveBoxIcon, DocumentChartBarIcon, ClipboardDocumentIcon, FolderOpenIcon } from '@heroicons/react/24/outline'
import crypto from 'crypto'

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
  hash?: string;
  size?: string;
}

interface ModuleFileViewerProps {
  files: Record<string, string>;
  defaultPath?: string;
  showHashes?: boolean;
  showTabs?: boolean;
}

interface Tab {
  path: string;
  name: string;
  content: string;
  language: string;
  hash: string;
  size: string;
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
  showHashes,
  onCopy,
}: {
  node: FileNode;
  level: number;
  onSelect: (node: FileNode) => void;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
  selectedPath?: string;
  showHashes?: boolean;
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
        className={`group flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-gray-800/50 rounded-md transition-all duration-150 ${
          isSelected ? 'bg-gray-800/50 border-l-2 border-green-400' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center flex-1 min-w-0">
          {node.type === 'folder' && (
            isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 mr-1" />
            )
          )}
          <FileIcon className={`h-4 w-4 mr-2 flex-shrink-0 ${
            node.type === 'folder' ? 'text-yellow-500' : 'text-gray-400'
          }`} />
          <span className="text-sm font-mono text-gray-300 truncate">{node.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {node.type === 'file' && node.size && (
            <span className="text-xs text-gray-500">{node.size}</span>
          )}
          {node.type === 'file' && showHashes && node.hash && (
            <span className="text-xs font-mono text-green-400">{node.hash}</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCopy(node)
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title={node.type === 'file' ? 'Copy file content' : 'Copy folder contents'}
          >
            <ClipboardDocumentIcon className="h-3 w-3 text-green-400 hover:text-green-300" />
          </button>
        </div>
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
              showHashes={showHashes}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const ModuleFileViewer: React.FC<ModuleFileViewerProps> = ({ 
  files, 
  defaultPath,
  showHashes = false,
  showTabs = true
}) => {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [dividerPosition, setDividerPosition] = useState(30) // percentage
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const tree = buildFileTree(files)
    setFileTree(tree)
    
    // Select default file or first file
    if (defaultPath && files[defaultPath]) {
      const tab: Tab = {
        path: defaultPath,
        name: defaultPath.split('/').pop() || '',
        content: files[defaultPath],
        language: getLanguageFromPath(defaultPath),
        hash: calculateHash(files[defaultPath]),
        size: formatFileSize(files[defaultPath].length),
      }
      setTabs([tab])
    }
  }, [files, defaultPath])

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100
    setDividerPosition(Math.max(20, Math.min(80, newPosition)))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

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
    if (node.type === 'file' && node.content) {
      if (showTabs) {
        const existingTabIndex = tabs.findIndex(tab => tab.path === node.path)
        
        if (existingTabIndex >= 0) {
          setActiveTabIndex(existingTabIndex)
        } else {
          const newTab: Tab = {
            path: node.path,
            name: node.name,
            content: node.content,
            language: node.language || 'text',
            hash: node.hash || calculateHash(node.content),
            size: node.size || formatFileSize(node.content.length),
          }
          setTabs([...tabs, newTab])
          setActiveTabIndex(tabs.length)
        }
      } else {
        // Single file mode
        const tab: Tab = {
          path: node.path,
          name: node.name,
          content: node.content,
          language: node.language || 'text',
          hash: node.hash || calculateHash(node.content),
          size: node.size || formatFileSize(node.content.length),
        }
        setTabs([tab])
        setActiveTabIndex(0)
      }
    }
  }

  const copyNodeContent = (node: FileNode) => {
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

  const closeTab = (index: number) => {
    const newTabs = tabs.filter((_, i) => i !== index)
    setTabs(newTabs)
    
    if (activeTabIndex >= newTabs.length) {
      setActiveTabIndex(Math.max(0, newTabs.length - 1))
    } else if (activeTabIndex > index) {
      setActiveTabIndex(activeTabIndex - 1)
    }
  }
  
  const renderLineNumbers = (code: string) => {
    const lines = code.split('\n')
    return (
      <div className="text-gray-500 text-sm font-mono pr-4 select-none">
        {lines.map((_, index) => (
          <div key={index} className="text-right">
            {index + 1}
          </div>
        ))}
      </div>
    )
  }
  
  const renderCode = (code: string, language: string) => {
    const langColor = languageColors[language] || 'text-gray-300'
    return (
      <pre className="overflow-x-auto flex-1">
        <code className={`text-sm ${langColor} font-mono leading-relaxed`}>
          {code}
        </code>
      </pre>
    )
  }
  
  const activeTab = tabs[activeTabIndex]
  
  return (
    <div ref={containerRef} className="flex h-[600px] rounded-lg bg-gray-900/50 overflow-hidden relative">
      {/* File Explorer Sidebar */}
      <div 
        className="bg-gray-900/30 overflow-y-auto"
        style={{ width: `${dividerPosition}%` }}
      >
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-300">Files</h3>
        </div>
        <div className="py-2">
          {fileTree.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              level={0}
              onSelect={handleFileSelect}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              selectedPath={activeTab?.path}
              showHashes={showHashes}
              onCopy={copyNodeContent}
            />
          ))}
        </div>
      </div>
      
      {/* Draggable Divider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-gray-600 hover:bg-green-400 cursor-col-resize transition-colors z-10"
        style={{ left: `${dividerPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col gap-1">
            <div className="w-1 h-1 bg-current rounded-full"></div>
            <div className="w-1 h-1 bg-current rounded-full"></div>
            <div className="w-1 h-1 bg-current rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Code Viewer */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        {showTabs && tabs.length > 0 && (
          <div className="flex items-center bg-gray-900/40 overflow-x-auto">
            {tabs.map((tab, index) => {
              const TabIcon = getFileIcon(tab.name)
              return (
                <div
                  key={tab.path}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                    index === activeTabIndex
                      ? 'bg-gray-800/50 text-gray-200'
                      : 'text-gray-400 hover:bg-gray-800/30'
                  }`}
                  onClick={() => setActiveTabIndex(index)}
                >
                  <TabIcon className="h-3 w-3" />
                  <span className="text-xs font-mono">{tab.name}</span>
                  {showHashes && (
                    <span className="text-xs font-mono text-green-400">#{tab.hash}</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(index)
                    }}
                    className="ml-1 hover:text-gray-200"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
        
        {activeTab ? (
          <>
            {/* File Header */}
            <div className="flex items-center justify-between p-3 bg-gray-900/40">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-mono text-gray-300">{activeTab.name}</span>
                <span className={`text-xs font-medium ${languageColors[activeTab.language]}`}>
                  {activeTab.language.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">{activeTab.size}</span>
                {showHashes && (
                  <span className="text-xs font-mono text-green-400">#{activeTab.hash}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowLineNumbers(!showLineNumbers)}
                  className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showLineNumbers ? 'Hide' : 'Show'} line numbers
                </button>
                <CopyButton code={activeTab.content} />
              </div>
            </div>
            
            {/* Code Display */}
            <div className="flex-1 overflow-auto bg-gray-950/50">
              <div className="flex p-4">
                {showLineNumbers && renderLineNumbers(activeTab.content)}
                {renderCode(activeTab.content, activeTab.language)}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <DocumentIcon className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p className="text-sm">Select a file to view its contents</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}