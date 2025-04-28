
# Multiencrypt

A module that implements multi-signature encryption, requiring multiple parties to encrypt and decrypt data securely.

## Overview

Multiencrypt is a cryptographic module that implements a multi-signature approach for encryption. It requires a minimum number of participants to decrypt data, similar to how multisig works for blockchain transactions. This ensures that no single party has complete control over the encrypted data.

## Features

- Generate keypairs for multiple participants
- Encrypt data requiring multiple signatures for decryption
- Threshold-based decryption (e.g., require at least 2 out of 3 participants)
- Simple NextJS frontend for demonstration

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd multiencrypt

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Usage

### Start the API Server

```bash
python scripts/api_server.py
```

This will start the API server on http://localhost:8000.

### Start the Frontend

```bash
cd frontend
npm run dev
```

This will start the NextJS frontend on http://localhost:3000.

### Run the Demo Script

```bash
python scripts/demo.py
```

This will run a demonstration of the Multiencrypt module's functionality in the terminal.

### Using the Module Programmatically

```python
import commune as c

# Initialize the module
multiencrypt = c.module('multiencrypt')()

# Generate keypairs for participants
alice_key = multiencrypt.generate_keypair("alice")
bob_key = multiencrypt.generate_keypair("bob")
charlie_key = multiencrypt.generate_keypair("charlie")

# Encrypt data requiring at least 2 participants to decrypt
encrypted_data = multiencrypt.encrypt("Secret message", ["alice", "bob", "charlie"])

# Decrypt shares individually
alice_share = multiencrypt.decrypt_share(encrypted_data, "alice")
bob_share = multiencrypt.decrypt_share(encrypted_data, "bob")

# Combine shares to get the original data
original_data = multiencrypt.combine_shares([alice_share, bob_share])
print(original_data)  # "Secret message"
```

## How It Works

1. Each participant generates a keypair (public and private keys)
2. Data is encrypted using the public keys of all participants
3. Each participant can decrypt their share using their private key
4. When enough shares are decrypted (meeting the threshold), the original data can be recovered

## Security Considerations

- Private keys should be securely stored and never shared
- The implementation uses RSA encryption with OAEP padding
- In a production environment, additional security measures should be implemented

## License

MIT
