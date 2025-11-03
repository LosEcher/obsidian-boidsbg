import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface BoidsBackgroundSettings {
	enabled: boolean;
	boidCount: number;
	maxSpeed: number;
	maxForce: number;
	separationRadius: number;
	alignmentRadius: number;
	cohesionRadius: number;
	opacity: number;
	particleSize: number;
	trailLength: number;
	transparentBackground: boolean;
	backgroundColor: string;
}

const DEFAULT_SETTINGS: BoidsBackgroundSettings = {
	enabled: true,
	boidCount: 75,
	maxSpeed: 2.0,
	maxForce: 0.03,
	separationRadius: 25,
	alignmentRadius: 50,
	cohesionRadius: 50,
	opacity: 0.8,
	particleSize: 2,
	trailLength: 0.95,
	transparentBackground: true,
	backgroundColor: '#000000'
}

// Boid class for individual particles
class Boid {
	position: { x: number; y: number };
	velocity: { x: number; y: number };
	acceleration: { x: number; y: number };
	maxSpeed: number;
	maxForce: number;

	constructor(x: number, y: number, maxSpeed: number, maxForce: number) {
		this.position = { x, y };
		this.velocity = {
			x: (Math.random() - 0.5) * 2,
			y: (Math.random() - 0.5) * 2
		};
		this.acceleration = { x: 0, y: 0 };
		this.maxSpeed = maxSpeed;
		this.maxForce = maxForce;
	}

	// Apply flocking behaviors
	flock(boids: Boid[], settings: BoidsBackgroundSettings) {
		const sep = this.separate(boids, settings.separationRadius);
		const ali = this.align(boids, settings.alignmentRadius);
		const coh = this.cohesion(boids, settings.cohesionRadius);

		// Weight the forces
		sep.x *= 1.5;
		sep.y *= 1.5;
		ali.x *= 1.0;
		ali.y *= 1.0;
		coh.x *= 1.0;
		coh.y *= 1.0;

		// Apply forces
		this.acceleration.x += sep.x + ali.x + coh.x;
		this.acceleration.y += sep.y + ali.y + coh.y;
	}

	// Separation: steer to avoid crowding local flockmates
	separate(boids: Boid[], desiredSeparation: number) {
		const steer = { x: 0, y: 0 };
		let count = 0;

		for (const other of boids) {
			const d = this.distance(other);
			if (d > 0 && d < desiredSeparation) {
				const diff = {
					x: this.position.x - other.position.x,
					y: this.position.y - other.position.y
				};
				const magnitude = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
				if (magnitude > 0) {
					diff.x /= magnitude;
					diff.y /= magnitude;
					diff.x /= d; // Weight by distance
					diff.y /= d;
					steer.x += diff.x;
					steer.y += diff.y;
					count++;
				}
			}
		}

		if (count > 0) {
			steer.x /= count;
			steer.y /= count;
			const magnitude = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
			if (magnitude > 0) {
				steer.x = (steer.x / magnitude) * this.maxSpeed;
				steer.y = (steer.y / magnitude) * this.maxSpeed;
				steer.x -= this.velocity.x;
				steer.y -= this.velocity.y;
				this.limit(steer, this.maxForce);
			}
		}

		return steer;
	}

	// Alignment: steer towards the average heading of neighbors
	align(boids: Boid[], neighborDist: number) {
		const sum = { x: 0, y: 0 };
		let count = 0;

		for (const other of boids) {
			const d = this.distance(other);
			if (d > 0 && d < neighborDist) {
				sum.x += other.velocity.x;
				sum.y += other.velocity.y;
				count++;
			}
		}

		if (count > 0) {
			sum.x /= count;
			sum.y /= count;
			const magnitude = Math.sqrt(sum.x * sum.x + sum.y * sum.y);
			if (magnitude > 0) {
				sum.x = (sum.x / magnitude) * this.maxSpeed;
				sum.y = (sum.y / magnitude) * this.maxSpeed;
				const steer = {
					x: sum.x - this.velocity.x,
					y: sum.y - this.velocity.y
				};
				this.limit(steer, this.maxForce);
				return steer;
			}
		}

		return { x: 0, y: 0 };
	}

