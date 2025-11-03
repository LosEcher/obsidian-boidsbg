# Boids Background - Obsidian Plugin

A dynamic particle background effect plugin for Obsidian that uses the boids flocking algorithm to create mesmerizing animated particles behind your editor content.

## Features

- **Dynamic Particle Animation**: Smooth, lifelike particle movement using the classic boids flocking algorithm
- **Three Core Behaviors**:
  - **Separation**: Particles avoid crowding their neighbors
  - **Alignment**: Particles align with the average direction of nearby particles
  - **Cohesion**: Particles move toward the average position of nearby particles
- **Customizable Settings**: Adjust particle count, speed, colors, and behavior parameters
- **Performance Optimized**: Efficient rendering that doesn't impact editor performance
- **Non-intrusive**: Particles stay in the background, never interfering with your writing

## What are Boids?

Boids is a computer model of coordinated animal motion such as bird flocks and fish schools. Developed by Craig Reynolds in 1986, the model simulates the flocking behavior of birds through three simple rules applied to each individual "boid" (bird-like object).

## Installation

### From Obsidian Community Plugins (Recommended)
1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Boids Background"
4. Install and enable the plugin

### Manual Installation
1. Download the latest release from the [releases page](https://github.com/LosEcher/obsidian-boidsbg/releases)
2. Extract the files to your vault's plugins folder: `VaultFolder/.obsidian/plugins/obsidian-boidsbg/`
3. Reload Obsidian and enable the plugin in Settings > Community Plugins

## Usage

### Basic Usage
1. **Enable the plugin**: Go to Settings > Community Plugins and enable "Boids Background"
2. **Toggle the effect**: Click the sparkles icon in the ribbon or use the command palette
3. **Customize settings**: Go to Settings > Boids Background to adjust parameters

### Commands
- **Toggle Boids Background**: Turn the effect on/off
- **Restart Boids Background**: Restart the animation with current settings

### Settings

#### Basic Settings
- **Enable Boids Background**: Master toggle for the effect
- **Number of Boids**: Control particle count (10-200)
- **Max Speed**: Adjust how fast particles move (0.5-5.0)
- **Opacity**: Control background transparency (0.1-1.0)

#### Display Settings
- **Z-Index**: Layer position with smart recommendations
  - **1-3**: Behind all content (recommended)
  - **4-10**: Safe visibility with minimal UI adjustments
  - **11-50**: Balanced visibility (may affect tab headers)
  - **51+**: High visibility (not recommended for daily use)
- **Render Mode**: Choose between Canvas (recommended) or DOM elements
- **Background Color**: Canvas background (transparent recommended)

#### Flocking Behavior
- **Separation Distance**: How far apart boids try to stay (10-100)
- **Alignment Distance**: Range for direction alignment (20-150)
- **Cohesion Distance**: Range for grouping behavior (20-150)

## Performance

The plugin includes advanced performance optimizations:

### Automatic Optimizations
- **Adaptive Quality**: Automatically adjusts rendering quality based on performance
- **Spatial Partitioning**: Reduces O(n²) complexity for large boid counts (>100)
- **Level of Detail**: Simplified rendering for better performance
- **Frame Rate Control**: Configurable FPS limiting (30-120 FPS)

### Performance Features
- **Real-time Monitoring**: Built-in FPS and frame time display
- **Performance Mode**: Automatic optimization for slower devices
- **Efficient Rendering**: Uses `requestAnimationFrame` and optimized Canvas operations
- **Memory Management**: Reduced object creation and efficient spatial algorithms

### Recommended Settings by Device
- **High-end Desktop**: 100-200 boids, 60 FPS
- **Mid-range Laptop**: 50-100 boids, 45-60 FPS
- **Low-end/Mobile**: 15-40 boids, 30-45 FPS

See `PERFORMANCE.md` for detailed optimization guide.

## Customization

### Theme Integration
The plugin automatically adapts to your Obsidian theme:
- **Dark themes**: Higher opacity for better visibility
- **Light themes**: Lower opacity for subtlety
- **Mobile**: Reduced opacity for better readability

### Advanced Configuration
Modify the boid behavior by adjusting the three core parameters:
- **Separation**: Prevents overcrowding
- **Alignment**: Creates coordinated movement
- **Cohesion**: Maintains group formation

## Troubleshooting

### Performance Issues
- Reduce the number of boids (try 25-30)
- Lower the max speed setting
- Decrease opacity for less visual impact

### Visual Issues
- Check if other plugins conflict with background effects
- Try restarting the animation from settings
- Ensure your device supports HTML5 Canvas

### Plugin Not Working
- Verify the plugin is enabled in Community Plugins
- Check browser console for error messages
- Try disabling other plugins to identify conflicts

## Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/LosEcher/obsidian-boidsbg.git
cd obsidian-boidsbg

# Install dependencies
npm install

# Build for development
npm run dev

# Build for production
npm run build
```

### Project Structure
- `main.ts` - Main plugin class and Obsidian integration
- `boids.ts` - Core boid algorithm and Vector2D math
- `boidSystem.ts` - System management and canvas rendering
- `styles.css` - CSS styling and positioning

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Craig Reynolds for the original boids algorithm
- The Obsidian team for the excellent plugin API
- The community for inspiration and feedback
