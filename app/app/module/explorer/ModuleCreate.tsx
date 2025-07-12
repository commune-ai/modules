'use client'

import { useState } from 'react'
import { ModuleType, DefaultModule } from '@/app/types/module'
import { Client } from '@/app/client/client'

const github_prefix: string = 'https://github.com/'
const ipfs_prefix: string = 'ipfs://'
const s3_prefix: string = 's3://'
const arweave_prefix: string = 'ar://'

export const CreateModule = ({ 
  onClose,
  onSuccess 
}: { 
  onClose: () => void
  onSuccess: () => void 
}) => {
  const [newModule, setNewModule] = useState<ModuleType>({
    ...DefaultModule,
    name: '', // Clear default name
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tagInput, setTagInput] = useState('') 
  const [showOptional, setShowOptional] = useState(false)
  const client = new Client()

  const handleFormChange = (field: string, value: any) => {
    setNewModule((prev) => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  // Handle tag input
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (newTag && !newModule.tags.includes(newTag)) {
        handleFormChange('tags', [...newModule.tags, newTag])
        setTagInput('')
      }
    }
  }

  // Function to remove a tag
  const removeTag = (tagToRemove: string) => {
    handleFormChange('tags', newModule.tags.filter(tag => tag !== tagToRemove))
  }

  const handleCreate = async () => {
    // Validate required field
    if (!newModule.name || newModule.name.trim() === '') {
      setError('Module name is required')
      return
    }

    setLoading(true)
    setError('')
    try {
      // Auto-generate URL if not provided
      if (!newModule.url) {
        newModule.url = `https://${newModule.name.toLowerCase().replace(/\s+/g, '-')}.commune.ai`
      }

      await client.call('add_module', newModule)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create module')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl p-6 bg-black/90 rounded-lg border border-green-500/30">
      <div className="flex items-center justify-between mb-6">
        <span className="ml-4 text-yellow-500">$ new_module</span>
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {/* Required Field - Module Name */}
        <div className="space-y-2">
          <label className="text-green-400 text-sm font-medium">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            placeholder="Enter your module name (e.g., my-awesome-module)"
            value={newModule.name || ''}
            onChange={(e) => handleFormChange('name', e.target.value)}
            className="w-full px-4 py-2 bg-black/90 text-green-400 focus:outline-none focus:border-green-400 border border-green-500/30 rounded"
          />
          <p className="text-xs text-gray-500">This is the only required field. We'll figure out the rest!</p>
        </div>

        {/* Toggle Optional Fields */}
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="text-green-400 text-sm hover:text-green-300 flex items-center gap-2"
        >
          <span>{showOptional ? '▼' : '▶'}</span>
          <span>Show optional fields</span>
        </button>

        {/* Optional Fields */}
        {showOptional && (
          <div className="space-y-4 pl-4 border-l-2 border-green-500/20">
            {/* URL Field */}
            <div className="space-y-2">
              <label className="text-green-400 text-sm">
                URL <span className="text-gray-500">(optional)</span>
              </label>
              <input
                placeholder="https://your-module.com (we'll auto-generate if empty)"
                value={newModule.url || ''}
                onChange={(e) => handleFormChange('url', e.target.value)}
                className="w-full px-4 py-2 bg-black/90 text-green-400 border focus:outline-none focus:border-green-400 border-green-500/30 rounded"
              />
              <p className="text-xs text-gray-500">URL of your server or website</p>
            </div>
            
            {/* Code Repository */}
            <div className="space-y-2">
              <label className="text-green-400 text-sm">
                Code <span className="text-gray-500">(optional)</span>
              </label>
              <input
                placeholder="github.com/username/repo (or IPFS/S3/Arweave link)"
                value={newModule.code || ''}
                onChange={(e) => handleFormChange('code', e.target.value)}
                className="w-full px-4 py-2 bg-black/90 text-green-400 border focus:outline-none focus:border-green-400 border-green-500/30 rounded"
              />
              <p className="text-xs text-gray-500">Link to your module's source code</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-green-400 text-sm">
                Description <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                placeholder="Describe what your module does..."
                value={newModule.desc || ''}
                onChange={(e) => handleFormChange('desc', e.target.value)}
                className="w-full px-4 py-2 bg-black/90 text-green-400 border focus:outline-none focus:border-green-400 border-green-500/30 rounded h-20 resize-none"
              />
              <p className="text-xs text-gray-500">Brief description of your module's functionality</p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-green-400 text-sm">
                Tags <span className="text-gray-500">(optional)</span>
              </label>
              <input
                placeholder="Add tags (press Enter or comma to add)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                className="w-full px-4 py-2 bg-black/90 text-green-400 border focus:outline-none focus:border-green-400 border-green-500/30 rounded"
              />
              <p className="text-xs text-gray-500">Tags help others discover your module</p>
              
              {/* Tags display */}
              {newModule.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newModule.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-green-900/20 text-green-400 rounded-full text-sm flex items-center"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-green-400 hover:text-green-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-2 bg-red-500/20 border border-red-500 text-red-400 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 bg-black/90 text-green-400 border border-green-500/30 rounded hover:bg-green-900/20"
        >
          [ESC] Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="px-4 py-2 bg-black/90 text-green-400 border border-green-500/30 rounded hover:bg-green-900/20 disabled:opacity-50"
        >
          {loading ? 'Creating...' : '[ENTER] Create'}
        </button>
      </div>
    </div>
  )
}