	// Cohesion: steer to move toward the average position of neighbors
	cohesion(boids: Boid[], neighborDist: number) {
		const sum = { x: 0, y: 0 };
		let count = 0;

		for (const other of boids) {
			const d = this.distance(other);
			if (d > 0 && d < neighborDist) {
				sum.x += other.position.x;
				sum.y += other.position.y;
				count++;
			}
		}

		if (count > 0) {
			sum.x /= count;
			sum.y /= count;
			return this.seek(sum);
		}

		return { x: 0, y: 0 };
	}

	// Seek a target
	seek(target: { x: number; y: number }) {
		const desired = {
			x: target.x - this.position.x,
			y: target.y - this.position.y
		};
		const magnitude = Math.sqrt(desired.x * desired.x + desired.y * desired.y);
		if (magnitude > 0) {
			desired.x = (desired.x / magnitude) * this.maxSpeed;
			desired.y = (desired.y / magnitude) * this.maxSpeed;
			const steer = {
				x: desired.x - this.velocity.x,
				y: desired.y - this.velocity.y
			};
			this.limit(steer, this.maxForce);
			return steer;
		}
		return { x: 0, y: 0 };
	}

	// Update position
	update() {
		this.velocity.x += this.acceleration.x;
		this.velocity.y += this.acceleration.y;
		this.limit(this.velocity, this.maxSpeed);
		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;
		this.acceleration.x = 0;
		this.acceleration.y = 0;
	}

	// Wrap around edges
	borders(width: number, height: number) {
		if (this.position.x < -10) this.position.x = width + 10;
		if (this.position.y < -10) this.position.y = height + 10;
		if (this.position.x > width + 10) this.position.x = -10;
		if (this.position.y > height + 10) this.position.y = -10;
	}

	// Utility functions
	distance(other: Boid): number {
		const dx = this.position.x - other.position.x;
		const dy = this.position.y - other.position.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	limit(vector: { x: number; y: number }, max: number) {
		const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
		if (magnitude > max) {
			vector.x = (vector.x / magnitude) * max;
			vector.y = (vector.y / magnitude) * max;
		}
	}
}

export default class BoidsBackgroundPlugin extends Plugin {
	settings: BoidsBackgroundSettings;
	canvas: HTMLCanvasElement | null = null;
	ctx: CanvasRenderingContext2D | null = null;
	animationId: number | null = null;
	statusBarItemEl: HTMLElement | null = null;
	boids: Boid[] = [];

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('sparkles', 'Toggle Boids Background', (evt: MouseEvent) => {
			this.toggleBoids();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('boids-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBarItemEl = this.addStatusBarItem();
		this.updateStatusBar();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'toggle-boids-background',
			name: 'Toggle Boids Background',
			callback: () => {
				this.toggleBoids();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new BoidsSettingTab(this.app, this));

		// Handle window resize
		this.registerDomEvent(window, 'resize', () => {
			this.resizeCanvas();
		});

		// Initialize boids if enabled
		if (this.settings.enabled) {
			this.initializeBoids();
		}
	}

	onunload() {
		this.destroyBoids();
	}

	initializeBoids() {
		try {
			// Create canvas
			this.canvas = document.createElement('canvas');
			this.canvas.id = 'boids-background-canvas';
			this.canvas.style.position = 'fixed';
			this.canvas.style.top = '0';
			this.canvas.style.left = '0';
			this.canvas.style.width = '100vw';
			this.canvas.style.height = '100vh';
			this.canvas.style.pointerEvents = 'none';
			this.canvas.style.zIndex = '1';
			this.canvas.style.opacity = this.settings.opacity.toString();

			// Get context
			this.ctx = this.canvas.getContext('2d');
			if (!this.ctx) {
				throw new Error('Could not get canvas context');
			}

			// Insert canvas into DOM
			const appContainer = document.querySelector('.app-container') || document.body;
			appContainer.insertBefore(this.canvas, appContainer.firstChild);

			// Set canvas size
			this.resizeCanvas();

			// Create boids
			this.createBoids();

			// Start animation
			this.startAnimation();

			this.updateStatusBar();
			new Notice('Boids background enabled');

		} catch (error) {
			console.error('Failed to initialize boids:', error);
			new Notice('Failed to initialize boids background');
		}
	}

	destroyBoids() {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}

		if (this.canvas) {
			this.canvas.remove();
			this.canvas = null;
			this.ctx = null;
		}

		this.updateStatusBar();
	}

	toggleBoids() {
		this.settings.enabled = !this.settings.enabled;
		this.saveSettings();

		if (this.settings.enabled) {
			this.initializeBoids();
		} else {
			this.destroyBoids();
			new Notice('Boids background disabled');
		}
	}

	createBoids() {
		this.boids = [];
		const width = window.innerWidth;
		const height = window.innerHeight;

		for (let i = 0; i < this.settings.boidCount; i++) {
			const x = Math.random() * width;
			const y = Math.random() * height;
			this.boids.push(new Boid(x, y, this.settings.maxSpeed, this.settings.maxForce));
		}
	}

	resizeCanvas() {
		if (this.canvas) {
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
			// Recreate boids for new canvas size
			this.createBoids();
		}
	}

	startAnimation() {
		if (!this.ctx || !this.canvas) return;

		const animate = () => {
			if (!this.ctx || !this.canvas) return;

			// Handle background based on transparency setting
			if (this.settings.transparentBackground) {
				// For transparent background, clear the canvas completely
				this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			} else {
				// For solid background, create trail effect
				const bgColor = this.hexToRgb(this.settings.backgroundColor);
				this.ctx.fillStyle = `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, ${1 - this.settings.trailLength})`;
				this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
			}

			// Update and draw boids
			for (const boid of this.boids) {
				// Apply flocking behavior
				boid.flock(this.boids, this.settings);

				// Update position
				boid.update();

				// Handle screen wrapping
				boid.borders(this.canvas.width, this.canvas.height);

				// Draw boid
				this.drawBoid(boid);
			}

			this.animationId = requestAnimationFrame(animate);
		};

		animate();
	}

	drawBoid(boid: Boid) {
		if (!this.ctx) return;

		const { x, y } = boid.position;
		const { x: vx, y: vy } = boid.velocity;

		// Calculate angle from velocity
		const angle = Math.atan2(vy, vx);

		this.ctx.save();
		this.ctx.translate(x, y);
		this.ctx.rotate(angle);

		// Draw triangle pointing in direction of movement
		const size = this.settings.particleSize;
		this.ctx.fillStyle = `hsla(${(x + y) * 0.1 % 360}, 70%, 60%, 0.8)`;
		this.ctx.beginPath();
		this.ctx.moveTo(size * 2, 0);
		this.ctx.lineTo(-size, -size);
		this.ctx.lineTo(-size, size);
		this.ctx.closePath();
		this.ctx.fill();

		// Optional: draw a small circle for the body
		this.ctx.fillStyle = `hsla(${(x + y) * 0.1 % 360}, 70%, 80%, 0.6)`;
		this.ctx.beginPath();
		this.ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
		this.ctx.fill();

		this.ctx.restore();
	}

	updateStatusBar() {
		if (this.statusBarItemEl) {
			const status = this.settings.enabled ? 'Active' : 'Disabled';
			this.statusBarItemEl.setText(`Boids: ${status}`);
		}
	}

	// Utility function to convert hex color to RGB
	hexToRgb(hex: string): { r: number; g: number; b: number } {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : { r: 0, g: 0, b: 0 };
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class BoidsSettingTab extends PluginSettingTab {
	plugin: BoidsBackgroundPlugin;

	constructor(app: App, plugin: BoidsBackgroundPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Enable Boids Background')
			.setDesc('Enable or disable the boids particle background effect')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enabled)
				.onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();

					if (value) {
						this.plugin.initializeBoids();
					} else {
						this.plugin.destroyBoids();
					}
				}));

