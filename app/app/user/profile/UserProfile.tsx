'use client'
import { useState } from 'react'
import { User } from '@/app/types/user'
import { Key } from '@/app/user/key/key'
import { CopyButton } from '@/app/components/CopyButton'
import { X, Shield, Key as KeyIcon, FileSignature, CheckCircle, XCircle, LogOut, ShieldCheck, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react'

interface UserProfileProps {
  user: User
  isOpen: boolean
  onClose: () => void
  keyInstance: Key
  onLogout: () => void
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
  const [isExpanded, setIsExpanded] = useState(false)

  const functions: { value: ProfileFunction; label: string; icon: React.ReactNode }[] = [
    { value: 'wallet_info', label: 'WALLET INFO', icon: <KeyIcon size={16} /> },
    { value: 'sign_message', label: 'SIGN MESSAGE', icon: <FileSignature size={16} /> },
    { value: 'verify_signature', label: 'VERIFY SIGNATURE', icon: <ShieldCheck size={16} /> },
  ]

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
          <div className="space-y-3">
            <div className="border border-green-500/30 p-3">
              <div className="text-green-500/70 text-xs mb-2 uppercase">SR25519 ADDRESS:</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-green-400 text-lg font-mono font-bold">
                  {keyInstance.address}
                </span>
                <CopyButton code={keyInstance.address} />
              </div>
            </div>
            <div className="border border-green-500/30 p-3">
              <div className="text-green-500/70 text-xs mb-2 uppercase">CRYPTO TYPE:</div>
              <span className="text-green-400 text-sm font-mono">{keyInstance.crypto_type.toUpperCase()}</span>
            </div>
            <div className="border border-green-500/30 p-3">
              <div className="text-green-500/70 text-xs mb-2 uppercase">PUBLIC KEY:</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-green-400 text-xs font-mono break-all">
                  {keyInstance.public_key}
                </span>
                <CopyButton code={keyInstance.public_key} />
              </div>
            </div>
          </div>
        )

      case 'sign_message':
        return (
          <div className="space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ENTER MESSAGE TO SIGN..."
              className="w-full p-3 bg-black border border-green-500/30 text-green-400 text-sm placeholder-green-600/50 focus:outline-none focus:border-green-400 resize-none h-24 font-mono"
            />
            <button
              onClick={handleSign}
              disabled={!message}
              className="w-full px-4 py-2 bg-black text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono"
            >
              [SIGN MESSAGE]
            </button>
            {signResult && (
              <div className="mt-3">
                {signResult.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle size={16} />
                      <span className="text-sm uppercase">SIGNED SUCCESSFULLY</span>
                    </div>
                    <div className="p-3 bg-black border border-green-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-500/70 text-xs uppercase">SIGNATURE:</span>
                        <CopyButton code={signature} />
                      </div>
                      <div className="break-all">
                        <span className="text-green-300 text-xs font-mono">
                          {signature}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle size={16} />
                    <span className="text-sm uppercase">SIGNING FAILED</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'verify_signature':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-green-500/70 text-xs block mb-1 uppercase">MESSAGE:</label>
              <textarea
                value={verifyMessage}
                onChange={(e) => setVerifyMessage(e.target.value)}
                placeholder="ENTER MESSAGE TO VERIFY..."
                className="w-full p-2 bg-black border border-green-500/30 text-green-400 text-sm placeholder-green-600/50 focus:outline-none focus:border-green-400 resize-none h-16 font-mono"
              />
            </div>
            <div>
              <label className="text-green-500/70 text-xs block mb-1 uppercase">SIGNATURE:</label>
              <textarea
                value={verifySignature}
                onChange={(e) => setVerifySignature(e.target.value)}
                placeholder="ENTER SIGNATURE TO VERIFY..."
                className="w-full p-2 bg-black border border-green-500/30 text-green-400 text-sm placeholder-green-600/50 focus:outline-none focus:border-green-400 resize-none h-16 font-mono break-all"
              />
            </div>
            <div>
              <label className="text-green-500/70 text-xs block mb-1 uppercase">PUBLIC KEY:</label>
              <input
                type="text"
                value={verifyPublicKey}
                onChange={(e) => setVerifyPublicKey(e.target.value)}
                placeholder="ENTER PUBLIC KEY..."
                className="w-full p-2 bg-black border border-green-500/30 text-green-400 text-sm placeholder-green-600/50 focus:outline-none focus:border-green-400 font-mono"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={!verifyMessage || !verifySignature || !verifyPublicKey}
              className="w-full px-4 py-2 bg-black text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono"
            >
              [VERIFY SIGNATURE]
            </button>
            {verifyResult && (
              <div className="mt-3">
                <div className={`flex items-center gap-2 ${verifyResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {verifyResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  <span className="text-sm uppercase">{verifyResult.message}</span>
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
        className={`fixed top-[60px] right-0 h-[calc(100vh-60px)] ${isExpanded ? 'w-[600px]' : 'w-96'} bg-black border-l border-green-500 transform transition-all duration-300 ease-out z-40 shadow-2xl shadow-green-500/20 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 font-mono h-full flex flex-col">
          {/* Header with Key as Title, Expand Button and Logout Button */}
          <div className="flex items-center justify-between mb-6 border-b border-green-500/30 pb-4">
            <div className="flex items-center gap-2 flex-1 mr-2">
              <Shield size={20} className="text-green-400 flex-shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-green-400 text-sm font-mono truncate">
                  KEY: {keyInstance.public_key.slice(0, 6)}...{keyInstance.public_key.slice(-6)}
                </span>
                <CopyButton code={keyInstance.public_key} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Expand/Collapse Button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-green-400 hover:text-green-300 transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-green-400 hover:text-green-300 transition-colors flex-shrink-0 p-1"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Function Selector - IBM Terminal Style Custom Dropdown */}
          <div className="mb-6 relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-black text-green-400 border border-green-500 hover:border-green-400 focus:outline-none focus:border-green-400 cursor-pointer font-mono uppercase transition-colors"
            >
              <div className="flex items-center gap-2">
                {functions.find(f => f.value === selectedFunction)?.icon}
                <span>{functions.find(f => f.value === selectedFunction)?.label}</span>
              </div>
              <ChevronDown 
                className={`transform transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                size={20} 
              />
            </button>
            
            {/* Custom Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-green-500 border-t-0 z-10">
                {functions.map((fn) => (
                  <button
                    key={fn.value}
                    onClick={() => {
                      setSelectedFunction(fn.value)
                      setDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-left font-mono uppercase transition-colors ${
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
            <div className="p-4 bg-black border border-green-500">
              {renderFunctionContent()}
            </div>
          </div>

          {/* Prominent Logout Button at Bottom */}
          <div className="mt-6 pt-4 border-t border-green-500/30">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all uppercase font-mono text-sm font-bold shadow-lg hover:shadow-red-500/30"
              title="Logout from wallet"
            >
              <LogOut size={18} />
              <span>LOGOUT FROM WALLET</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default UserProfile