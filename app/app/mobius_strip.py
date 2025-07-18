import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import matplotlib.animation as animation
from typing import Tuple, Optional
import os

class MobiusStrip:
    """
    Digital Mobius Strip implementation with interactive visualization
    """
    
    def __init__(self, width: float = 1.0, radius: float = 2.0, twists: int = 1):
        """
        Initialize the Mobius strip
        
        Args:
            width: Width of the strip
            radius: Radius of the central circle
            twists: Number of half-twists (1 for standard Mobius strip)
        """
        self.width = width
        self.radius = radius
        self.twists = twists
        self.u_points = 100
        self.v_points = 30
        
    def generate_surface(self, u_range: Tuple[float, float] = (0, 2*np.pi), 
                        v_range: Tuple[float, float] = (-0.5, 0.5)) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Generate the 3D coordinates of the Mobius strip surface
        """
        u = np.linspace(u_range[0], u_range[1], self.u_points)
        v = np.linspace(v_range[0], v_range[1], self.v_points)
        u, v = np.meshgrid(u, v)
        
        # Parametric equations for Mobius strip
        x = (self.radius + v * self.width * np.cos(self.twists * u / 2)) * np.cos(u)
        y = (self.radius + v * self.width * np.cos(self.twists * u / 2)) * np.sin(u)
        z = v * self.width * np.sin(self.twists * u / 2)
        
        return x, y, z
    
    def visualize(self, save_path: Optional[str] = None, cmap: str = 'viridis', 
                  alpha: float = 0.8, show_grid: bool = True):
        """
        Create a static visualization of the Mobius strip
        """
        fig = plt.figure(figsize=(12, 10))
        ax = fig.add_subplot(111, projection='3d')
        
        x, y, z = self.generate_surface()
        
        # Create color map based on position
        colors = np.sqrt(x**2 + y**2 + z**2)
        
        # Plot surface
        surf = ax.plot_surface(x, y, z, facecolors=plt.cm.get_cmap(cmap)(colors/colors.max()),
                              alpha=alpha, edgecolor='none' if not show_grid else 'k',
                              linewidth=0.1 if show_grid else 0)
        
        # Add some style
        ax.set_xlabel('X', fontsize=12)
        ax.set_ylabel('Y', fontsize=12)
        ax.set_zlabel('Z', fontsize=12)
        ax.set_title(f'Digital Mobius Strip (twists={self.twists})', fontsize=16, pad=20)
        
        # Set viewing angle
        ax.view_init(elev=20, azim=45)
        
        # Remove background
        ax.xaxis.pane.fill = False
        ax.yaxis.pane.fill = False
        ax.zaxis.pane.fill = False
        ax.grid(True, alpha=0.3)
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight', transparent=True)
        else:
            plt.show()
        plt.close()
    
    def create_animation(self, duration: int = 10, fps: int = 30, save_path: Optional[str] = None):
        """
        Create an animated rotating Mobius strip
        """
        fig = plt.figure(figsize=(10, 8))
        ax = fig.add_subplot(111, projection='3d')
        
        x, y, z = self.generate_surface()
        colors = np.sqrt(x**2 + y**2 + z**2)
        
        # Initial plot
        surf = ax.plot_surface(x, y, z, facecolors=plt.cm.plasma(colors/colors.max()),
                              alpha=0.9, edgecolor='none')
        
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.set_title('Rotating Digital Mobius Strip', fontsize=16)
        
        # Animation function
        def animate(frame):
            ax.view_init(elev=20, azim=frame * 360 / (duration * fps))
            return surf,
        
        # Create animation
        anim = animation.FuncAnimation(fig, animate, frames=duration * fps,
                                     interval=1000/fps, blit=False)
        
        if save_path:
            anim.save(save_path, writer='pillow', fps=fps)
        else:
            plt.show()
        plt.close()
    
    def parametric_line(self, t: float, offset: float = 0) -> Tuple[float, float, float]:
        """
        Get a point on the Mobius strip at parameter t with given offset from center
        """
        u = t * 2 * np.pi
        v = offset
        
        x = (self.radius + v * self.width * np.cos(self.twists * u / 2)) * np.cos(u)
        y = (self.radius + v * self.width * np.cos(self.twists * u / 2)) * np.sin(u)
        z = v * self.width * np.sin(self.twists * u / 2)
        
        return x, y, z
    
    def trace_path(self, num_loops: int = 2, save_path: Optional[str] = None):
        """
        Visualize a path traced along the Mobius strip showing its one-sided nature
        """
        fig = plt.figure(figsize=(12, 10))
        ax = fig.add_subplot(111, projection='3d')
        
        # Generate surface
        x, y, z = self.generate_surface()
        
        # Plot semi-transparent surface
        ax.plot_surface(x, y, z, alpha=0.3, color='lightblue', edgecolor='none')
        
        # Generate path
        t = np.linspace(0, num_loops, 1000)
        path_x, path_y, path_z = [], [], []
        
        for ti in t:
            xi, yi, zi = self.parametric_line(ti, offset=0)
            path_x.append(xi)
            path_y.append(yi)
            path_z.append(zi)
        
        # Color gradient for the path
        colors = plt.cm.rainbow(np.linspace(0, 1, len(t)))
        
        # Plot the path with color gradient
        for i in range(len(t)-1):
            ax.plot([path_x[i], path_x[i+1]], 
                   [path_y[i], path_y[i+1]], 
                   [path_z[i], path_z[i+1]], 
                   color=colors[i], linewidth=3)
        
        # Add start and end markers
        ax.scatter([path_x[0]], [path_y[0]], [path_z[0]], 
                  color='green', s=100, label='Start')
        ax.scatter([path_x[-1]], [path_y[-1]], [path_z[-1]], 
                  color='red', s=100, label='End')
        
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.set_title(f'Path on Mobius Strip ({num_loops} loops)', fontsize=16)
        ax.legend()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        else:
            plt.show()
        plt.close()


class MobiusAPI:
    """API wrapper for Mobius strip operations"""
    
    def __init__(self):
        self.strips = {}
        self.results_dir = './results'
        os.makedirs(self.results_dir, exist_ok=True)
    
    def create_strip(self, name: str, width: float = 1.0, radius: float = 2.0, twists: int = 1) -> dict:
        """Create a new Mobius strip instance"""
        self.strips[name] = MobiusStrip(width=width, radius=radius, twists=twists)
        return {
            'success': True,
            'message': f'Mobius strip {name} created',
            'config': {
                'name': name,
                'width': width,
                'radius': radius,
                'twists': twists
            }
        }
    
    def visualize_strip(self, name: str, save: bool = True, cmap: str = 'viridis') -> dict:
        """Visualize a Mobius strip"""
        if name not in self.strips:
            return {'success': False, 'error': f'Strip {name} not found'}
        
        save_path = os.path.join(self.results_dir, f'{name}_visualization.png') if save else None
        self.strips[name].visualize(save_path=save_path, cmap=cmap)
        
        return {
            'success': True,
            'message': f'Visualization saved to {save_path}' if save else 'Visualization displayed'
        }
    
    def animate_strip(self, name: str, duration: int = 5, fps: int = 30) -> dict:
        """Create animation of a rotating Mobius strip"""
        if name not in self.strips:
            return {'success': False, 'error': f'Strip {name} not found'}
        
        save_path = os.path.join(self.results_dir, f'{name}_animation.gif')
        self.strips[name].create_animation(duration=duration, fps=fps, save_path=save_path)
        
        return {
            'success': True,
            'message': f'Animation saved to {save_path}',
            'animation_config': {
                'duration': duration,
                'fps': fps,
                'frames': duration * fps
            }
        }
    
    def trace_path(self, name: str, num_loops: int = 2) -> dict:
        """Trace a path on the Mobius strip"""
        if name not in self.strips:
            return {'success': False, 'error': f'Strip {name} not found'}
        
        save_path = os.path.join(self.results_dir, f'{name}_path_trace.png')
        self.strips[name].trace_path(num_loops=num_loops, save_path=save_path)
        
        return {
            'success': True,
            'message': f'Path trace saved to {save_path}',
            'path_config': {
                'num_loops': num_loops
            }
        }
    
    def get_point(self, name: str, t: float, offset: float = 0) -> dict:
        """Get a specific point on the Mobius strip"""
        if name not in self.strips:
            return {'success': False, 'error': f'Strip {name} not found'}
        
        x, y, z = self.strips[name].parametric_line(t, offset)
        
        return {
            'success': True,
            'point': {
                'x': float(x),
                'y': float(y),
                'z': float(z),
                't': t,
                'offset': offset
            }
        }
    
    def compare_strips(self, names: list, save: bool = True) -> dict:
        """Compare multiple Mobius strips with different parameters"""
        fig = plt.figure(figsize=(15, 5))
        
        valid_strips = [name for name in names if name in self.strips]
        if not valid_strips:
            return {'success': False, 'error': 'No valid strips found'}
        
        for i, name in enumerate(valid_strips[:3]):  # Max 3 for visualization
            ax = fig.add_subplot(1, len(valid_strips), i+1, projection='3d')
            strip = self.strips[name]
            x, y, z = strip.generate_surface()
            
            colors = np.sqrt(x**2 + y**2 + z**2)
            ax.plot_surface(x, y, z, facecolors=plt.cm.coolwarm(colors/colors.max()),
                           alpha=0.8, edgecolor='none')
            
            ax.set_title(f'{name}\n(twists={strip.twists})')
            ax.set_xlabel('X')
            ax.set_ylabel('Y')
            ax.set_zlabel('Z')
        
        plt.suptitle('Mobius Strip Comparison', fontsize=16)
        
        if save:
            save_path = os.path.join(self.results_dir, 'strip_comparison.png')
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.close()
            return {
                'success': True,
                'message': f'Comparison saved to {save_path}',
                'strips_compared': valid_strips
            }
        else:
            plt.show()
            return {
                'success': True,
                'message': 'Comparison displayed',
                'strips_compared': valid_strips
            }


# Example usage and testing
if __name__ == '__main__':
    # Create API instance
    api = MobiusAPI()
    
    # Create different Mobius strips
    print(api.create_strip('standard', width=1.0, radius=2.0, twists=1))
    print(api.create_strip('double_twist', width=1.0, radius=2.0, twists=2))
    print(api.create_strip('wide', width=2.0, radius=2.0, twists=1))
    
    # Visualize standard strip
    print(api.visualize_strip('standard', cmap='plasma'))
    
    # Create animation
    print(api.animate_strip('standard', duration=3))
    
    # Trace path
    print(api.trace_path('standard', num_loops=2))
    
    # Compare different strips
    print(api.compare_strips(['standard', 'double_twist', 'wide']))
    
    # Get a specific point
    print(api.get_point('standard', t=0.5, offset=0))
