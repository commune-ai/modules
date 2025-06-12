# Dope Next.js App

A futuristic Next.js application with an interactive terminal, particle effects, and neon aesthetics.

## Features

- 🚀 Built with Next.js 14 and React 18
- 💫 Animated particle background
- 🎨 Neon-themed UI with Tailwind CSS
- 🖥️ Interactive terminal component
- ⚡ Framer Motion animations
- 🔧 Dev module integration ready

## Getting Started

1. Install dependencies:
```bash
cd app
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   ├── globals.css  # Global styles
│   ├── layout.tsx   # Root layout
│   └── page.tsx     # Home page
├── components/       # React components
│   ├── DevTerminal.tsx
│   ├── FeatureCard.tsx
│   └── ParticleBackground.tsx
├── styles/          # Additional styles
├── utils/           # Utility functions
└── package.json     # Dependencies
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## Customization

The app is designed to be easily customizable:

- Modify colors in `tailwind.config.js`
- Add new components in the `components/` directory
- Create new API endpoints in `app/api/`
- Extend the terminal commands in `DevTerminal.tsx`

## Dev Module Integration

This app is designed to work with the dev module. You can extend it by:

1. Adding API endpoints that interface with the dev module
2. Creating UI components that visualize dev module operations
3. Implementing real-time command execution through the terminal

## License

MIT