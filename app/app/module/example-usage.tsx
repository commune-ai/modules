'use client'

import { ModuleExplorer } from './ModuleExplorer'

// Example usage of ModuleExplorer
export default function ExamplePage() {
  // Example files object - in real usage, this would come from your data source
  const files = {
    '/app/components/Button.tsx': `import React from 'react'\n\ninterface ButtonProps {\n  onClick: () => void\n  children: React.ReactNode\n}\n\nexport const Button = ({ onClick, children }: ButtonProps) => {\n  return (\n    <button\n      onClick={onClick}\n      className="px-4 py-2 bg-green-500 text-white rounded"\n    >\n      {children}\n    </button>\n  )\n}`,
    '/app/utils/helpers.ts': `export const formatDate = (date: Date): string => {\n  return date.toLocaleDateString()\n}\n\nexport const capitalize = (str: string): string => {\n  return str.charAt(0).toUpperCase() + str.slice(1)\n}`,
    '/app/styles/globals.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  background: #000;\n  color: #fff;\n}`,
  }
  
  return (
    <div className="h-screen bg-black">
      <ModuleExplorer files={files} />
    </div>
  )
}