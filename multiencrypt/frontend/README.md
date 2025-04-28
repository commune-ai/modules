
# Multiencrypt Frontend

This is the frontend application for the Multiencrypt module. It provides a user-friendly interface to interact with the multi-signature encryption functionality.

## Features

- Create and manage participants
- Encrypt messages requiring multiple signatures
- Decrypt individual shares
- Combine shares to recover the original message

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Start the development server:

```bash
npm run dev
# or
yarn dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
npm run build
# or
yarn build
```

## Usage

1. Make sure the Multiencrypt API server is running (see main README.md)
2. Create participants by entering participant IDs
3. Select participants who will be part of the encryption
4. Enter a message to encrypt
5. Decrypt shares using individual participants
6. Combine the shares to recover the original message

## Technologies Used

- Next.js
- React
- Tailwind CSS
- Axios for API communication
- React-Toastify for notifications

## Configuration

The API URL is configured in the `index.js` file. By default, it points to `http://localhost:8000/api`. If your API server is running on a different address, you'll need to update this value.
