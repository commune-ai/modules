# Wallet Module

This module provides a wrapper around the bittensor wallet functionality, offering a simplified interface for managing bittensor wallets.

## Usage

```python
from src.scripts.wallet import Wallet

# Create a new wallet
wallet = Wallet(name="my_wallet")
wallet.create(coldkey_use_password=True, hotkey_use_password=False)

# Access keys
hotkey = wallet.get_hotkey()
coldkey = wallet.get_coldkey(password="your_password")

# Create from mnemonic
wallet.regenerate_hotkey(mnemonic="your mnemonic phrase here")
```

## Features

- Simple wrapper over bittensor wallet functionality
- Fluent interface with method chaining
- Convenient access to wallet properties
- Simplified key management
