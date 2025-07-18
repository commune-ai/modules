'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Menu, ChevronLeft, ChevronRight } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const Sidebar = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [sidebarWidth, setSidebarWidth] = useState(isCollapsed ? 64 : 320)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const MIN_WIDTH = 64
  const MAX_WIDTH = 480
  const COLLAPSED_WIDTH = 64
  const EXPANDED_WIDTH = 320

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])

  useEffect(() => {
    setSidebarWidth(isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH)
  }, [isCollapsed])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(onClose, 200)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isCollapsed) return
    setIsDragging(true)
    setDragStartX(e.clientX)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isCollapsed) return
      
      const deltaX = e.clientX - dragStartX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, sidebarWidth - deltaX))
      setSidebarWidth(newWidth)
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
  }, [isDragging, dragStartX, sidebarWidth, isCollapsed])

  // Don't render if not open and not animating
  if (!isOpen && !isAnimating) return null

  return (
    <>
      {/* Backdrop - clicking this will close the sidebar */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${
          isAnimating && isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full bg-black border-r border-green-500 z-50 transform transition-transform duration-200 ${
          isAnimating && isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Left Edge Click Area - New addition for closing sidebar */}
        <div
          className="absolute top-0 left-0 w-8 h-full cursor-pointer hover:bg-green-500/10 transition-colors"
          onClick={handleClose}
          title="Click to close sidebar"
        >
          <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
            <ChevronLeft className="text-green-500" size={20} />
          </div>
        </div>
        
        {/* Drag Handle */}
        {!isCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-green-500/50 transition-colors"
            onMouseDown={handleMouseDown}
          />
        )}
        
        <div className="p-4 border-b border-green-500">
          <div className="flex items-center justify-between">
            {!isCollapsed && <h2 className="text-green-500 text-xl font-mono uppercase">MENU</h2>}
            <button
              onClick={handleClose}
              className="text-green-500 hover:text-green-400 transition-colors ml-auto"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-4">
            <li>
              <a href="/" className={`block text-green-500 hover:text-green-400 font-mono uppercase transition-colors ${isCollapsed ? 'text-center' : ''}`}>
                {isCollapsed ? 'H' : 'HOME'}
              </a>
            </li>
            <li>
              <a href="/modules" className={`block text-green-500 hover:text-green-400 font-mono uppercase transition-colors ${isCollapsed ? 'text-center' : ''}`}>
                {isCollapsed ? 'M' : 'MODULES'}
              </a>
            </li>
            <li>
              <a href="/about" className={`block text-green-500 hover:text-green-400 font-mono uppercase transition-colors ${isCollapsed ? 'text-center' : ''}`}>
                {isCollapsed ? 'A' : 'ABOUT'}
              </a>
            </li>
            <li>
              <a href="/contact" className={`block text-green-500 hover:text-green-400 font-mono uppercase transition-colors ${isCollapsed ? 'text-center' : ''}`}>
                {isCollapsed ? 'C' : 'CONTACT'}
              </a>
            </li>
          </ul>
        </nav>
        
        {/* Visual Resize Indicator */}
        {isDragging && !isCollapsed && (
          <div className="absolute top-0 left-0 h-full w-full pointer-events-none">
            <div className="absolute right-0 top-0 h-full w-1 bg-green-500 animate-pulse" />
          </div>
        )}
      </div>
    </>
  )
}

export default Sidebar