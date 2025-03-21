import commune as c
import bittensor as bt
from typing import List, Dict, Any, Optional
from bittensor.utils.balance import Balance

class Bittensor:
    """Interface module for Subtensor network operations and wallet management"""
    
    def __init__(self, network: str = "finney"):
        """Initialize the Subtensor module
        Args:
            network (str): Network to connect to (e.g. finney, test)
        """
        self.network = network
        self.subtensor = bt.subtensor(network=network)
        
    def list_wallets(self) -> List:
        """List all available wallets
        Returns:
            List of wallet names
        """
        return self.subtensor.list_wallets()

    def neurons(self, netuid: int = 2) -> List[Dict]:
        """List all neurons in a subnet
        Args:
            netuid (int): Network UID
        Returns:
            List of neuron information
        """
        return self.subtensor.neurons(netuid=netuid)
    
    def n(self, netuid: int = 1) -> int:
        """Get number of neurons in a subnet
        Args:
            netuid (int): Network UID
        Returns:
            Number of neurons
        """
        return len(self.neurons(netuid=netuid))
    
    def subnet(self, netuid: int = 2, block: Optional = None) -> Dict:
        """Get subnet information
        Args:
            netuid (int): Network UID
            block (Optional): Block number
        Returns:
            Subnet information dictionary
        """
        return self.subtensor.subnet(netuid=netuid, block=block)
    
    def create_wallet(self, name: str, hotkey: Optional = None) -> Dict:
        """Create a new wallet
        Args:
            name (str): Name of the wallet
            hotkey (str): Optional hotkey name
        Returns:
            Wallet information dictionary
        """
        wallet = bt.wallet(name=name, hotkey=hotkey)
        return wallet

    
    def get_wallet(self, name: str, hotkey: Optional = None) -> Dict:
        """Get wallet information
        Args:
            name (str): Name of the wallet
            hotkey (str): Optional hotkey name
        Returns:
            Wallet information dictionary
        """
        wallet = bt.wallet(name=name, hotkey=hotkey)
        return wallet.info()
    
    def bal(self, address: str) -> float:
        """Get balance for an address
        Args:
            address (str): Wallet address
        Returns:
            Balance in TAO
        """
        balance = self.subtensor.get_balance(address)
        return balance.tao
    
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
        wallet = bt.wallet(wallet_name)
        amount_bal = Balance.from_tao(amount)
        return self.subtensor.transfer(
            wallet=wallet,
            dest=dest_address,
            amount=amount_bal
        )
    
    def get_subnets(self) -> List[int]:
        """Get list of all subnets
        Returns:
            List of subnet UIDs
        """
        return self.subtensor.get_subnets()
    
    def metagraph(self, netuid: int = 1) -> Any:
        """Get metagraph for a subnet
        Args:
            netuid (int): Network UID
        Returns:
            Metagraph object
        """
        return self.subtensor.metagraph(netuid)