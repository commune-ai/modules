
import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface ChatMessageProps {
  message: {
    role: string
    content: string
    file?: string | null
    fileName?: string | null
  }
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { role, content, file, fileName } = message
  
  return (
    <div className={`py-5 ${role === 'user' ? 'bg-chat-dark' : 'bg-chat-darker'} rounded-lg mb-4`}>
      <div className="container mx-auto max-w-4xl px-4">
        <div className="flex items-start">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 
            ${role === 'user' ? 'bg-purple-600' : 'bg-chat-accent'}`}>
            {role === 'user' ? '👤' : '🤖'}
          </div>
          <div className="flex-1">
            {file && (
              <div className="mb-2 p-2 bg-chat-light rounded-md">
                <p className="text-sm text-gray-300 mb-1">Attached file: {fileName}</p>
                {file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.gif') ? (
                  <img src={file} alt={fileName || 'Attached image'} className="max-w-full max-h-64 rounded" />
                ) : (
                  <div className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-40">
                    File attached: {fileName}
                  </div>
                )}
              </div>
            )}
            <ReactMarkdown
              className="prose prose-invert max-w-none"
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match
                  
                  return !isInline ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus as any}
                      language={match![1]}
                      PreTag="div"
                      {...props as any}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={`${className} bg-gray-800 px-1 py-0.5 rounded`} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
