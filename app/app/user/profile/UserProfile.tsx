'use client'
import { useState, useRef, useEffect } from 'react'
import { User } from '@/app/types/user'
import { Key } from '@/app/user/key/key'
import { CopyButton } from '@/app/components/CopyButton'
import { X, Shield, Key as KeyIcon, FileSignature, CheckCircle, XCircle, LogOut, ShieldCheck, ChevronDown, GripVertical } from 'lucide-react'

interface UserProfileProps {
  user: User
  isOpen: boolean
  onClose: () => void
  keyInstance: Key
  onLogout: () => void
}

function shortenAddress(address: string) {
  if (!address || address.length <= 12) return address
  return `${address.slice(0, 8)}...${address.slice(-4)}`
}
type ProfileFunction = 'wallet_info' | 'sign_message' | 'verify_signature'

export const UserProfile = ({ user, isOpen, onClose, keyInstance, onLogout }: UserProfileProps) => {
  const [selectedFunction, setSelectedFunction] = useState<ProfileFunction>('wallet_info')
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [signResult, setSignResult] = useState<{ signature: string; success: boolean } | null>(null)
  const [verifyMessage, setVerifyMessage] = useState('')
  const [verifySignature, setVerifySignature] = useState('')
  const [verifyPublicKey, setVerifyPublicKey] = useState(keyInstance.public_key)
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [panelWidth, setPanelWidth] = useState(384) // Default width (w-96 = 24rem = 384px)
  const [isDragging, setIsDragging] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)

  const functions: { value: ProfileFunction; label: string; icon: React.ReactNode }[] = [
    { value: 'wallet_info', label: 'WALLET INFO', icon: <KeyIcon size={16} /> },
    { value: 'sign_message', label: 'SIGN MESSAGE', icon: <FileSignature size={16} /> },
    { value: 'verify_signature', label: 'VERIFY SIGNATURE', icon: <ShieldCheck size={16} /> },
  ]

  // Handle drag to resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const newWidth = window.innerWidth - e.clientX
      const minWidth = 320 // Minimum width
      const maxWidth = 800 // Maximum width
      
      setPanelWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
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
    }
  }, [isDragging])

  const handleSign = async () => {
    if (!message || !keyInstance) return
    
    try {
      const sig = await keyInstance.sign(message)
      setSignature(sig)
      setSignResult({ signature: sig, success: true })
      // Auto-fill verify fields for convenience
      setVerifyMessage(message)
      setVerifySignature(sig)
      setVerifyPublicKey(keyInstance.public_key)
    } catch (error) {
      console.error('Failed to sign message:', error)
      setSignResult({ signature: '', success: false })
    }
  }

  const handleVerify = async () => {
    if (!verifyMessage || !verifySignature || !verifyPublicKey) return
    
    try {
      const isValid = await keyInstance.verify(verifyMessage, verifySignature, verifyPublicKey)
      setVerifyResult({
        success: isValid,
        message: isValid ? 'SIGNATURE VALID' : 'SIGNATURE INVALID'
      })
    } catch (error) {
      console.error('Failed to verify signature:', error)
      setVerifyResult({
        success: false,
        message: 'ERROR: ' + (error as Error).message
      })
    }
  }

  const renderFunctionContent = () => {
    switch (selectedFunction) {
      case 'wallet_info':
        return (
          <div className="space-y-4">
            {/* ADDRESS */}
            <div className="border border-green-500 bg-black">
              <div className="border-b border-green-500 px-3 py-2 bg-green-500/10">
                <div className="text-green-400 text-xs font-mono uppercase tracking-wider">ADDRESS</div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-green-400 text-sm font-mono">
                    {shortenAddress(keyInstance.address)}
                  </span>
                  <CopyButton code={keyInstance.address} />
                </div>
              </div>
            </div>
            
            {/* CRYPTO TYPE */}
            <div className="border border-green-500 bg-black">
              <div className="border-b border-green-500 px-3 py-2 bg-green-500/10">
                <div className="text-green-400 text-xs font-mono uppercase tracking-wider">CRYPTO TYPE</div>
              </div>
              <div className="p-3">
                <span className="text-green-400 text-sm font-mono">{keyInstance.crypto_type.toUpperCase()}</span>
              </div>
            </div>
            
            {/* PUBLIC KEY */}
            <div className="border border-green-500 bg-black">
              <div className="border-b border-green-500 px-3 py-2 bg-green-500/10">
                <div className="text-green-400 text-xs font-mono uppercase tracking-wider">PUBLIC KEY</div>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-green-400 text-xs font-mono break-all flex-1">
                    {keyInstance.public_key}
                  </span>
                  <div className="flex-shrink-0">
                    <CopyButton code={keyInstance.public_key} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'sign_message':
        return (
          <div className="space-y-4">
            <div className="border border-green-500 bg-black">
              <div className="border-b border-green-500 px-3 py-2 bg-green-500/10">
                <div className="text-green-400 text-xs font-mono uppercase tracking-wider">MESSAGE TO SIGN</div>
              </div>
              <div className="p-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="ENTER MESSAGE..."
                  className="w-full p-2 bg-black border border-green-500/30 text-green-400 text-sm placeholder-green-600/50 focus:outline-none focus:border-green-400 resize-none h-20 font-mono"
                />
              </div>
            </div>
            
            <button
              onClick={handleSign}
              disabled={!message}
              className="w-full px-4 py-3 bg-black text-green-400 border border-green-500 hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono text-sm tracking-wider"
            >
              [SIGN MESSAGE]
            </button>
            
            {signResult && (
              <div className="border border-green-500 bg-black">
                <div className={`border-b border-green-500 px-3 py-2 ${signResult.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <div className="flex items-center gap-2">
                    {signResult.success ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                    <span className={`text-xs font-mono uppercase tracking-wider ${signResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {signResult.success ? 'SIGNED SUCCESSFULLY' : 'SIGNING FAILED'}
                    </span>
                  </div>
                </div>
                {signResult.success && (
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-green-300 text-xs font-mono break-all flex-1">
                        {signature}
                      </span>
                      <div className="flex-shrink-0">
                        <CopyButton code={signature} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'verify_signature':
        return (
          <div className="space-y-4">
            {/* MESSAGE */}
            <div className="border border-green-500 bg-black">
              <div className="border-b border-green-500 px-3 py-2 bg-green-500/10">
                <div className="text-green-400 text-xs font-mono uppercase tracking-wider">MESSAGE</div>
              </div>
              <div className="p-3">
                <textarea
                  value={verifyMessage}
                  onChange={(e) => setVerifyMessage(e.target.value)}
                  placeholder="ENTER MESSAGE TO VERIFY..."
                  className="w-full p-2 bg-black border border-green-500/30 text-green-400 text-sm placeholder-green-600/50 focus:outline-none focus:border-green-400 resize-none h-16 font-mono"
                />
              </div>
            </div>
            
            {/* SIGNATURE */}
            <div className="border border-green-500 bg-black">
              <div className="border-b border-green-500 px-3 py-2 bg-green-500/10">
                <div className="text-green-400 text-xs font-mono uppercase tracking-wider">SIGNATURE</div>
              </div>
              <div className="p-3">
                <textarea
                  value={verifySignature}
                  onChange={(e) => setVerifySignature(e.target.value)}
                  placeholder="ENTER SIGNATURE..."
                  className="w-full p-2 bg-black border border-green-500/30 text-green-400 text-sm placeholder-green-600/50 focus:outline-none focus:border-green-400 resize-none h-16 font-mono break-all"
                />
              </div>
            </div>
            
            {/* PUBLIC KEY */}
            <div className="border border-green-500 bg-black">
              <div className="border-b border-green-500 px-3 py-2 bg-green-500/10">
                <div className="text-green-400 text-xs font-mono uppercase tracking-wider">PUBLIC KEY</div>
              </div>
              <div className="p-3">
                <input
                  type="text"
                  value={verifyPublicKey}
                  onChange={(e) => setVerifyPublicKey(e.target.value)}
                  placeholder="ENTER PUBLIC KEY..."
                  className="w-full p-2 bg-black border border-green-500/30 text-green-400 text-sm placeholder-green-600/50 focus:outline-none focus:border-green-400 font-mono"
                />
              </div>
            </div>
            
            <button
              onClick={handleVerify}
              disabled={!verifyMessage || !verifySignature || !verifyPublicKey}
              className="w-full px-4 py-3 bg-black text-green-400 border border-green-500 hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono text-sm tracking-wider"
            >
              [VERIFY SIGNATURE]
            </button>
            
            {verifyResult && (
              <div className="border border-green-500 bg-black">
                <div className={`border-b border-green-500 px-3 py-2 ${verifyResult.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <div className="flex items-center gap-2">
                    {verifyResult.success ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                    <span className={`text-xs font-mono uppercase tracking-wider ${verifyResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {verifyResult.message}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Backdrop overlay when panel is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-[60px] right-0 h-[calc(100vh-60px)] bg-black border-l border-green-500 transform transition-transform duration-300 ease-out z-40 shadow-2xl shadow-green-500/20 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: `${panelWidth}px` }}
      >
        {/* Drag Handle */}
        <div
          ref={dragHandleRef}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-green-500/50 transition-colors group"
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical size={16} className="text-green-400" />
          </div>
        </div>
        
        <div className="p-6 font-mono h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b border-green-500 pb-4">
            <div className="flex items-center gap-3 flex-1 mr-2">
              <div className="group relative">
                <Shield size={20} className="text-green-400 flex-shrink-0 cursor-pointer hover:text-green-300 transition-colors" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-green-400 text-sm font-mono truncate uppercase tracking-wider">
                  KEY: {keyInstance.address.slice(0, 6)}...{keyInstance.address.slice(-6)}
                </span>
                <CopyButton code={keyInstance.public_key} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 border border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Function Selector - IBM Terminal Style */}
          <div className="mb-6 relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-black text-green-400 border border-green-500 hover:bg-green-500/10 focus:outline-none font-mono uppercase transition-colors tracking-wider"
            >
              <div className="flex items-center gap-2">
                {functions.find(f => f.value === selectedFunction)?.icon}
                <span className="text-sm">{functions.find(f => f.value === selectedFunction)?.label}</span>
              </div>
              <ChevronDown 
                className={`transform transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                size={16} 
              />
            </button>
            
            {/* Custom Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-0 bg-black border border-green-500 border-t-0 z-10">
                {functions.map((fn) => (
                  <button
                    key={fn.value}
                    onClick={() => {
                      setSelectedFunction(fn.value)
                      setDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-left font-mono uppercase transition-colors tracking-wider text-sm ${
                      selectedFunction === fn.value
                        ? 'bg-green-500 text-black'
                        : 'text-green-400 hover:bg-green-500/20'
                    }`}
                  >
                    {fn.icon}
                    <span>{fn.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Function Content */}
          <div className="flex-1 overflow-y-auto">
            {renderFunctionContent()}
          </div>

          {/* Logout Button */}
          <div className="mt-6 pt-4 border-t border-green-500">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-red-400 border border-red-500 hover:bg-red-500 hover:text-white transition-all uppercase font-mono text-sm font-bold tracking-wider"
              title="Logout from wallet"
            >
              <LogOut size={16} />
              <span>LOGOUT FROM WALLET</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default UserProfile