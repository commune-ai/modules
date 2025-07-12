'use client'
import { useState } from 'react'
import { User } from '@/app/types/user'
import { Key } from '@/app/key/key'
import { CopyButton } from '@/app/components/CopyButton'
import { X, Shield, Key as KeyIcon, FileSignature, CheckCircle, XCircle, LogOut, ShieldCheck } from 'lucide-react'

interface UserProfileProps {
  user: User
  isOpen: boolean
  onClose: () => void
  keyInstance: Key
  onLogout: () => void
}

export const UserProfile = ({ user, isOpen, onClose, keyInstance, onLogout }: UserProfileProps) => {
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [signResult, setSignResult] = useState<{ signature: string; success: boolean } | null>(null)
  const [verifyMessage, setVerifyMessage] = useState('')
  const [verifySignature, setVerifySignature] = useState('')
  const [verifyPublicKey, setVerifyPublicKey] = useState(keyInstance.public_key)
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null)

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
      // Verify the signature using public key
      const isValid = await keyInstance.verify(verifyMessage, verifySignature, verifyPublicKey)
      setVerifyResult({
        success: isValid,
        message: isValid ? 'Signature is valid!' : 'Invalid signature'
      })
    } catch (error) {
      console.error('Failed to verify signature:', error)
      setVerifyResult({
        success: false,
        message: 'Error verifying signature: ' + (error as Error).message
      })
    }
  }

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-black border-l border-green-500/30 transform transition-transform duration-300 z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-6 font-mono h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-green-400 text-xl flex items-center gap-2">
            <Shield size={24} />
            $ user_profile
          </h2>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Info Section */}
        <div className="mb-6 p-4 bg-black/60 rounded border border-green-500/30">
          <h3 className="text-green-400 mb-3 flex items-center gap-2">
            <KeyIcon size={18} />
            wallet_info
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">address:</span>
              <div className="flex items-center gap-2">
                <span className="text-green-300 text-xs">
                  {user.address.slice(0, 8)}...{user.address.slice(-8)}
                </span>
                <CopyButton code={user.address} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">crypto_type:</span>
              <span className="text-green-300">{user.crypto_type}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-green-500/20">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">public_key:</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-300 text-xs">
                    {keyInstance.public_key.slice(0, 8)}...{keyInstance.public_key.slice(-8)}
                  </span>
                  <CopyButton code={keyInstance.public_key} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Message Section */}
        <div className="mb-6 p-4 bg-black/60 rounded border border-green-500/30">
          <h3 className="text-green-400 mb-3 flex items-center gap-2">
            <FileSignature size={18} />
            sign_message
          </h3>
          <div className="space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="enter message to sign..."
              className="w-full p-2 bg-black/60 border border-green-500/30 rounded text-green-400 text-sm focus:outline-none focus:border-green-400 resize-none h-20 font-mono"
            />
            <button
              onClick={handleSign}
              disabled={!message}
              className="w-full px-4 py-2 bg-black/60 text-green-400 border border-green-500/30 rounded hover:bg-green-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              $ sign
            </button>
            {signResult && (
              <div className="mt-2">
                {signResult.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle size={16} />
                      <span className="text-sm">signed successfully</span>
                    </div>
                    <div className="p-2 bg-black/40 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-xs">signature:</span>
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
                    <span className="text-sm">signing failed</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Verify Signature Section */}
        <div className="mb-6 p-4 bg-black/60 rounded border border-green-500/30">
          <h3 className="text-green-400 mb-3 flex items-center gap-2">
            <ShieldCheck size={18} />
            verify_signature
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs">message:</label>
              <textarea
                value={verifyMessage}
                onChange={(e) => setVerifyMessage(e.target.value)}
                placeholder="enter message to verify..."
                className="w-full mt-1 p-2 bg-black/60 border border-green-500/30 rounded text-green-400 text-sm focus:outline-none focus:border-green-400 resize-none h-16 font-mono"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs">signature:</label>
              <textarea
                value={verifySignature}
                onChange={(e) => setVerifySignature(e.target.value)}
                placeholder="enter signature to verify..."
                className="w-full mt-1 p-2 bg-black/60 border border-green-500/30 rounded text-green-400 text-sm focus:outline-none focus:border-green-400 resize-none h-16 font-mono break-all"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs">public key (defaults to your public key):</label>
              <input
                type="text"
                value={verifyPublicKey}
                onChange={(e) => setVerifyPublicKey(e.target.value)}
                placeholder="enter public key..."
                className="w-full mt-1 p-2 bg-black/60 border border-green-500/30 rounded text-green-400 text-sm focus:outline-none focus:border-green-400 font-mono"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={!verifyMessage || !verifySignature || !verifyPublicKey}
              className="w-full px-4 py-2 bg-black/60 text-green-400 border border-green-500/30 rounded hover:bg-green-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              $ verify
            </button>
            {verifyResult && (
              <div className="mt-2">
                <div className={`flex items-center gap-2 ${verifyResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {verifyResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  <span className="text-sm">{verifyResult.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-auto">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/20 text-red-400 border border-red-500/30 rounded hover:bg-red-900/30 transition-colors"
          >
            <LogOut size={18} />
            <span>$ logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserProfile