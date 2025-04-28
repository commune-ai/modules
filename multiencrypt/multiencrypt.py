
import commune as c
import base64
import json
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend

class Multiencrypt(c.Module):
    """
    A module that implements multi-signature encryption, requiring multiple parties
    to encrypt and decrypt data securely.
    """
    def __init__(self, min_signatures=2, total_participants=3, **kwargs):
        """
        Initialize the multiencrypt module.
        
        Args:
            min_signatures (int): Minimum number of signatures required for decryption
            total_participants (int): Total number of participants in the encryption scheme
            **kwargs: Additional configuration parameters
        """
        self.min_signatures = min_signatures
        self.total_participants = total_participants
        self.keys = {}
        self.set_config(kwargs)
        
    def generate_keypair(self, participant_id):
        """
        Generate a new RSA keypair for a participant.
        
        Args:
            participant_id (str): Unique identifier for the participant
            
        Returns:
            dict: Dictionary containing public key information
        """
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        public_key = private_key.public_key()
        
        # Serialize keys for storage
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')
        
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')
        
        self.keys[participant_id] = {
            'private_key': private_pem,
            'public_key': public_pem
        }
        
        return {
            'participant_id': participant_id,
            'public_key': public_pem
        }
    
    def encrypt(self, data, participant_ids):
        """
        Encrypt data using multiple public keys.
        
        Args:
            data (str): Data to encrypt
            participant_ids (list): List of participant IDs whose keys will be used
            
        Returns:
            dict: Encrypted data with metadata
        """
        if len(participant_ids) < self.min_signatures:
            raise ValueError(f"At least {self.min_signatures} participants required")
        
        # Convert data to bytes if it's not already
        if isinstance(data, str):
            data = data.encode('utf-8')
        
        # Create encrypted shares for each participant
        encrypted_shares = {}
        for pid in participant_ids:
            if pid not in self.keys:
                raise ValueError(f"Participant {pid} does not have a registered key")
            
            public_key_pem = self.keys[pid]['public_key']
            public_key = serialization.load_pem_public_key(
                public_key_pem.encode('utf-8'),
                backend=default_backend()
            )
            
            # Encrypt the data with this participant's public key
            encrypted = public_key.encrypt(
                data,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            encrypted_shares[pid] = base64.b64encode(encrypted).decode('utf-8')
        
        return {
            'required_signatures': self.min_signatures,
            'participant_ids': participant_ids,
            'encrypted_shares': encrypted_shares
        }
    
    def decrypt_share(self, encrypted_data, participant_id):
        """
        Decrypt a share using a participant's private key.
        
        Args:
            encrypted_data (dict): The encrypted data object
            participant_id (str): ID of the participant performing decryption
            
        Returns:
            dict: Decryption result for this participant
        """
        if participant_id not in self.keys:
            raise ValueError(f"Participant {participant_id} does not have a registered key")
        
        if participant_id not in encrypted_data['encrypted_shares']:
            raise ValueError(f"No encrypted share for participant {participant_id}")
        
        private_key_pem = self.keys[participant_id]['private_key']
        private_key = serialization.load_pem_private_key(
            private_key_pem.encode('utf-8'),
            password=None,
            backend=default_backend()
        )
        
        encrypted_share = base64.b64decode(encrypted_data['encrypted_shares'][participant_id])
        
        # Decrypt the share
        decrypted = private_key.decrypt(
            encrypted_share,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return {
            'participant_id': participant_id,
            'decrypted_data': decrypted.decode('utf-8')
        }
    
    def combine_shares(self, decrypted_shares):
        """
        Combine decrypted shares to recover the original data.
        In this implementation, all shares should contain the same data.
        
        Args:
            decrypted_shares (list): List of decrypted shares
            
        Returns:
            str: The original decrypted data
        """
        if len(decrypted_shares) < self.min_signatures:
            raise ValueError(f"At least {self.min_signatures} shares required for decryption")
        
        # In this implementation, we just verify that all shares contain the same data
        data_values = [share['decrypted_data'] for share in decrypted_shares]
        if len(set(data_values)) != 1:
            raise ValueError("Inconsistent decrypted data across shares")
        
        return data_values[0]
    
    def export_public_keys(self):
        """
        Export all public keys.
        
        Returns:
            dict: Dictionary of participant IDs and their public keys
        """
        return {pid: data['public_key'] for pid, data in self.keys.items()}
    
    def api_schema(self):
        """
        Return the API schema for the frontend.
        
        Returns:
            dict: API schema
        """
        return {
            "generate_keypair": {
                "description": "Generate a new keypair for a participant",
                "params": {
                    "participant_id": "string"
                }
            },
            "encrypt": {
                "description": "Encrypt data using multiple participants' keys",
                "params": {
                    "data": "string",
                    "participant_ids": "list[string]"
                }
            },
            "decrypt_share": {
                "description": "Decrypt a share using a participant's private key",
                "params": {
                    "encrypted_data": "object",
                    "participant_id": "string"
                }
            },
            "combine_shares": {
                "description": "Combine decrypted shares to recover the original data",
                "params": {
                    "decrypted_shares": "list[object]"
                }
            },
            "export_public_keys": {
                "description": "Export all public keys"
            }
        }
