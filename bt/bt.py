import commune as c
import os
from typing import List, Dict, Any, Optional
import bittensor as bt

class Bittensor:
    """Interface module for Subtensor network operations and wallet management"""
    
    def __init__(self, network: str = "finney"):
        """Initialize the Subtensor module
        Args:
            network (str): Network to connect to (e.g. finney, test)
        """
        self.network = network
        self.subtensor = c.obj('bittensor.core.subtensor.Subtensor')(network=network)
        
    def wallets(self) -> List[str]:
        """List all available wallets
        Returns:
            List of wallet names
        """
        return 

    def neurons(self, netuid=2) -> List[str]:
        """List all available neurons
        Returns:
            List of neuron names
        """
        return self.subtensor.neurons(netuid=netuid)

    def neurons(self, netuid=2) -> List[str]:
        """List all available neurons
        Returns:
            List of neuron names
        """
        return self.subtensor.neurons(netuid=netuid)

    def subnet(self, netuid=2, block=None) -> Dict:
        """Get subnet information
        Args:
            netuid (int): Network UID
        Returns:
            Subnet information dictionary
        """
        return self.subtensor.subnet(netuid=netuid)


    def n(self, netuid=1) -> List[str]:
        """List all available neurons
        Returns:
            List of neuron names
        """
        return len(self.neurons(netuid=netuid))
    def create_wallet(self, name: str, hotkey: str = None) -> Dict:
        """Create a new wallet
        Args:
            name (str): Name of the wallet
            hotkey (str): Optional hotkey name
        Returns:
            Wallet information dictionary
        """
        wallet = self.subtensor.create_wallet(name=name, hotkey=hotkey)
        return wallet.info()
    def get_wallet(self, name: str) -> Dict:
        """Get wallet information
        Args:
            name (str): Name of the wallet
        Returns:
            Wallet information dictionary
        """
        wallet = self.subtensor.get_wallet(name)
        return wallet.info()


    def list_wallets(self) -> List[str]:
        """List all available wallets
        Returns:
            List of wallet names
        """
        return self.subtensor.list_wallets()


    def get_balance(self, address: str) -> float:
        """Get balance for an address
        Args:
            address (str): Wallet address
        Returns:
            Balance in TAO
        """
        return self.subtensor.get_balance(address)
        
    def transfer(self, 
                wallet_name: str,
                dest_address: str,
                amount: float) -> bool:
        """Transfer TAO between wallets
        Args:
            wallet_name (str): Source wallet name
            dest_address (str): Destination address
            amount (float): Amount to transfer
        Returns:
            Success boolean
        """
        wallet = self.subtensor.get_wallet(wallet_name)
        return self.subtensor.transfer(
            wallet=wallet,
            dest=dest_address,
            amount=amount
        )