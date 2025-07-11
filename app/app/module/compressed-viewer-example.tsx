'use client'

import { CompressedCodeViewer } from './CompressedCodeViewer'

// Example usage of CompressedCodeViewer
export default function CompressedViewerExample() {
  // Example files object - in real usage, this would come from your data source
  const files = {
    '/app/components/Button.tsx': `import React from 'react'\n\ninterface ButtonProps {\n  onClick: () => void\n  children: React.ReactNode\n}\n\nexport const Button = ({ onClick, children }: ButtonProps) => {\n  return (\n    <button\n      onClick={onClick}\n      className="px-4 py-2 bg-green-500 text-white rounded"\n    >\n      {children}\n    </button>\n  )\n}`,
    '/app/utils/helpers.ts': `export const formatDate = (date: Date): string => {\n  return date.toLocaleDateString()\n}\n\nexport const capitalize = (str: string): string => {\n  return str.charAt(0).toUpperCase() + str.slice(1)\n}`,
    '/app/styles/globals.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  background: #000;\n  color: #fff;\n}`,
    '/app/hooks/useAuth.ts': `import { useState, useEffect } from 'react'\n\nexport const useAuth = () => {\n  const [user, setUser] = useState(null)\n  const [loading, setLoading] = useState(true)\n  \n  useEffect(() => {\n    // Auth logic here\n    setLoading(false)\n  }, [])\n  \n  return { user, loading }\n}`,
    '/app/api/route.ts': `export async function GET(request: Request) {\n  return Response.json({ message: 'Hello World' })\n}\n\nexport async function POST(request: Request) {\n  const data = await request.json()\n  return Response.json({ received: data })\n}`,
  }
  
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-green-400 mb-8">Compressed Code Viewer Examples</h1>
        
        {/* Example 1: Full Featured */}
        <div>
          <h2 className="text-xl font-semibold text-green-400 mb-4">Full Featured View</h2>
          <CompressedCodeViewer 
            files={files}
            title="Project Source Code"
            showSearch={true}
            showFileTree={true}
            compactMode={false}
          />
        </div>
        
        {/* Example 2: Compact Mode */}
        <div>
          <h2 className="text-xl font-semibold text-green-400 mb-4">Compact Mode (No File Tree)</h2>
          <CompressedCodeViewer 
            files={files}
            title="Compact View"
            showSearch={true}
            showFileTree={false}
            compactMode={true}
          />
        </div>
        
        {/* Example 3: Minimal */}
        <div>
          <h2 className="text-xl font-semibold text-green-400 mb-4">Minimal View</h2>
          <CompressedCodeViewer 
            files={{
              '/app/main.ts': `console.log('Hello World')\nexport default function main() {\n  return 'Running...'\n}`
            }}
            title="Single File"
            showSearch={false}
            showFileTree={false}
            compactMode={true}
          />
        </div>
      </div>
    </div>
  )
}