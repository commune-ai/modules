from fastapi import FastAPI, HTTPException
import uvicorn
import os
import json
from pydantic import BaseModel
from typing import Dict, Optional
import commune as c 
# Pydantic model for module dat
import requests
import requests
from .utils import load_json, save_json, logs

class Api:
    tempo = 600
    port = 8000
    app_name =  __file__.split('/')[-3] + '_app' 
    model='anthropic/claude-3.5-sonnet'
    free = True
    endpoints = [
                'modules', 
                'add_module', 
                'remove', 
                'update', 
                'test', 
                'get_module',
                'info', 
                'functions']

    modules_path = __file__.replace(__file__.split('/')[-1], 'modules')

    def paths(self):
        return self.ls(self.modules_path)

    def modules(self, 
                        tempo=None, 
                        update=False, 
                        lite=False, 
                        page=1, 
                        timeout=30, 
                        page_size=100, 
                        verbose=False):
        modules =  c.get_modules()  
        tempo = tempo or self.tempo
        path = self.resolve_path(f'modules')
        module_infos = c.get(path, [],update=update )
        if len(module_infos) == 0:
            progress = c.tqdm(modules, desc="Loading modules", unit="module")
            module_infos = []
            future2module = {}
            for module in modules:
                info = c.info(module, lite=lite, timeout=timeout)
                if not c.is_error(info):
                    module_infos.append(info)
                    progress.update(1)
        # get the page
        if page is not None:
            start = (page - 1) * page_size
            end = start + page_size
            module_infos = module_infos[start:end]
        return module_infos

    def names(self):
        return [m['name'] for m in self.module_infos()]

    def get_module(self, module:str, **kwargs):
        info =  c.info(module, lite=False, **kwargs)
        prefix = info['name'].split('.')[0]
        return info

    def get_module_path(self, module):
        return f"{self.modules_path}/{module}.json"

    def ls(self, path=modules_path):
        if not os.path.exists(path):
            print('WARNING IN LS --> Path does not exist:', path)
            return []
        path = os.path.abspath(path)
        return c.ls(path)

    def logs(name):
        return c.logs(name)

    def check_module(self, module):
        features = ['name', 'url', 'key']  
        if isinstance(module, str):
            module = self.get_module(module)
        if not isinstance(module, dict):
            return False
        assert all([f in module for f in features]), f"Missing feature in module: {module}"
        return True

    def check_modules(self):
        checks = []
        for m in self.module_infos():
            try:
                self.check_module(m)
                m['check'] = True
            except Exception as e:
                print(e)
                m['check'] = False
            checks += [m]
        return checks

    def save_module(self, module):
        print('SAVING MODULE', module["name"])
        module_path = self.get_module_path(module["name"])
        save_json(module_path, module)
        return {"message": f"Module {module['key']} updated successfully"}

    def clear_modules(self):
        for module_path in self.ls(self.modules_path):
            print('Removing:', module_path)
            os.remove(module_path)
        return {"message": "All modules removed"}
    
    def resolve_path(self, path):
        return os.path.expanduser('~/.hub/api/') + path

    def info(self, module:str, **kwargs):
        return c.info(module,  **kwargs)

    def add_module(self, 
                   name  = "module", 
                   key  = "module_key", 
                   code = None, 
                   url  = "0.0.0.0:8000", 
                   app = None,
                   **kwargs ):
        
        module = { "name": name, "url": url, "key": key, "code": code,  **kwargs }
        self.save_module(module)
        result =  {"message": f"Module {module['name']} added successfully", "module": module}
        print('RESULT',result)
        return result

    def root():
        return {"message": "Module Management API"}


    def remove(self, module: str):
        assert self.module_exists(module), "Module not found"
        os.remove(self.get_module_path(module))
        return {"message": f"Module {module} removed successfully"}

    def module_exists(self, module: str):
        return os.path.exists(self.get_module_path(module))

    def update(self, module: str):
        if not self.module_exists(module):
            raise HTTPException(status_code=404, detail="Module not found")
        module = self.get_module(module)
        
        self.save_module(module)

    def test(self):
        
        # Test module data
        test_module = {
            "name": "test_module",
            "url": "http://test.com",
            "key": "test_key",
            "key_type": "string",
            "description": "Test module description"
        }
        # Add module
        self.add_module(test_module)
        assert self.module_exists(test_module['name']), "Module not added"
        self.remove_module(test_module['name'])
        assert not self.module_exists(test_module['name']), "Module not removed"
        return {"message": "All tests passed"}
    

    def get_key(self, password, **kwargs):
        return c.str2key(password, **kwargs)
