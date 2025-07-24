import commune as c 
class Timestake:
    """
    A base class that provides fundamental functionality for commune modules.
    """
    def __init__(self, **kwargs):
        """
        Initialize the base class with configurable parameters.
        Args:
            **kwargs: Arbitrary keyword arguments to configure the instance
        """
        # Store configuration as a Munch object for dot notation access
        self.model = c.module('openrouter')()
        
        
    def forward(self, module: str='explain', *args, stream=1,  **kwargs):
        """
        Dynamically call a method of the class.
        Args:
            fn_name (str): Name of the method to call
            *args: Positional arguments to pass to the method
            **kwargs: Keyword arguments to pass to the method
        Returns:
            Result of the called method
        """
        return self.model.forward(f'what does this do? {c.code(module)}', stream=stream)

            
    def plot(self, plot='curves'):
        #!/usr/bin/env python3
        return getattr(self, 'plot_' +plot)()



    def plot_curves(self):
        """
        Plot multiplier curves M(t) = k * (t/t_max)**p
        for p = 0 … 8.

        Requirements:
            pip install matplotlib numpy
        """

        import numpy as np
        import matplotlib.pyplot as plt

        # --- tweakables -------------------------------------------------------------
        k = 4           # terminal multiplier at t = t_max
        t_max = 4.0     # maximum lock duration (years)
        p_values = [0.1,0.5,0.8,1,1.2,1.5,1.8,2,4]
        num_points = 400         # curve resolution
        # ---------------------------------------------------------------------------

        t = np.linspace(0.0, t_max, num_points)

        for p in p_values:
            M = k * (t / t_max) ** p
            plt.plot(t, M, label=f"p = {p}")

        plt.title("Multiplier Curves for Different Exponents\n"
                r"$M(t)=k\,(t/t_{\max})^{p}$  with k = %g and $t_{\max}$ = %g" % (k, t_max))
        plt.xlabel("Lock Duration t (years)")
        plt.ylabel("Multiplier M(t)")
        plt.legend(title="Exponent")
        plt.grid(True)
        plt.tight_layout()
        plt.show()