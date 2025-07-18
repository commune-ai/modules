'use client'
import { useState, useEffect } from 'react'
import { X, Copy, LogOut, Key as KeyIcon, Shield, Globe, FileSignature, CheckCircle, History, Package } from 'lucide-react'
import { Key } from '@/app/user/key'
import type { User } from '@/app/types/user'

interface UserProfileProps {
  user: User
  isOpen: boolean
  onClose: () => void
  keyInstance: Key
  onLogout: () => void
}

export const UserProfile = ({ user, isOpen, onClose, keyInstance, onLogout }: UserProfileProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'sign' | 'transactions' | 'modules'>('profile')
  const [signMessage, setSignMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [verifyMessage, setVerifyMessage] = useState('')
  const [verifySignature, setVerifySignature] = useState('')
  const [verifyPublicKey, setVerifyPublicKey] = useState('')
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [userModules, setUserModules] = useState<any[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [panelWidth, setPanelWidth] = useState(384) // w-96 = 24rem = 384px
  const MIN_WIDTH = 320
  const MAX_WIDTH = 600

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(onClose, 200)
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSign = async () => {
    if (!signMessage || !keyInstance) return
    try {
      const sig = await keyInstance.sign(signMessage)
      setSignature(sig)
    } catch (error) {
      console.error('Error signing message:', error)
    }
  }

  const handleVerify = async () => {
    if (!verifyMessage || !verifySignature || !verifyPublicKey || !keyInstance) return
    try {
      const result = await keyInstance.verify(verifyMessage, verifySignature, verifyPublicKey)
      setVerifyResult(result)
    } catch (error) {
      console.error('Error verifying signature:', error)
      setVerifyResult(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStartX(e.clientX)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const deltaX = dragStartX - e.clientX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, panelWidth + deltaX))
      setPanelWidth(newWidth)
      setDragStartX(e.clientX)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'auto'
      document.body.style.userSelect = 'auto'
    }
  }, [isDragging, dragStartX, panelWidth])

  if (!isOpen && !isAnimating) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Sidebar - Changed to right side */}
      <div className={`fixed top-24 right-0 h-[calc(100vh-6rem)] bg-black border-l border-green-500 z-50 transform transition-all duration-200 ${
        isAnimating ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: `${panelWidth}px` }}>
        {/* Drag Handle - Left side for right panel */}
        <div
          className="absolute top-0 left-0 w-1 h-full cursor-ew-resize hover:bg-green-500/50 transition-colors"
          onMouseDown={handleMouseDown}
        />
        
        <div className="p-6 border-b border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <code className="text-green-500 text-xs font-mono">
                {user.address.slice(0, 12)}...{user.address.slice(-8)}
              </code>
              <button
                onClick={() => copyToClipboard(user.address, 'header-address')}
                className="text-green-500 hover:text-green-400 transition-colors"
                title="Copy address"
              >
                {copiedField === 'header-address' ? '✓' : <Copy size={16} />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onLogout}
                className="text-green-500 hover:text-green-400 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
              <button
                onClick={handleClose}
                className="text-green-500 hover:text-green-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-green-500/30">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-4 py-2 text-sm font-mono uppercase transition-colors ${
              activeTab === 'profile' ? 'bg-green-500/10 text-green-400 border-b-2 border-green-500' : 'text-green-600 hover:text-green-400'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('sign')}
            className={`flex-1 px-4 py-2 text-sm font-mono uppercase transition-colors ${
              activeTab === 'sign' ? 'bg-green-500/10 text-green-400 border-b-2 border-green-500' : 'text-green-600 hover:text-green-400'
            }`}
          >
            Sign/Verify
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 px-4 py-2 text-sm font-mono uppercase transition-colors ${
              activeTab === 'transactions' ? 'bg-green-500/10 text-green-400 border-b-2 border-green-500' : 'text-green-600 hover:text-green-400'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 px-4 py-2 text-sm font-mono uppercase transition-colors ${
              activeTab === 'modules' ? 'bg-green-500/10 text-green-400 border-b-2 border-green-500' : 'text-green-600 hover:text-green-400'
            }`}
          >
            Modules
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-8rem)]">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
              {/* Full Address Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-500/70 text-sm font-mono uppercase">
                  <Globe size={16} />
                  <span>FULL ADDRESS</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-green-500 font-mono text-sm break-all bg-black/50 p-3 border border-green-500/30 rounded">
                    {user.address}
                  </code>
                  <button
                    onClick={() => copyToClipboard(user.address, 'address')}
                    className="p-2 border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-black transition-colors rounded"
                    title="Copy address"
                  >
                    {copiedField === 'address' ? '✓' : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Crypto Type Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-500/70 text-sm font-mono uppercase">
                  <Shield size={16} />
                  <span>CRYPTO TYPE</span>
                </div>
                <div className="text-green-500 font-mono bg-black/50 p-3 border border-green-500/30 rounded">
                  {user.crypto_type || 'sr25519'}
                </div>
              </div>

              {/* Public Key Section */}
              {keyInstance && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-500/70 text-sm font-mono uppercase">
                    <KeyIcon size={16} />
                    <span>PUBLIC KEY</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-green-500 font-mono text-xs break-all bg-black/50 p-3 border border-green-500/30 rounded">
                      {keyInstance.public_key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(keyInstance.public_key, 'publicKey')}
                      className="p-2 border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-black transition-colors rounded"
                      title="Copy public key"
                    >
                      {copiedField === 'publicKey' ? '✓' : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Sign/Verify Tab */}
          {activeTab === 'sign' && (
            <div className="space-y-6">
              {/* Sign Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-500/70 text-sm font-mono uppercase">
                  <FileSignature size={16} />
                  <span>SIGN MESSAGE</span>
                </div>
                <textarea
                  value={signMessage}
                  onChange={(e) => setSignMessage(e.target.value)}
                  placeholder="Enter message to sign..."
                  className="w-full h-24 bg-black/50 border border-green-500/30 rounded p-3 text-green-400 font-mono text-sm placeholder-green-600/50 focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={handleSign}
                  disabled={!signMessage}
                  className="w-full py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors rounded font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sign Message
                </button>
                {signature && (
                  <div className="space-y-2">
                    <div className="text-green-500/70 text-sm font-mono uppercase">Signature:</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-green-500 font-mono text-xs break-all bg-black/50 p-3 border border-green-500/30 rounded">
                        {signature}
                      </code>
                      <button
                        onClick={() => copyToClipboard(signature, 'signature')}
                        className="p-2 border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-black transition-colors rounded"
                        title="Copy signature"
                      >
                        {copiedField === 'signature' ? '✓' : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Verify Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-500/70 text-sm font-mono uppercase">
                  <CheckCircle size={16} />
                  <span>VERIFY SIGNATURE</span>
                </div>
                <textarea
                  value={verifyMessage}
                  onChange={(e) => setVerifyMessage(e.target.value)}
                  placeholder="Enter message to verify..."
                  className="w-full h-20 bg-black/50 border border-green-500/30 rounded p-3 text-green-400 font-mono text-sm placeholder-green-600/50 focus:outline-none focus:border-green-500"
                />
                <input
                  type="text"
                  value={verifySignature}
                  onChange={(e) => setVerifySignature(e.target.value)}
                  placeholder="Enter signature..."
                  className="w-full bg-black/50 border border-green-500/30 rounded p-3 text-green-400 font-mono text-sm placeholder-green-600/50 focus:outline-none focus:border-green-500"
                />
                <input
                  type="text"
                  value={verifyPublicKey}
                  onChange={(e) => setVerifyPublicKey(e.target.value)}
                  placeholder="Enter public key (leave empty to use your own)..."
                  className="w-full bg-black/50 border border-green-500/30 rounded p-3 text-green-400 font-mono text-sm placeholder-green-600/50 focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={handleVerify}
                  disabled={!verifyMessage || !verifySignature}
                  className="w-full py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors rounded font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify Signature
                </button>
                {verifyResult !== null && (
                  <div className={`text-center p-3 border rounded font-mono ${
                    verifyResult 
                      ? 'border-green-500 bg-green-500/10 text-green-400' 
                      : 'border-red-500 bg-red-500/10 text-red-400'
                  }`}>
                    {verifyResult ? 'SIGNATURE VALID ✓' : 'SIGNATURE INVALID ✗'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500/70 text-sm font-mono uppercase mb-4">
                <History size={16} />
                <span>TRANSACTION HISTORY</span>
              </div>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-green-600/50 font-mono">
                  No transactions found
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx, index) => (
                    <div key={index} className="p-3 border border-green-500/30 rounded bg-black/50">
                      <div className="flex justify-between items-center">
                        <span className="text-green-500 font-mono text-sm">{tx.type}</span>
                        <span className="text-green-600/70 font-mono text-xs">{tx.timestamp}</span>
                      </div>
                      <div className="text-green-600/50 font-mono text-xs mt-1">
                        {tx.hash}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500/70 text-sm font-mono uppercase mb-4">
                <Package size={16} />
                <span>MY MODULES</span>
              </div>
              {userModules.length === 0 ? (
                <div className="text-center py-8 text-green-600/50 font-mono">
                  No modules created yet
                </div>
              ) : (
                <div className="space-y-2">
                  {userModules.map((module, index) => (
                    <div key={index} className="p-3 border border-green-500/30 rounded bg-black/50 hover:border-green-500 transition-colors cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="text-green-500 font-mono text-sm font-bold">{module.name}</span>
                        <span className="text-green-600/70 font-mono text-xs">{module.version}</span>
                      </div>
                      {module.description && (
                        <div className="text-green-600/70 font-mono text-xs mt-1">
                          {module.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Visual Resize Indicator */}
        {isDragging && (
          <div className="absolute top-0 left-0 h-full w-full pointer-events-none">
            <div className="absolute left-0 top-0 h-full w-1 bg-green-500 animate-pulse" />
          </div>
        )}
      </div>
    </>
  )
}