		new Setting(containerEl)
			.setName('Number of Boids')
			.setDesc('How many particles to display (10-200)')
			.addSlider(slider => slider
				.setLimits(10, 200, 5)
				.setValue(this.plugin.settings.boidCount)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.boidCount = value;
					await this.plugin.saveSettings();
					// Recreate boids with new count
					if (this.plugin.settings.enabled) {
						this.plugin.createBoids();
					}
				}));

		new Setting(containerEl)
			.setName('Max Speed')
			.setDesc('Maximum speed of particles (0.5-5.0)')
			.addSlider(slider => slider
				.setLimits(0.5, 5.0, 0.1)
				.setValue(this.plugin.settings.maxSpeed)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxSpeed = value;
					await this.plugin.saveSettings();
					// Update existing boids
					for (const boid of this.plugin.boids) {
						boid.maxSpeed = value;
					}
				}));

		new Setting(containerEl)
			.setName('Max Force')
			.setDesc('Steering force strength (0.01-0.1)')
			.addSlider(slider => slider
				.setLimits(0.01, 0.1, 0.01)
				.setValue(this.plugin.settings.maxForce)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxForce = value;
					await this.plugin.saveSettings();
					// Update existing boids
					for (const boid of this.plugin.boids) {
						boid.maxForce = value;
					}
				}));

		new Setting(containerEl)
			.setName('Separation Radius')
			.setDesc('Distance to avoid other boids (10-50)')
			.addSlider(slider => slider
				.setLimits(10, 50, 5)
				.setValue(this.plugin.settings.separationRadius)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.separationRadius = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Alignment Radius')
			.setDesc('Distance to align with other boids (20-100)')
			.addSlider(slider => slider
				.setLimits(20, 100, 5)
				.setValue(this.plugin.settings.alignmentRadius)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.alignmentRadius = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Cohesion Radius')
			.setDesc('Distance to group with other boids (20-100)')
			.addSlider(slider => slider
				.setLimits(20, 100, 5)
				.setValue(this.plugin.settings.cohesionRadius)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.cohesionRadius = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Opacity')
			.setDesc('Transparency of the background effect (0.1-1.0)')
			.addSlider(slider => slider
				.setLimits(0.1, 1.0, 0.05)
				.setValue(this.plugin.settings.opacity)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.opacity = value;
					await this.plugin.saveSettings();

					// Update canvas opacity if active
					if (this.plugin.canvas) {
						this.plugin.canvas.style.opacity = value.toString();
					}
				}));

		new Setting(containerEl)
			.setName('Particle Size')
			.setDesc('Size of individual particles (1-5)')
			.addSlider(slider => slider
				.setLimits(1, 5, 0.5)
				.setValue(this.plugin.settings.particleSize)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.particleSize = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Trail Length')
			.setDesc('Length of particle trails (0.8-0.99)')
			.addSlider(slider => slider
				.setLimits(0.8, 0.99, 0.01)
				.setValue(this.plugin.settings.trailLength)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.trailLength = value;
					await this.plugin.saveSettings();
				}));

		// Background settings section
		containerEl.createEl('h3', {text: 'Background Settings'});

		new Setting(containerEl)
			.setName('Transparent Background')
			.setDesc('Use transparent background (no trails) or solid background with trails')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.transparentBackground)
				.onChange(async (value) => {
					this.plugin.settings.transparentBackground = value;
					await this.plugin.saveSettings();
					// Show/hide background color setting
					this.display();
				}));

		// Only show background color setting if transparent background is disabled
		if (!this.plugin.settings.transparentBackground) {
			new Setting(containerEl)
				.setName('Background Color')
				.setDesc('Background color for trail effects (hex color)')
				.addText(text => text
					.setPlaceholder('#000000')
					.setValue(this.plugin.settings.backgroundColor)
					.onChange(async (value) => {
						// Validate hex color format
						if (/^#[0-9A-F]{6}$/i.test(value) || value === '') {
							this.plugin.settings.backgroundColor = value || '#000000';
							await this.plugin.saveSettings();
						}
					}));
		}
	}
}
