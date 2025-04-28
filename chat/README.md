
# Commune Chat Module

A Next.js-based chat interface for interacting with AI language models through the Commune framework.

## Features

- Modern chat interface with Markdown support
- Code syntax highlighting
- File attachment capabilities
- Support for multiple AI models
- Chat history persistence
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v14+)
- Python 3.8+ (for the backend)
- Commune framework (optional, falls back to mock mode)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Install Python dependencies (if using the Commune backend):

```bash
pip install commune-ai  # If you want to use the actual Commune framework
```

### Configuration

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
COMMUNE_BACKEND_URL=http://localhost:8000
```

### Running the Application

1. Start the backend server:

```bash
npm run backend
# or directly with
python scripts/commune_backend.py
```

2. Start the Next.js development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

```bash
npm run build
npm run start
```

## Project Structure

- `components/` - React components
- `pages/` - Next.js pages and API routes
- `utils/` - Utility functions
- `scripts/` - Backend scripts
- `public/` - Static assets

## API Endpoints

- `GET /api/models` - Get available AI models
- `POST /api/chat` - Send a message to the AI
- `POST /api/upload` - Upload a file attachment

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
