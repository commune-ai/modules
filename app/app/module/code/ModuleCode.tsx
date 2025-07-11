'use client'

import { ModuleFileViewer } from './ModuleFileViewer'
import { CompressedCodeViewer } from './CompressedCodeViewer'
import { UnifiedCompressedViewer } from './UnifiedCompressedViewer'

interface ModuleCodeProps {
  code: string;
  path: string;
  language?: string;
  files?: Array<{ path: string; hash: string; content: string }>;
  useCompressedView?: boolean;
}

export const ModuleCode = ({ code, path, language, files, useCompressedView = false }: ModuleCodeProps) => {
  // Convert files array to Record format
  const filesRecord: Record<string, string> = files 
    ? files.reduce((acc, file) => {
        acc[file.path] = file.content;
        return acc;
      }, {} as Record<string, string>)
    : { [path]: code };

  // Use UnifiedCompressedViewer for ultimate compression with file tree
  if (useCompressedView && files && files.length > 1) {
    return (
      <UnifiedCompressedViewer 
        files={filesRecord}
        title="Module Source Code"
        defaultExpanded={true}
        showFileTree={true}
        defaultExpandedFolders={true}
      />
    )
  }

  // Use CompressedCodeViewer for multiple files with file tree
  if (files && files.length > 1) {
    return (
      <CompressedCodeViewer 
        files={filesRecord}
        title="Code Files"
        showSearch={true}
        showFileTree={true}
        compactMode={false}
        defaultExpandedFolders={true}
      />
    )
  }

  // Use original ModuleFileViewer for single file
  return (
    <div className="rounded-lg border border-green-500/20 bg-black/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-green-500/20 bg-black/40">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-green-400">Code Viewer</span>
          <span className="text-xs text-gray-500">{path}</span>
        </div>
      </div>
      
      {/* Use the unified ModuleFileViewer */}
      <ModuleFileViewer 
        files={filesRecord} 
        defaultPath={path}
        showHashes={true}
        showTabs={false}
      />
    </div>
  )
}