import sys
import time
import sys
from typing import Any
import commune as c

class Cli:
    def forward(self,  
                fn='module/forward',  
                module='module', 
                base_fn = 'vs'):
        t0 = time.time()
        argv = sys.argv[1:]
        module = c.module(module)()
        params = {'args': [], 'kwargs': {}} 
        if len(argv) == 0:
            fn_obj =  getattr(module, base_fn)
        else:
            fn = argv.pop(0)
            if hasattr(module, fn):
                # if the function is in the base module
                fn_obj =  getattr(module, fn)
            elif '/' in fn:
                module = '/'.join(fn.split('/')[:-1]).replace('/', '.')
                fn = fn.split('/')[-1]
                module = c.module(module)()
                fn_obj = getattr(module, fn)
            else:
                raise Exception(f'Function {fn} not found in module {module}')
            # get the params
            parsing_kwargs = False
            for arg in argv:
                if '=' in arg:
                    parsing_kwargs = True
                    key, value = arg.split('=')
                    params['kwargs'][key] = c.str2python(value)
                else:
                    assert parsing_kwargs is False, 'Cannot mix positional and keyword arguments'
                    params['args'].append(c.str2python(arg))        
        # run thefunction
        result = fn_obj(*params['args'], **params['kwargs']) if callable(fn_obj) else fn_obj
        speed = time.time() - t0
        c.print(f'Call({module.__class__.__name__}/{fn}, speed={speed:.2f}s)')
        duration = time.time() - t0
        is_generator = c.is_generator(result)
        if is_generator:
            for item in result:
                if isinstance(item, dict):
                    c.print(item)
                else:
                    c.print(item, end='')
        else:
            c.print(result)
