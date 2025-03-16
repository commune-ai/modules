import commune as c
import hashlib
import hmac
import os
import random
import base64
from Crypto.Cipher import AES
from Crypto import Random

class DiffieHellman:
    """
    Implementation of Diffie-Hellman key exchange protocol.
    This allows two parties to establish a shared secret over an insecure channel.
    """
    
    def __init__(self, key: 'Key' = None, group_size: int = 2048, crypto_type: str = 'sr25519'):
        """
        Initialize a Diffie-Hellman key exchange instance
        
        Args:
            key: Key instance to use for deriving values (optional)
            group_size: Size of the prime number in bits (default: 2048)
            crypto_type: Cryptography type to use for the key
        """
        self.group_size = group_size
        self.key = self.get_key(key, crypto_type=crypto_type)
        
        # Standard primes for Diffie-Hellman
        # Using MODP group from RFC 3526
        if group_size == 2048:
            # 2048-bit MODP Group
            self.p = int('FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1'
                         '29024E088A67CC74020BBEA63B139B22514A08798E3404DD'
                         'EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245'
                         'E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED'
                         'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D'
                         'C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F'
                         '83655D23DCA3AD961C62F356208552BB9ED529077096966D'
                         '670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B'
                         'E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9'
                         'DE2BCBF6955817183995497CEA956AE515D2261898FA0510'
                         '15728E5A8AACAA68FFFFFFFFFFFFFFFF', 16)
        elif group_size == 4096:
            # 4096-bit MODP Group
            self.p = int('FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1'
                         '29024E088A67CC74020BBEA63B139B22514A08798E3404DD'
                         'EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245'
                         'E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED'
                         'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D'
                         'C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F'
                         '83655D23DCA3AD961C62F356208552BB9ED529077096966D'
                         '670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B'
                         'E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9'
                         'DE2BCBF6955817183995497CEA956AE515D2261898FA0510'
                         '15728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64'
                         'ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7'
                         'ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6B'
                         'F12FFA06D98A0864D87602733EC86A64521F2B18177B200C'
                         'BBE117577A615D6C770988C0BAD946E208E24FA074E5AB31'
                         '43DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF', 16)
        else:
            raise ValueError(f"Unsupported group size: {group_size}. Use 2048 or 4096.")
            
        # Generator
        self.g = 2
        
        # Generate private value from key or randomly
        self.private_value = self._generate_private_value()
        
        # Calculate public value
        self.public_value = self._calculate_public_value()
        
    def get_key(self, key, crypto_type='sr25519'):
        """Get or create a key for use in the exchange"""
        if key is None and hasattr(self, 'key'):
            key = self.key
        else:
            key = c.get_key(key, crypto_type=crypto_type) 
        return key
    
    def _generate_private_value(self):
        """Generate a private value using the key or random generation"""
        if self.key:
            # Derive a private value from the key
            # hash it using SHA-256 and use the first 16 bytes as seed
            seed = int.from_bytes(hashlib.sha256(self.key.private_key).digest()[:16], byteorder='big')
            # Use the key to seed a random generator
            random.seed(seed)
            # Generate a random value between 2 and p-2
            return random.randint(2, self.p - 2)
        else:
            # Generate a cryptographically secure random number
            return int.from_bytes(os.urandom(self.group_size // 8), byteorder='big') % (self.p - 3) + 2
    
    def _calculate_public_value(self):
        """Calculate the public value: g^private_value mod p"""
        return pow(self.g, self.private_value, self.p)
    
    def get_public_value(self):
        """Return the public value to be shared with the other party"""
        return self.public_value
    
    def compute_shared_secret(self, other_public_value):
        """
        Compute the shared secret using the other party's public value
        
        Args:
            other_public_value: The public value received from the other party
            
        Returns:
            The computed shared secret
        """
        # Validate the other party's public value
        if not 2 <= other_public_value <= self.p - 2:
            raise ValueError("Invalid public value received")
            
        # Calculate the shared secret: (other_public_value)^private_value mod p
        shared_secret = pow(other_public_value, self.private_value, self.p)
        
        # Convert to bytes for use as a key
        shared_secret_bytes = shared_secret.to_bytes((shared_secret.bit_length() + 7) // 8, byteorder='big')
        
        # Hash the shared secret to get a fixed-length key
        return hashlib.sha256(shared_secret_bytes).digest()
    
    def derive_key(self, other_public_value, salt=None, info=None, key_length=32):
        """
        Derive a key from the shared secret using HKDF
        
        Args:
            other_public_value: The public value received from the other party
            salt: Optional salt value for HKDF
            info: Optional context and application specific information
            key_length: Length of the derived key in bytes
            
        Returns:
            The derived key
        """
        shared_secret = self.compute_shared_secret(other_public_value)
        
        # Use HKDF to derive a key of the specified length
        if salt is None:
            salt = b'\x00' * 32
            
        if info is None:
            info = b'diffie-hellman-key-exchange'
            
        # HKDF implementation
        # 1. Extract phase
        prk = hmac.new(salt, shared_secret, hashlib.sha256).digest()
        
        # 2. Expand phase
        t = b""
        okm = b""
        for i in range(1, (key_length + 32 - 1) // 32 + 1):
            t = hmac.new(prk, t + info + bytes(), hashlib.sha256).digest()
            okm += t
            
        return okm[:key_length]
    
    def encrypt(self, data, other_public_value, **kwargs):
        """
        Encrypt data using a key derived from the shared secret
        
        Args:
            data: Data to encrypt
            other_public_value: The public value received from the other party
            
        Returns:
            Encrypted data
        """
        if not isinstance(data, str):
            data = str(data)
            
        # Derive a key for encryption
        key = self.derive_key(other_public_value)
        
        # Generate a random IV
        iv = Random.new().read(AES.block_size)
        
        # Pad the data
        data = data + (AES.block_size - len(data) % AES.block_size) * chr(AES.block_size - len(data) % AES.block_size)
        
        # Create cipher and encrypt
        cipher = AES.new(key, AES.MODE_CBC, iv)
        encrypted_bytes = base64.b64encode(iv + cipher.encrypt(data.encode()))
        
        return encrypted_bytes.decode()
    
    def decrypt(self, data, other_public_value, **kwargs):
        """
        Decrypt data using a key derived from the shared secret
        
        Args:
            data: Encrypted data to decrypt
            other_public_value: The public value received from the other party
            
        Returns:
            Decrypted data
        """
        # Derive the same key for decryption
        key = self.derive_key(other_public_value)
        
        # Decode the base64 data
        data = base64.b64decode(data)
        
        # Extract the IV
        iv = data[:AES.block_size]
        
        # Create cipher and decrypt
        cipher = AES.new(key, AES.MODE_CBC, iv)
        decrypted_data = cipher.decrypt(data[AES.block_size:])
        
        # Remove padding
        padding_length = decrypted_data[-1]
        decrypted_data = decrypted_data[:-padding_length]
        
        return decrypted_data.decode('utf-8')
    
    def test(self):
        """
        Test the Diffie-Hellman key exchange functionality
        
        Returns:
            Dictionary with test results
        """
        # Create two instances to simulate two parties
        alice = DiffieHellman('alice')
        bob = DiffieHellman('bob')
        
        # Exchange public values
        alice_public = alice.get_public_value()
        bob_public = bob.get_public_value()
        
        # Compute shared secrets
        alice_secret = alice.compute_shared_secret(bob_public)
        bob_secret = bob.compute_shared_secret(alice_public)
        
        # Check if both parties computed the same secret
        secrets_match = alice_secret == bob_secret
        
        # Test encryption and decryption
        test_message = "This is a secret message for testing"
        encrypted = alice.encrypt(test_message, bob_public)
        decrypted = bob.decrypt(encrypted, alice_public)
        
        encryption_works = test_message == decrypted
        
        return {
            "success": secrets_match and encryption_works,
            "secrets_match": secrets_match,
            "encryption_works": encryption_works,
            "alice_public": alice_public,
            "bob_public": bob_public,
            "test_message": test_message,
            "encrypted": encrypted,
            "decrypted": decrypted
        }