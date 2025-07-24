import bittensor

class Wallet:
    """
    A wrapper class for bittensor.wallet providing simplified access to wallet functionality.
    
    This class provides a convenient interface to the bittensor wallet system,
    allowing for easy creation, management, and usage of keys for the bittensor network.
    """
    
    def __init__(self, name=None, hotkey=None, path=None):
        """
        Initialize a wallet instance.
        
        Args:
            name (str, optional): The name of the wallet. Defaults to None.
            hotkey (str, optional): The hotkey to use. Defaults to None.
            path (str, optional): The path to the wallet directory. Defaults to None.
        """
        self.wallet = bittensor.wallet(name=name, hotkey=hotkey, path=path)
    
    def create(self, coldkey_use_password=True, hotkey_use_password=False, overwrite=False):
        """
        Create a new wallet with coldkey and hotkey.
        
        Args:
            coldkey_use_password (bool): Whether to encrypt the coldkey with a password. Defaults to True.
            hotkey_use_password (bool): Whether to encrypt the hotkey with a password. Defaults to False.
            overwrite (bool): Whether to overwrite existing keys. Defaults to False.
            
        Returns:
            self: The wallet instance for method chaining.
        """
        self.wallet.create(coldkey_use_password=coldkey_use_password, 
                          hotkey_use_password=hotkey_use_password,
                          overwrite=overwrite)
        return self
    
    def create_hotkey(self, use_password=False, overwrite=False):
        """
        Create a new hotkey.
        
        Args:
            use_password (bool): Whether to encrypt the hotkey with a password. Defaults to False.
            overwrite (bool): Whether to overwrite an existing hotkey. Defaults to False.
            
        Returns:
            self: The wallet instance for method chaining.
        """
        self.wallet.create_new_hotkey(use_password=use_password, overwrite=overwrite)
        return self
    
    def create_coldkey(self, use_password=True, overwrite=False):
        """
        Create a new coldkey.
        
        Args:
            use_password (bool): Whether to encrypt the coldkey with a password. Defaults to True.
            overwrite (bool): Whether to overwrite an existing coldkey. Defaults to False.
            
        Returns:
            self: The wallet instance for method chaining.
        """
        self.wallet.create_new_coldkey(use_password=use_password, overwrite=overwrite)
        return self
    
    def get_hotkey(self, password=None):
        """
        Get the hotkey keypair.
        
        Args:
            password (str, optional): Password to decrypt the hotkey. Defaults to None.
            
        Returns:
            The hotkey keypair.
        """
        return self.wallet.get_hotkey(password=password)
    
    def get_coldkey(self, password=None):
        """
        Get the coldkey keypair.
        
        Args:
            password (str, optional): Password to decrypt the coldkey. Defaults to None.
            
        Returns:
            The coldkey keypair.
        """
        return self.wallet.get_coldkey(password=password)
    
    def get_coldkeypub(self, password=None):
        """
        Get the coldkeypub keypair.
        
        Args:
            password (str, optional): Password to decrypt the coldkeypub. Defaults to None.
            
        Returns:
            The coldkeypub keypair.
        """
        return self.wallet.get_coldkeypub(password=password)
    
    def create_from_uri(self, uri, is_coldkey=False, use_password=None, overwrite=False):
        """
        Create a key from a URI.
        
        Args:
            uri (str): The URI to create the key from.
            is_coldkey (bool): Whether to create a coldkey (True) or hotkey (False). Defaults to False.
            use_password (bool, optional): Whether to encrypt the key with a password. Defaults to None.
            overwrite (bool): Whether to overwrite an existing key. Defaults to False.
            
        Returns:
            self: The wallet instance for method chaining.
        """
        if is_coldkey:
            if use_password is None:
                use_password = True
            self.wallet.create_coldkey_from_uri(uri=uri, use_password=use_password, overwrite=overwrite)
        else:
            if use_password is None:
                use_password = False
            self.wallet.create_hotkey_from_uri(uri=uri, use_password=use_password, overwrite=overwrite)
        return self
    
    def regenerate_coldkey(self, mnemonic=None, seed=None, json=None, use_password=True, overwrite=False):
        """
        Regenerate a coldkey from a mnemonic, seed, or JSON.
        
        Args:
            mnemonic (str, optional): The mnemonic to regenerate from. Defaults to None.
            seed (bytes, optional): The seed to regenerate from. Defaults to None.
            json (str, optional): The JSON to regenerate from. Defaults to None.
            use_password (bool): Whether to encrypt the coldkey with a password. Defaults to True.
            overwrite (bool): Whether to overwrite an existing coldkey. Defaults to False.
            
        Returns:
            self: The wallet instance for method chaining.
        """
        self.wallet.regenerate_coldkey(mnemonic=mnemonic, seed=seed, json=json, 
                                      use_password=use_password, overwrite=overwrite)
        return self
    
    def regenerate_hotkey(self, mnemonic=None, seed=None, json=None, use_password=False, overwrite=False):
        """
        Regenerate a hotkey from a mnemonic, seed, or JSON.
        
        Args:
            mnemonic (str, optional): The mnemonic to regenerate from. Defaults to None.
            seed (bytes, optional): The seed to regenerate from. Defaults to None.
            json (str, optional): The JSON to regenerate from. Defaults to None.
            use_password (bool): Whether to encrypt the hotkey with a password. Defaults to False.
            overwrite (bool): Whether to overwrite an existing hotkey. Defaults to False.
            
        Returns:
            self: The wallet instance for method chaining.
        """
        self.wallet.regenerate_hotkey(mnemonic=mnemonic, seed=seed, json=json, 
                                     use_password=use_password, overwrite=overwrite)
        return self
    
    @property
    def name(self):
        """
        Get the name of the wallet.
        
        Returns:
            str: The name of the wallet.
        """
        return self.wallet.name
    
    @property
    def path(self):
        """
        Get the path to the wallet directory.
        
        Returns:
            str: The path to the wallet directory.
        """
        return self.wallet.path
    
    @property
    def hotkey_file(self):
        """
        Get the path to the hotkey file.
        
        Returns:
            str: The path to the hotkey file.
        """
        return self.wallet.hotkey_file
    
    @property
    def coldkey_file(self):
        """
        Get the path to the coldkey file.
        
        Returns:
            str: The path to the coldkey file.
        """
        return self.wallet.coldkey_file
    
    @property
    def coldkeypub_file(self):
        """
        Get the path to the coldkeypub file.
        
        Returns:
            str: The path to the coldkeypub file.
        """
        return self.wallet.coldkeypub_file
    
    def __str__(self):
        """
        Get a string representation of the wallet.
        
        Returns:
            str: A string representation of the wallet.
        """
        return str(self.wallet)
    
    def __repr__(self):
        """
        Get a string representation of the wallet for debugging.
        
        Returns:
            str: A string representation of the wallet for debugging.
        """
        return repr(self.wallet)
