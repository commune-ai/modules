import commune as c
import bittensor as bt
from typing import List, Dict, Any, Optional
from bittensor.utils.balance import Balance
# import btwallet

class Bt:
    """Interface module for Subtensor network operations and wallet management"""
    
    def __init__(self, network: str = "finney"):
        """Initialize the Subtensor module
        Args:
            network (str): Network to connect to (e.g. finney, test)
        """
        self.network = network
        self.subtensor = bt.subtensor(network=network)

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


    def subnets(self, block: Optional = None) -> List[Dict]:
        """List all subnets
        Args:
            block (Optional): Block number
        Returns:
            List of subnet information dictionaries
        """
        return c.df([s.__dict__ for s in self.subtensor.get_all_subnets_info(block=block)])


    
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
        return dir(wallet)

    
    
    def balance(self, address: str) -> float:
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

    def prices(self, query="{ subnetInfos { nodes { netUid alphaIn alphaOut } } }", variables=None):
        import requests

        GRAPHQL_ENDPOINT = 'https://api.app.trustedstake.ai/graphql'

        headers = {
            'Content-Type': 'application/json',
        }

        payload = {
            'query': query,
            'variables': variables
        }

        response = requests.post(GRAPHQL_ENDPOINT, json=payload, headers=headers)
        response.raise_for_status()  # Raises an HTTPError if the response contains an unsuccessful status code
        print(response.json())
        return response.json()


    def get_schema(self):
        """Get the schema of the GraphQL server
        Returns:
            The GraphQL schema
        """
        import requests

        GRAPHQL_ENDPOINT = 'https://api.app.trustedstake.ai/graphql'
        
        # This is the introspection query to get the full schema
        introspection_query = """
        query IntrospectionQuery {
        __schema {
            queryType {
            name
            }
            mutationType {
            name
            }
            subscriptionType {
            name
            }
            types {
            ...FullType
            }
            directives {
            name
            description
            locations
            args {
                ...InputValue
            }
            }
        }
        }

        fragment FullType on __Type {
        kind
        name
        description
        fields(includeDeprecated: true) {
            name
            description
            args {
            ...InputValue
            }
            type {
            ...TypeRef
            }
            isDeprecated
            deprecationReason
        }
        inputFields {
            ...InputValue
        }
        interfaces {
            ...TypeRef
        }
        enumValues(includeDeprecated: true) {
            name
            description
            isDeprecated
            deprecationReason
        }
        possibleTypes {
            ...TypeRef
        }
        }

        fragment InputValue on __InputValue {
        name
        description
        type {
            ...TypeRef
        }
        defaultValue
        }

        fragment TypeRef on __Type {
        kind
        name
        ofType {
            kind
            name
            ofType {
            kind
            name
            ofType {
                kind
                name
                ofType {
                kind
                name
                ofType {
                    kind
                    name
                    ofType {
                    kind
                    name
                    ofType {
                        kind
                        name
                    }
                    }
                }
                }
            }
            }
        }
        }
        """

        headers = {
            'Content-Type': 'application/json',
        }

        payload = {
            'query': introspection_query
        }

        response = requests.post(GRAPHQL_ENDPOINT, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()




    