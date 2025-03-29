class Task:
    description = 'Base task for commune'
    features = ['url', 'name', 'score']

    def __init__(self, fn='info', params=None):
        """
        Initialize the task with a function and parameters
        """
        self.fn = fn
        self.params = params or {}

    def forward(self,module, **params):
        result =  getattr(module, self.fn)(**params)
        assert isinstance(result, dict)
        assert 'name' in result
        return 1