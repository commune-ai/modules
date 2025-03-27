import os
import json
import datetime
import pandas as pd
from typing import List, Optional, Union, Dict, Any
import commune as c
class History:
    def __init__(self, path: Optional = None):
        """
        Initialize the History class to manage server call history
        
        Args:
            server: The server instance this history belongs to
            history_path: Path to store history data
            tempo: Maximum age of history records in seconds
        """
        self.history_path =  path or c.abspath('~/commune/history')
        
    def save_data(self,path:str, data: Dict) -> Dict:
        """Save call data to history"""
        path = f'{self.history_path}/{path}'
        c.put(path, data) # save the call data
        return {'message': f'Saved data to {path}', 'success': True}
    
    def call_paths(self, address: str = '') -> List:
        """Get all call paths for a specific address"""
        path = self.history_path + '/' + address
        user_paths = c.glob(path)
        return sorted(user_paths, key=self.get_path_time)
    
    def get_path_time(self, path: str) -> float:
        """Extract timestamp from path"""
        try:
            x = float(path.split('/')[-1].split('.')[0])
        except Exception:
            x = 0
        return x
    
    def get_path_age(self, path: str) -> float:
        """Calculate age of a path in seconds"""
        return c.time() - self.get_path_time(path)
    
    def path2age(self, address: str = 'module') -> Dict:
        """Map paths to their ages"""
        user_paths = self.call_paths(address)
        user_path2time = {p: self.get_path_age(p) for p in user_paths}
        return user_path2time
    
    def get_history(self, address: str = '', paths: Optional[List] = None, 
                   as_df: bool = True, 
                   features: List = ['time', 'fn', 'cost', 'duration', 'client', 'server']) -> Union[pd.DataFrame, List[Dict]]:
        """
        Get history data for a specific address
        
        Args:
            address: The address to get history for
            paths: Optional list of paths to load from
            as_df: Whether to return as pandas DataFrame
            features: Features to include
            
        Returns:
            DataFrame or list of history records
        """
        paths = paths or self.call_paths(address)
        history = [self.server.c.get_json(p)["data"] for p in paths]
        history = [h for h in history if isinstance(h, dict) and all([f in h for f in features])]
        address2key =c.address2key(max_age=self.tempo)
        print(f'History({address}) --> {len(history)}')
        
        if as_df:
            df =c.df(history)
            if len(df) == 0:
                return df
                
            df['age'] = df['time'].apply(lambda x:c.time() - float(x))
            df['time'] = df['time'].apply(lambda x: datetime.datetime.fromtimestamp(x).strftime('%Y-%m-%d %H:%M:%S') 
                                         if isinstance(x, float) else x)

            def headers2key(x):
                if isinstance(x, dict):
                    k = x.get('key', None)
                    return address2key.get(k, k)
                return x

            df['client'] = df['client'].apply(lambda x: headers2key(x))
            df['server'] = df['server'].apply(lambda x: headers2key(x))
            
            display_features = ['fn', 'cost', 'time', 'duration', 'age', 'client', 'server']
            return df[display_features]
        
        return history
    
    def clear_history(self, address: str = 'module') -> Dict[str, Any]:
        """Clear history for a specific address"""
        paths = self.call_paths(address)
        for p in paths:
           c.rm(p)
        assert len(self.call_paths(address)) == 0, f'Failed to clear paths for {address}'
        return {'message': f'Cleared {len(paths)} paths for {address}'}
    
    def num_calls(self, address: str = 'module') -> int:
        """Count number of calls for an address"""
        return len(self.call_paths(address))
    
    def callers(self, module: str = 'module') -> List:
        """Get all callers for a module"""
        return [p.split('/')[-1] for p in c.ls(self.history_path + '/' + module)]
    
    def caller2calls(self, module: str = 'module') -> Dict[str, int]:
        """Map callers to their call counts"""
        return {u: self.num_calls(module+'/'+u) for u in self.callers(module)}
    
    def clear_module_history(self, module: str = 'module') -> int:
        """Clear history for a specific module"""
        return os.system(f'rm -r {self.history_path}/{module}')
    
    def get_stats(self, address: str = '', as_df: bool = True) -> Union:
        """Get call statistics for an address"""
        history = self.get_history(address, as_df=False)
        if not history:
            return pd.DataFrame() if as_df else {}
            
        stats = {
            'total_calls': len(history),
            'unique_functions': len(set(h['fn'] for h in history)),
            'avg_duration': sum(h['duration'] for h in history) / len(history),
            'total_cost': sum(h.get('cost', 0) for h in history),
            'first_call': min(h['time'] for h in history),
            'last_call': max(h['time'] for h in history)
        }
        
        if as_df:
            return pd.DataFrame()
        return stats
