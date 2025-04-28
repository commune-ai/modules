
import { useState, useEffect } from 'react'
import Head from 'next/head'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = 'http://localhost:8000/api'

export default function Home() {
  const [participants, setParticipants] = useState([])
  const [newParticipantId, setNewParticipantId] = useState('')
  const [message, setMessage] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [encryptedData, setEncryptedData] = useState(null)
  const [decryptedShares, setDecryptedShares] = useState([])
  const [finalMessage, setFinalMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load public keys on mount
    fetchPublicKeys()
  }, [])

  const fetchPublicKeys = async () => {
    try {
      const response = await axios.get(`${API_URL}/export_public_keys`)
      const keys = response.data
      const participantList = Object.keys(keys).map(id => ({
        id,
        publicKey: keys[id].slice(0, 20) + '...'
      }))
      setParticipants(participantList)
    } catch (error) {
      toast.error('Failed to fetch public keys')
      console.error(error)
    }
  }

  const handleCreateParticipant = async () => {
    if (!newParticipantId.trim()) {
      toast.error('Please enter a participant ID')
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API_URL}/generate_keypair`, {
        participant_id: newParticipantId
      })
      toast.success(`Created keypair for ${newParticipantId}`)
      setNewParticipantId('')
      fetchPublicKeys()
    } catch (error) {
      toast.error('Failed to create participant')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEncrypt = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message to encrypt')
      return
    }
    
    if (selectedParticipants.length < 2) {
      toast.error('Please select at least 2 participants')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/encrypt`, {
        data: message,
        participant_ids: selectedParticipants
      })
      setEncryptedData(response.data)
      toast.success('Message encrypted successfully')
    } catch (error) {
      toast.error('Encryption failed')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDecryptShare = async (participantId) => {
    if (!encryptedData) {
      toast.error('No encrypted data available')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/decrypt_share`, {
        encrypted_data: encryptedData,
        participant_id: participantId
      })
      
      // Check if this participant has already decrypted a share
      const existingIndex = decryptedShares.findIndex(
        share => share.participant_id === participantId
      )
      
      if (existingIndex >= 0) {
        // Replace existing share
        const updatedShares = [...decryptedShares]
        updatedShares[existingIndex] = response.data
        setDecryptedShares(updatedShares)
      } else {
        // Add new share
        setDecryptedShares([...decryptedShares, response.data])
      }
      
      toast.success(`${participantId} decrypted their share`)
    } catch (error) {
      toast.error(`Failed to decrypt share for ${participantId}`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCombineShares = async () => {
    if (decryptedShares.length < 2) {
      toast.error('Need at least 2 decrypted shares')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/combine_shares`, {
        decrypted_shares: decryptedShares
      })
      setFinalMessage(response.data)
      toast.success('Successfully decrypted the message')
    } catch (error) {
      toast.error('Failed to combine shares')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const toggleParticipantSelection = (id) => {
    if (selectedParticipants.includes(id)) {
      setSelectedParticipants(selectedParticipants.filter(p => p !== id))
    } else {
      setSelectedParticipants([...selectedParticipants, id])
    }
  }

  const resetProcess = () => {
    setEncryptedData(null)
    setDecryptedShares([])
    setFinalMessage('')
    setSelectedParticipants([])
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Multiencrypt Demo</title>
        <meta name="description" content="Multi-signature encryption demo" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Multiencrypt Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Participant Management */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Participants</h2>
            
            <div className="flex mb-4">
              <input
                type="text"
                className="input flex-grow mr-2"
                placeholder="Participant ID"
                value={newParticipantId}
                onChange={(e) => setNewParticipantId(e.target.value)}
              />
              <button 
                className="btn"
                onClick={handleCreateParticipant}
                disabled={loading}
              >
                Create
              </button>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Available Participants:</h3>
              {participants.length === 0 ? (
                <p className="text-gray-500">No participants yet. Create some first.</p>
              ) : (
                <ul className="space-y-2">
                  {participants.map(participant => (
                    <li key={participant.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`participant-${participant.id}`}
                        checked={selectedParticipants.includes(participant.id)}
                        onChange={() => toggleParticipantSelection(participant.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`participant-${participant.id}`} className="flex-grow">
                        <span className="font-medium">{participant.id}</span>
                        <span className="text-xs text-gray-500 ml-2">({participant.publicKey})</span>
                      </label>
                      {encryptedData && (
                        <button
                          className="btn-secondary text-sm ml-2"
                          onClick={() => handleDecryptShare(participant.id)}
                          disabled={loading}
                        >
                          Decrypt
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Encryption/Decryption */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Encryption & Decryption</h2>
            
            {!encryptedData ? (
              <div>
                <div className="mb-4">
                  <label className="block mb-2">Message to Encrypt:</label>
                  <textarea
                    className="input w-full h-32"
                    placeholder="Enter your secret message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  ></textarea>
                </div>
                
                <button 
                  className="btn w-full"
                  onClick={handleEncrypt}
                  disabled={loading || selectedParticipants.length < 2}
                >
                  Encrypt Message
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Encrypted Data:</h3>
                  <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
                    <pre>{JSON.stringify(encryptedData, null, 2)}</pre>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Decrypted Shares ({decryptedShares.length}):</h3>
                  {decryptedShares.length === 0 ? (
                    <p className="text-gray-500">No shares decrypted yet. Use the "Decrypt" buttons next to participants.</p>
                  ) : (
                    <ul className="space-y-2">
                      {decryptedShares.map((share, index) => (
                        <li key={index} className="bg-green-50 p-2 rounded border border-green-200">
                          <span className="font-medium">{share.participant_id}</span> has decrypted their share
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    className="btn flex-grow"
                    onClick={handleCombineShares}
                    disabled={loading || decryptedShares.length < 2}
                  >
                    Combine Shares
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={resetProcess}
                    disabled={loading}
                  >
                    Reset
                  </button>
                </div>
                
                {finalMessage && (
                  <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
                    <h3 className="font-medium mb-2">Decrypted Message:</h3>
                    <p className="text-green-800">{finalMessage}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
