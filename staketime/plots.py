#!/usr/bin/env python3
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
p_values = range(0, 9)   # exponents to plot
num_points = 400         # curve resolution
# ---------------------------------------------------------------------------

t = np.linspace(0.0, t_max, num_points)

for p in p_values:
    M = k * (t / t_max) ** p
    plt.plot(t, M, label=f"p = {p}")

plt.title("Multiplier Curves for Different Exponents\n"
          r"$M(t)=k\,(t/t_{\max})^{p}$  with k = %g" % k)
plt.xlabel("Lock Duration t (years)")
plt.ylabel("Multiplier M(t)")
plt.legend(title="Exponent")
plt.grid(True)
plt.tight_layout()
plt.show()
