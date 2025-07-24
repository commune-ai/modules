#!/usr/bin/env python3

from wallet import Wallet

def main():
    # Create a new wallet
    print("Creating a new wallet...")
    wallet = Wallet(name="example_wallet")
    wallet.create(coldkey_use_password=False, hotkey_use_password=False, overwrite=True)
    
    print(f"Wallet created at: {wallet.path}")
    print(f"Wallet name: {wallet.name}")
    print(f"Hotkey file: {wallet.hotkey_file}")
    print(f"Coldkey file: {wallet.coldkey_file}")
    
    # Get the keys
    hotkey = wallet.get_hotkey()
    coldkey = wallet.get_coldkey()
    
    print(f"Hotkey SS58 address: {hotkey.ss58_address}")
    print(f"Coldkey SS58 address: {coldkey.ss58_address}")
    
    # Create a new hotkey
    print("\nCreating a new hotkey...")
    wallet.create_hotkey(overwrite=True)
    
    # Get the new hotkey
    new_hotkey = wallet.get_hotkey()
    print(f"New hotkey SS58 address: {new_hotkey.ss58_address}")

if __name__ == "__main__":
    main()
