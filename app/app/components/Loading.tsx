import React, { useEffect, useRef } from 'react'

export function Loading() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    // IBM CGA color palette
    const colors = ['#00FF00', '#00FFFF', '#FF00FF', '#FFFF00']
    
    // Fractal parameters
    let zoom = 1
    let offsetX = -0.5
    let offsetY = 0
    let time = 0
    
    const drawMandelbrot = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      const data = imageData.data
      
      // Lower resolution for retro feel
      const pixelSize = 4
      
      for (let py = 0; py < canvas.height; py += pixelSize) {
        for (let px = 0; px < canvas.width; px += pixelSize) {
          const x0 = (px - canvas.width / 2) / (200 * zoom) + offsetX
          const y0 = (py - canvas.height / 2) / (200 * zoom) + offsetY
          
          let x = 0
          let y = 0
          let iteration = 0
          const maxIterations = 50
          
          while (x * x + y * y <= 4 && iteration < maxIterations) {
            const xTemp = x * x - y * y + x0
            y = 2 * x * y + y0
            x = xTemp
            iteration++
          }
          
          // IBM style coloring
          let color = '#000000'
          if (iteration < maxIterations) {
            const colorIndex = Math.floor((iteration + time) % colors.length)
            color = colors[colorIndex]
          }
          
          // Convert hex to RGB
          const r = parseInt(color.slice(1, 3), 16)
          const g = parseInt(color.slice(3, 5), 16)
          const b = parseInt(color.slice(5, 7), 16)
          
          // Fill pixel block
          for (let dy = 0; dy < pixelSize; dy++) {
            for (let dx = 0; dx < pixelSize; dx++) {
              const idx = ((py + dy) * canvas.width + (px + dx)) * 4
              data[idx] = r
              data[idx + 1] = g
              data[idx + 2] = b
              data[idx + 3] = 255
            }
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0)
      
      // Draw IBM style text
      ctx.fillStyle = '#00FF00'
      ctx.font = 'bold 48px VT323, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Background box for text
      const text = 'LOADING SYSTEM'
      const textWidth = ctx.measureText(text).width
      ctx.fillStyle = '#000000'
      ctx.fillRect(canvas.width / 2 - textWidth / 2 - 20, canvas.height / 2 - 40, textWidth + 40, 80)
      
      // Border
      ctx.strokeStyle = '#00FF00'
      ctx.lineWidth = 2
      ctx.strokeRect(canvas.width / 2 - textWidth / 2 - 20, canvas.height / 2 - 40, textWidth + 40, 80)
      
      // Text
      ctx.fillStyle = '#00FF00'
      ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 10)
      
      // Blinking cursor
      if (Math.floor(time * 2) % 2 === 0) {
        ctx.fillText('_', canvas.width / 2 + textWidth / 2 + 10, canvas.height / 2 - 10)
      }
      
      // Progress dots
      const dots = Math.floor(time % 4)
      let dotText = ''
      for (let i = 0; i < dots; i++) {
        dotText += '.'
      }
      ctx.font = '36px VT323, monospace'
      ctx.fillText(dotText, canvas.width / 2, canvas.height / 2 + 20)
      
      // Slowly zoom and pan
      zoom *= 1.002
      offsetX += Math.sin(time * 0.1) * 0.0001
      offsetY += Math.cos(time * 0.1) * 0.0001
      time += 0.05
      
      requestAnimationFrame(drawMandelbrot)
    }
    
    drawMandelbrot()
    
    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0"
        style={{ imageRendering: 'pixelated' }}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}