'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Code2, Cpu, Zap, Terminal } from 'lucide-react'
import DevTerminal from '../components/DevTerminal'
import FeatureCard from '../components/FeatureCard'
import ParticleBackground from '../components/ParticleBackground'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const features = [
    {
      icon: <Code2 className="w-8 h-8" />,
      title: 'Smart Code Generation',
      description: 'AI-powered code generation that understands your intent',
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: 'Dev Module Integration',
      description: 'Seamlessly integrated with the powerful dev module',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Lightning Fast',
      description: 'Optimized performance with Next.js 14 and React 18',
    },
    {
      icon: <Terminal className="w-8 h-8" />,
      title: 'Interactive Terminal',
      description: 'Built-in terminal for running commands and scripts',
    },
  ]

  if (!mounted) return null

  return (
    <main className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="text-gradient glow">Dope App</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto">
              A futuristic Next.js application powered by the dev module
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-neon-purple/50 transition-all duration-300"
            >
              Get Started
            </motion.button>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-center mb-16 text-gradient"
            >
              Features
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Terminal Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-center mb-16 text-gradient"
            >
              Interactive Terminal
            </motion.h2>
            <DevTerminal />
          </div>
        </section>
      </div>
    </main>
  )
}