
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { v4 as uuidv4 } from 'uuid'
import ChatMessage from '@/components/ChatMessage'
import ModelSelector from '@/components/ModelSelector'
import Sidebar from '@/components/Sidebar'
import { fetchModels, sendMessage } from '@/utils/api'

interface ChatHistory {
  id: string;
  title: string;
  messages: any[];
}

export default function Home() {
  const [input, setInput] = useState('')
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileAttachment, setFileAttachment] = useState<File | null>(null)

  // Get current chat messages
  const currentChat = chatHistory.find(chat => chat.id === currentChatId)
  const messages = currentChat?.messages || []

  useEffect(() => {
    const loadModels = async () => {
      try {
        const availableModels = await fetchModels()
        setModels(availableModels)
        if (availableModels.length > 0) {
          setSelectedModel(availableModels[0])
        }
      } catch (error) {
        console.error('Failed to load models:', error)
      }
    }
    
    loadModels()
    
    // Load chat history from localStorage
    const savedHistory = localStorage.getItem('chatHistory')
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory)
      setChatHistory(parsedHistory)
      
      // Set current chat to the most recent one if it exists
      if (parsedHistory.length > 0) {
        setCurrentChatId(parsedHistory[0].id)
      }
    }
  }, [])

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory))
    }
  }, [chatHistory])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const createNewChat = () => {
    const newChatId = uuidv4()
    setChatHistory(prev => [{
      id: newChatId,
      title: 'New Chat',
      messages: []
    }, ...prev])
    setCurrentChatId(newChatId)
  }

  const updateChatTitle = (chatId: string, firstMessage: string) => {
    // Create a title from the first few words of the first message
    const title = firstMessage.split(' ').slice(0, 3).join(' ') + '...'
    
    setChatHistory(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, title } : chat
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && !fileAttachment) return
    
    // Create a new chat if none exists
    if (!currentChatId) {
      createNewChat()
    }
    
    // Create a new message object for the user's message
    const userMessage = {
      role: 'user',
      content: input,
      file: fileAttachment ? URL.createObjectURL(fileAttachment) : null,
      fileName: fileAttachment?.name || null,
    }
    
    // Update the current chat with the new message
    const updatedHistory = chatHistory.map(chat => {
      if (chat.id === currentChatId) {
        const updatedMessages = [...chat.messages, userMessage]
        
        // Update the chat title if this is the first message
        if (chat.messages.length === 0) {
          updateChatTitle(chat.id, input)
        }
        
        return {
          ...chat,
          messages: updatedMessages
        }
      }
      return chat
    })
    
    setChatHistory(updatedHistory)
    setInput('')
    setLoading(true)
    setFileAttachment(null)

    try {
      let messageText = input
      
      // If there's a file attachment, add file content to the message
      if (fileAttachment) {
        const fileContent = await readFileContent(fileAttachment)
        messageText += `\n\nAttached file (${fileAttachment.name}):\n${fileContent}`
      }

      const response = await sendMessage(messageText, selectedModel)
      
      // Add the assistant's response to the current chat
      setChatHistory(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, {
              role: 'assistant',
              content: response
            }]
          }
        }
        return chat
      }))
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add an error message
      setChatHistory(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, {
              role: 'assistant',
              content: 'Sorry, there was an error processing your request.'
            }]
          }
        }
        return chat
      }))
    } finally {
      setLoading(false)
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        resolve(event.target?.result as string || '')
      }
      reader.onerror = (error) => {
        reject(error)
      }
      reader.readAsText(file)
    })
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileAttachment(e.target.files[0])
    }
  }

  const removeAttachment = () => {
    setFileAttachment(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <Head>
        <title>Commune Chat</title>
        <meta name="description" content="AI-powered chat interface" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="flex h-screen bg-chat-darker text-white">
        <Sidebar 
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          chatHistory={chatHistory.map(chat => ({ id: chat.id, title: chat.title }))}
          onChatSelect={setCurrentChatId}
          onNewChat={createNewChat}
          currentChatId={currentChatId}
        />
        
        <main className="flex flex-col flex-1 h-screen overflow-hidden">
          <header className="bg-chat-dark p-4 border-b border-gray-700">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">Commune Chat</h1>
              <ModelSelector 
                models={models} 
                selectedModel={selectedModel} 
                onChange={setSelectedModel} 
              />
            </div>
          </header>
          
          <div className="flex-grow overflow-auto p-4">
            <div className="container mx-auto max-w-4xl">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <h2 className="text-2xl font-bold mb-2">Welcome to Commune Chat</h2>
                    <p>Start a conversation with the AI assistant</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))
              )}
              {loading && (
                <div className="flex items-center space-x-2 py-4">
                  <div className="w-8 h-8 rounded-full bg-chat-accent animate-pulse"></div>
                  <div className="text-gray-400">Thinking...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <footer className="bg-chat-dark p-4 border-t border-gray-700">
            <div className="container mx-auto max-w-4xl">
              <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
                {fileAttachment && (
                  <div className="bg-chat-light rounded-md p-2 flex justify-between items-center">
                    <span className="text-sm truncate">{fileAttachment.name}</span>
                    <button 
                      type="button" 
                      onClick={removeAttachment}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex space-x-2">
                  <button 
                    type="button" 
                    onClick={handleFileSelect}
                    className="bg-chat-light hover:bg-gray-700 rounded-md px-3 py-2"
                  >
                    📎
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow bg-chat-light rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-chat-accent"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || (!input.trim() && !fileAttachment)}
                    className="bg-chat-accent hover:bg-chat-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-4 py-2"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </footer>
        </main>
      </div>
    </>
  )
}
