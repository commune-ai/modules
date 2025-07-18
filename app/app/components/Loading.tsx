import React from 'react'

export function Loading() {
  return (
    <div className="grid h-screen w-screen place-content-center bg-black text-green-500 overflow-hidden relative">
      {/* Matrix rain effect with multiple colors */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="matrix-rain">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="matrix-column"
              style={{
                left: `${i * 1.25}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 12}s`
              }}
            >
              {Array.from({ length: 40 }).map((_, j) => (
                <span
                  key={j}
                  className="matrix-char"
                  style={{ 
                    animationDelay: `${j * 0.1}s`,
                    color: `hsl(${120 + Math.random() * 240}, 100%, ${50 + Math.random() * 30}%)`
                  }}
                >
                  {String.fromCharCode(33 + Math.floor(Math.random() * 94))}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Glitchy cyberpunk container */}
      <div className="relative z-10 text-center">
        {/* Animated ASCII art - glitchy robot/skull hybrid */}
        <div className="ascii-container">
          <pre className="ascii-art font-mono text-xs sm:text-sm select-none">
{`
    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
   ██░▄▄▄██░▄▄▀██░▄▄▀██░▄▄▄░██░▄▄▄██▄░▄██
   ██░▄▄▄██░██░██░▄▄▀██░███░██░▄▄▄████░███
   ██░▀▀▀██░▀▀░██░▀▀░██░▀▀▀░██░▀▀▀██▀░▀██
    ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
         ╔═══════════════════════╗
         ║  ┌─────────────────┐  ║
         ║  │ ◉ ═══════════ ◉ │  ║
         ║  │      ┌───┐      │  ║
         ║  │  ╔═══╧═══╧═══╗  │  ║
         ║  │  ║ ▓▓▓▓▓▓▓▓▓ ║  │  ║
         ║  │  ╚═══════════╝  │  ║
         ║  └─────────────────┘  ║
         ╚═══════════════════════╝`}
          </pre>
          <div className="glitch-overlay">
            <pre className="ascii-art-glitch font-mono text-xs sm:text-sm select-none">
{`
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
   ▓▓░███▓▓░██░▓▓░██░▓▓░███░▓▓░███▓▓█░█▓▓
   ██░▄▄▄██░██░██░▄▄▀██░███░██░▄▄▄████░███
   ▓▓░▀▀▀▓▓░▀▀░▓▓░▀▀░▓▓░▀▀▀░▓▓░▀▀▀▓▓▀░▀▓▓
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
         ╔═══════════════════════╗
         ║  ┌─────────────────┐  ║
         ║  │ ◉ ═══════════ ◉ │  ║
         ║  │      ┌───┐      │  ║
         ║  │  ╔═══╧═══╧═══╗  │  ║
         ║  │  ║ ░░░░░░░░░ ║  │  ║
         ║  │  ╚═══════════╝  │  ║
         ║  └─────────────────┘  ║
         ╚═══════════════════════╝`}
            </pre>
          </div>
        </div>
        
        {/* Cyberpunk loading text with color shifts */}
        <div className="mt-4">
          <div className="relative inline-block">
            <h1 className="text-4xl font-mono font-bold tracking-wider glitch-text">
              <span className="letter" style={{ animationDelay: '0ms' }}>S</span>
              <span className="letter" style={{ animationDelay: '100ms' }}>Y</span>
              <span className="letter" style={{ animationDelay: '200ms' }}>S</span>
              <span className="letter" style={{ animationDelay: '300ms' }}>T</span>
              <span className="letter" style={{ animationDelay: '400ms' }}>E</span>
              <span className="letter" style={{ animationDelay: '500ms' }}>M</span>
              <span className="letter-space"> </span>
              <span className="letter" style={{ animationDelay: '700ms' }}>I</span>
              <span className="letter" style={{ animationDelay: '800ms' }}>N</span>
              <span className="letter" style={{ animationDelay: '900ms' }}>I</span>
              <span className="letter" style={{ animationDelay: '1000ms' }}>T</span>
            </h1>
          </div>
          
          {/* Cyberpunk progress bar */}
          <div className="mt-6 font-mono text-sm">
            <div className="cyber-progress-container">
              <div className="cyber-progress-bar">
                <div className="cyber-progress-fill">
                  <div className="cyber-progress-glow"></div>
                </div>
              </div>
              <div className="progress-text">
                <span className="flicker">████████████</span>
                <span className="progress-percent">69%</span>
                <span className="flicker">████████████</span>
              </div>
            </div>
          </div>
          
          {/* Chaotic terminal messages */}
          <div className="mt-4 text-xs font-mono space-y-1 terminal-messages">
            <div className="message-line" style={{ animationDelay: '0s' }}>
              <span className="prompt">[ROOT@SYSTEM]#</span> <span className="command">BYPASSING FIREWALL PROTOCOLS...</span>
            </div>
            <div className="message-line" style={{ animationDelay: '0.5s' }}>
              <span className="prompt">[KERNEL]></span> <span className="warning">WARNING: REALITY.EXE HAS STOPPED RESPONDING</span>
            </div>
            <div className="message-line" style={{ animationDelay: '1s' }}>
              <span className="prompt">[DAEMON]~</span> <span className="success">INJECTING CHAOS INTO MAINFRAME...</span>
            </div>
            <div className="message-line" style={{ animationDelay: '1.5s' }}>
              <span className="prompt">[GHOST]$</span> <span className="error">ERROR 404: SANITY NOT FOUND</span>
            </div>
            <div className="message-line" style={{ animationDelay: '2s' }}>
              <span className="prompt">[ANON]></span> <span className="info">DECRYPTING QUANTUM ENTANGLEMENTS...</span>
            </div>
          </div>
          
          {/* Spinning chaos symbols */}
          <div className="mt-6 flex justify-center gap-4">
            <div className="chaos-symbol spin-reverse">
              <pre className="font-mono text-xs">
{`  ╱╲
 ╱  ╲
╱    ╲
╲    ╱
 ╲  ╱
  ╲╱`}
              </pre>
            </div>
            <div className="chaos-symbol">
              <pre className="font-mono text-xs">
{`┌─┐
│▓│
└─┘`}
              </pre>
            </div>
            <div className="chaos-symbol spin-reverse">
              <pre className="font-mono text-xs">
{`  ╱╲
 ╱  ╲
╱    ╲
╲    ╱
 ╲  ╱
  ╲╱`}
              </pre>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add required styles */}
      <style jsx>{`
        .matrix-rain {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }
        
        .matrix-column {
          position: absolute;
          top: -100%;
          font-family: monospace;
          font-size: 20px;
          line-height: 20px;
          animation: matrix-fall linear infinite;
        }
        
        .matrix-char {
          display: block;
          text-shadow: 0 0 8px currentColor;
          opacity: 0;
          animation: matrix-fade 2s linear infinite;
          font-weight: bold;
        }
        
        @keyframes matrix-fall {
          to {
            transform: translateY(200vh);
          }
        }
        
        @keyframes matrix-fade {
          0%, 10% { opacity: 1; }
          90%, 100% { opacity: 0; }
        }
        
        .ascii-container {
          position: relative;
          display: inline-block;
        }
        
        .ascii-art {
          color: #00ff00;
          text-shadow: 0 0 10px #00ff00;
          animation: pulse 2s ease-in-out infinite;
        }
        
        .glitch-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        
        .ascii-art-glitch {
          color: #ff00ff;
          opacity: 0;
          animation: glitch 3s infinite;
          text-shadow: 0 0 20px #ff00ff;
        }
        
        @keyframes glitch {
          0%, 90%, 100% { opacity: 0; }
          92% { opacity: 0.8; transform: translateX(-2px); }
          94% { opacity: 0.8; transform: translateX(2px); }
          96% { opacity: 0.8; transform: translateY(-2px); }
          98% { opacity: 0.8; transform: translateY(2px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .glitch-text .letter {
          display: inline-block;
          animation: bounce 0.5s ease-in-out infinite, colorShift 2s infinite;
        }
        
        .letter-space {
          display: inline-block;
          width: 0.5em;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes colorShift {
          0% { color: #00ff00; }
          25% { color: #00ffff; }
          50% { color: #ff00ff; }
          75% { color: #ffff00; }
          100% { color: #00ff00; }
        }
        
        .cyber-progress-container {
          position: relative;
          width: 300px;
          margin: 0 auto;
        }
        
        .cyber-progress-bar {
          height: 20px;
          background: #000;
          border: 2px solid #00ff00;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 20px #00ff00;
        }
        
        .cyber-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ff00, #00ffff, #ff00ff, #ffff00);
          animation: progressMove 3s linear infinite;
          width: 100%;
        }
        
        .cyber-progress-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          animation: glowMove 2s linear infinite;
        }
        
        @keyframes progressMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes glowMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .progress-text {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #000;
          font-weight: bold;
          mix-blend-mode: difference;
        }
        
        .progress-percent {
          margin: 0 5px;
          animation: percentChange 0.5s steps(1) infinite;
        }
        
        @keyframes percentChange {
          0% { content: '69%'; }
          20% { content: '42%'; }
          40% { content: '88%'; }
          60% { content: '13%'; }
          80% { content: '99%'; }
          100% { content: '69%'; }
        }
        
        .flicker {
          animation: flicker 0.1s infinite;
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        .terminal-messages {
          max-width: 500px;
          margin: 0 auto;
          text-align: left;
        }
        
        .message-line {
          opacity: 0;
          animation: typeIn 0.5s forwards;
          white-space: nowrap;
          overflow: hidden;
        }
        
        @keyframes typeIn {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        
        .prompt {
          color: #00ff00;
          text-shadow: 0 0 5px #00ff00;
        }
        
        .command {
          color: #00ffff;
          text-shadow: 0 0 5px #00ffff;
        }
        
        .warning {
          color: #ffff00;
          text-shadow: 0 0 5px #ffff00;
          animation: blink 0.5s infinite;
        }
        
        .error {
          color: #ff0000;
          text-shadow: 0 0 5px #ff0000;
          animation: shake 0.5s infinite;
        }
        
        .success {
          color: #00ff00;
          text-shadow: 0 0 5px #00ff00;
        }
        
        .info {
          color: #ff00ff;
          text-shadow: 0 0 5px #ff00ff;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        
        .chaos-symbol {
          color: #ff00ff;
          text-shadow: 0 0 15px #ff00ff;
          animation: spin 4s linear infinite, colorPulse 2s infinite;
        }
        
        .spin-reverse {
          animation: spin-reverse 4s linear infinite, colorPulse 2s infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes colorPulse {
          0% { color: #ff00ff; text-shadow: 0 0 15px #ff00ff; }
          33% { color: #00ffff; text-shadow: 0 0 15px #00ffff; }
          66% { color: #ffff00; text-shadow: 0 0 15px #ffff00; }
          100% { color: #ff00ff; text-shadow: 0 0 15px #ff00ff; }
        }
      `}</style>
      
      <span className="sr-only">Loading...</span>
    </div>
  )
}