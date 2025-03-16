import base64
import hmac
import json
import time
from typing import Dict, Optional
import commune as c

class JWT:
    def __init__(self, key: 'Key' = None, algorithm: str = 'HS256', crypto_type='ecdsa', expiration: int = 3600):
        """
        Initialize a JWT token generator/validator
        
        Args:
            key: Key instance to use for signing
            algorithm: JWT algorithm to use (default: HS256)
            expiration: Token expiration time in seconds (default: 1 hour)
        """
        self.key = self.get_key(key, crypto_type=crypto_type)
        self.algorithm = algorithm
        self.expiration = expiration

    def _base64url_encode(self, data):
        """Encode data in base64url format"""
        if isinstance(data, str):
            data = data.encode('utf-8')
        elif isinstance(data, dict):
            data = json.dumps(data, separators=(',', ':')).encode('utf-8')
        encoded = base64.urlsafe_b64encode(data).rstrip(b'=')
        return encoded.decode('utf-8')
    
    def _base64url_decode(self, data):
        """Decode base64url data"""
        padding = b'=' * (4 - (len(data) % 4))
        return base64.urlsafe_b64decode(data.encode('utf-8') + padding)

    def get_key(self, key, crypto_type='ecdsa'):
        if key == None and hasattr(self, 'key'):
            key =  self.key
        else:
            key =  c.get_key(key, crypto_type=crypto_type) 
        return key
    
    def generate(self, payload: Dict='hey', expiration: Optional[int] = None, key:Optional=None) -> str:
        """
        Generate a JWT token with the given payload
        
        Args:
            payload: Dictionary containing the data to encode in the token
            expiration: Optional custom expiration time in seconds
            
        Returns:
            JWT token string
        """
        if not isinstance(payload, dict):
            payload = {'data': payload }
        key = self.get_key(key)
        exp_time = expiration or self.expiration
        
        # Create a copy of the payload to avoid modifying the original
        token_payload = payload.copy()
        
        # Add standard JWT claims
        token_payload.update({
            'iat': int(time.time()),  # Issued at time
            'exp': int(time.time() + exp_time),  # Expiration time
            'iss': key.key_address,  # Issuer (key address)
        })
        
        # Create JWT header
        header = {
            'alg': self.algorithm,
            'typ': 'JWT'
        }
        
        # Encode header and payload
        header_encoded = self._base64url_encode(header)
        payload_encoded = self._base64url_encode(token_payload)
        
        # Create message to sign
        message = f"{header_encoded}.{payload_encoded}"
        
        # For HS256, we use the private key as the secret
        if self.algorithm.startswith('HS'):
            secret = key.private_key.hex()
            # Create signature using HMAC-SHA256
            signature = hmac.new(
                secret.encode('utf-8'),
                message.encode('utf-8'),
                'sha256'
            ).digest()
            signature_encoded = self._base64url_encode(signature)
        else:
            # For asymmetric algorithms, use the key's sign method
            signature = key.sign(message)
            signature_encoded = self._base64url_encode(signature)
            
        # Combine to create the token
        return f"{message}.{signature_encoded}"
            
    def verify(self, token: str, key_address=None, key=None) -> Dict:
        """
        Verify and decode a JWT token
        
        Args:
            token: JWT token string to verify
            
        Returns:
            Decoded payload if valid
            
        Raises:
            Exception: If token is invalid
        """
        key = self.get_key(key)
        # Split the token into parts
        try:
            header_encoded, payload_encoded, signature_encoded = token.split('.')
        except ValueError:
            raise Exception("Invalid token format")
        
        # Decode the payload
        try:
            payload = json.loads(self._base64url_decode(payload_encoded))
        except Exception:
            raise Exception("Invalid payload encoding")
            
        # Check if token is expired
        if 'exp' in payload and payload['exp'] < time.time():
            raise Exception("Token has expired")
            
        # Verify signature
        message = f"{header_encoded}.{payload_encoded}"
        
        # For HS256, we use the private key as the secret
        if self.algorithm.startswith('HS'):
            secret = key.private_key.hex()
            # Create expected signature
            expected_signature = hmac.new(
                secret.encode('utf-8'),
                message.encode('utf-8'),
                'sha256'
            ).digest()
            expected_signature_encoded = self._base64url_encode(expected_signature)
            
            if signature_encoded != expected_signature_encoded:
                raise Exception("Invalid token signature")
        else:
            # For asymmetric algorithms
            try:
                signature = self._base64url_decode(signature_encoded)
                if key_address == None:
                    key_address = key.key_address
                assert c.verify(message, signature, key_address), "Invalid token signature"
            except Exception:
                raise Exception("Invalid token signature")
                
        return payload
            
    def refresh(self, token: str, new_expiration: Optional[int] = None) -> str:
        """
        Refresh a token with a new expiration time
        
        Args:
            token: JWT token to refresh
            new_expiration: Optional new expiration time in seconds
            
        Returns:
            New JWT token with updated expiration
        """
        try:
            # Decode the token
            header_encoded, payload_encoded, _ = token.split('.')
            payload = json.loads(self._base64url_decode(payload_encoded))
            
            # Verify the token is valid
            self.verify(token)
            
            # Generate a new token with the same payload but new expiration
            return self.generate(payload, expiration=new_expiration)
        except Exception as e:
            raise Exception(f"Cannot refresh invalid token: {str(e)}")

    def test(self):
        """
        Test the JWT token functionality
        
        Returns:
            Dictionary with test results
        """
        # Test data
        test_payload = {
            "user_id": "user123",
            "role": "admin",
            "custom_data": "some important information"
        }
        
        # Generate a token
        token = self.generate(test_payload)
        
        # Verify the token
        decoded = self.verify(token)
        
        # Check if original data is in the decoded payload
        validation_passed = all(
            test_payload[key] == decoded[key] 
            for key in test_payload
        )
        
        # Test token expiration
        quick_token = self.generate(test_payload, expiration=1)
        time.sleep(2)  # Wait for token to expire
        
        expired_token_caught = False
        try:
            self.verify(quick_token)
        except Exception as e:
            if "expired" in str(e).lower():
                expired_token_caught = True
        
        # Test token refresh
        refresh = self.refresh(token)
        refresh_decoded = self.verify(refresh)
        
        return {
            "success": validation_passed and expired_token_caught,
            "original_token": token,
            "decoded_payload": decoded,
            "expiration_test_passed": expired_token_caught,
            "refresh": refresh,
            "refresh_decoded": refresh_decoded
        }