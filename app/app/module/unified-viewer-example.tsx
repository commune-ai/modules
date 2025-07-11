'use client'

import { UnifiedCompressedViewer } from './code/UnifiedCompressedViewer'
import { useState } from 'react'

export default function UnifiedViewerExample() {
  // Example: Load all module files into the unified viewer
  const [showCompressed, setShowCompressed] = useState(true)
  
  // In real usage, this would come from your data source
  const allModuleFiles = {
    '/app/module/ModuleCard.tsx': `// Module card component code...`,
    '/app/module/ModuleSchema.tsx': `// Module schema component code...`,
    '/app/module/CreateModule.tsx': `// Create module component code...`,
    '/app/module/Modules.tsx': `// Modules list component code...`,
    '/app/module/ModuleCode.tsx': `// Module code viewer component...`,
    '/app/module/ModuleFileViewer.tsx': `// File viewer component code...`,
    '/app/module/CompressedCodeViewer.tsx': `// Compressed viewer component code...`,
    '/app/module/ModuleClient.tsx': `// Module client component code...`,
    // Add all your actual file contents here
  }
  
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-green-400 mb-8">Unified Compressed Code Viewer</h1>
        
        <div className="mb-4">
          <button
            onClick={() => setShowCompressed(!showCompressed)}
            className="px-4 py-2 bg-green-900/20 border border-green-500/30 rounded-lg 
                     text-green-400 hover:bg-green-900/40 transition-colors"
          >
            {showCompressed ? 'Hide' : 'Show'} Compressed View
          </button>
        </div>
        
        {showCompressed && (
          <UnifiedCompressedViewer 
            files={allModuleFiles}
            title="Complete Module Codebase"
            defaultExpanded={true}
          />
        )}
        
        <div className="mt-8 p-4 border border-green-500/20 rounded-lg bg-black/60">
          <h2 className="text-lg font-semibold text-green-400 mb-2">Features:</h2>
          <ul className="list-disc list-inside text-green-400 space-y-1 text-sm">
            <li>All files compressed into a single scrollable view</li>
            <li>Global search across all files</li>
            <li>File index with quick navigation</li>
            <li>Syntax highlighting preserved</li>
            <li>Copy all code with one click</li>
            <li>Download as single file</li>
            <li>Line numbers and file boundaries</li>
            <li>Compact file metadata display</li>
          </ul>
        </div>
      </div>
    </div>
  )
}