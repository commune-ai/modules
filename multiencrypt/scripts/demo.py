
#!/usr/bin/env python3
"""
Demo script for Multiencrypt module showing basic usage.
"""
import sys
import os
import json

# Add the parent directory to the path so we can import the multiencrypt module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from multiencrypt import Multiencrypt

def main():
    print("Multiencrypt Demo")
    print("=================")
    
    # Initialize the module
    print("\nInitializing Multiencrypt module (min_signatures=2, total_participants=3)...")
    multiencrypt = Multiencrypt(min_signatures=2, total_participants=3)
    
    # Generate keypairs for participants
    print("\nGenerating keypairs for participants...")
    alice_key = multiencrypt.generate_keypair("alice")
    bob_key = multiencrypt.generate_keypair("bob")
    charlie_key = multiencrypt.generate_keypair("charlie")
    
    print(f"  Created keypair for alice")
    print(f"  Created keypair for bob")
    print(f"  Created keypair for charlie")
    
    # Encrypt data
    secret_message = "This is a top secret message that requires multiple participants to decrypt!"
    print(f"\nEncrypting message: '{secret_message}'")
    print("Using participants: alice, bob, charlie")
    
    encrypted_data = multiencrypt.encrypt(secret_message, ["alice", "bob", "charlie"])
    print("Message encrypted successfully!")
    
    # Decrypt shares individually
    print("\nDecrypting individual shares...")
    alice_share = multiencrypt.decrypt_share(encrypted_data, "alice")
    print(f"  Alice has decrypted her share")
    
    bob_share = multiencrypt.decrypt_share(encrypted_data, "bob")
    print(f"  Bob has decrypted his share")
    
    # Try to combine with just 2 shares (should work since min_signatures=2)
    print("\nCombining shares from Alice and Bob...")
    original_data = multiencrypt.combine_shares([alice_share, bob_share])
    print(f"Decrypted message: '{original_data}'")
    
    # Try with a different combination
    print("\nLet's try a different combination - Charlie and Alice...")
    charlie_share = multiencrypt.decrypt_share(encrypted_data, "charlie")
    print(f"  Charlie has decrypted his share")
    
    original_data = multiencrypt.combine_shares([charlie_share, alice_share])
    print(f"Decrypted message: '{original_data}'")
    
    print("\nDemo completed successfully!")

if __name__ == "__main__":
    main()
