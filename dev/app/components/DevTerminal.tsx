'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function DevTerminal() {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>(['Welcome to Dev Terminal!', 'Type "help" for available commands.'])
  const terminalRef = useRef<HTMLDivElement>(null)

  const commands = {
    help: 'Available commands: help, clear, echo, date, whoami',
    clear: () => {
      setHistory([])
      return null
    },
    echo: (args: string[]) => args.join(' '),
    date: () => new Date().toLocaleString(),
    whoami: 'dev-module-user',
  }

  const handleCommand = (cmd: string) => {
    const [command, ...args] = cmd.trim().split(' ')
    let output: string | null = `$ ${cmd}`
    
    if (command in commands) {
      const cmdFunc = commands[command as keyof typeof commands]
      if (typeof cmdFunc === 'function') {
        const result = cmdFunc(args)
        if (result !== null) {
          output = `${output}\n${result}`
        }
      } else {
        output = `${output}\n${cmdFunc}`
      }
    } else if (command) {
      output = `${output}\nCommand not found: ${command}`
    }
    
    if (output) {
      setHistory(prev => [...prev, output])
    }
    setInput('')
  }

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-black/80 backdrop-blur-md rounded-lg p-6 neon-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="ml-2 text-gray-400 text-sm">dev-terminal</span>
      </div>
      
      <div
        ref={terminalRef}
        className="h-96 overflow-y-auto font-mono text-sm mb-4 space-y-2"
      >
        {history.map((line, index) => (
          <div key={index} className="text-green-400">
            {line.split('\n').map((subline, subindex) => (
              <div key={subindex}>{subline}</div>
            ))}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-neon-blue">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleCommand(input)
            }
          }}
          className="flex-1 bg-transparent outline-none text-green-400"
          placeholder="Enter command..."
        />
      </div>
    </motion.div>
  )
}