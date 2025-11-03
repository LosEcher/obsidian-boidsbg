import { Boid } from './boids';

/**
 * Configuration interface for BoidSystem
 */
export interface BoidSystemConfig {
    boidCount: number;
    maxSpeed: number;
    maxForce: number;
    separationRadius: number;
    alignmentRadius: number;
    cohesionRadius: number;
    backgroundColor: string;
    opacity: number;
    zIndex: number;
    renderMode: 'canvas' | 'dom';
    enablePerformanceMode: boolean;
    maxFPS: number;
}

/**
 * Default configuration for the boid system
 */
export const DEFAULT_CONFIG: BoidSystemConfig = {
    boidCount: 50,
    maxSpeed: 2,
    maxForce: 0.03,
    separationRadius: 25,
    alignmentRadius: 50,
    cohesionRadius: 50,
    backgroundColor: 'transparent',
    opacity: 0.8,
    zIndex: 2,
    renderMode: 'canvas',
    enablePerformanceMode: false,
    maxFPS: 60
};

/**
 * BoidSystem class that manages the entire flock simulation
 */
export class BoidSystem {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private boids: Boid[] = [];
    private animationId: number | null = null;
    private config: BoidSystemConfig;
    private isRunning: boolean = false;

    // Performance monitoring
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private lastFPSUpdate: number = 0;
    private currentFPS: number = 0;
    private averageFrameTime: number = 16.67; // Target 60fps
    private performanceHistory: number[] = [];

    // Optimization flags
    private skipFrames: number = 0;
    private adaptiveQuality: boolean = false;

    constructor(canvas: HTMLCanvasElement, config: Partial<BoidSystemConfig> = {}) {
        try {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d')!;
            this.config = { ...DEFAULT_CONFIG, ...config };

            // Delay all setup to prevent blocking
            setTimeout(() => {
                this.setupCanvas();
                this.initializeBoids();
                this.setupVisibilityHandling();
            }, 100);
        } catch (error) {
            console.error('Error in BoidSystem constructor:', error);
        }
    }

    /**
     * Setup visibility change handling for performance (disabled to prevent blocking)
     */
    private setupVisibilityHandling(): void {
        // Disabled to prevent settings page blocking
        // document.addEventListener can interfere with Obsidian UI
    }

    private wasRunningBeforeHidden: boolean = false;

    /**
     * Setup canvas properties
     */
    private setupCanvas(): void {
        // Set canvas size to match container
        this.resizeCanvas();

        // Set canvas style for background positioning
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = this.config.zIndex.toString();
        this.canvas.style.opacity = this.config.opacity.toString();
        this.canvas.style.background = 'transparent';

        // Ensure canvas is behind content
        this.canvas.setAttribute('data-boids-background', 'true');
        this.canvas.setAttribute('data-render-mode', this.config.renderMode);

        // No DOM manipulation to prevent settings page blocking
    }

    /**
     * No-op methods to prevent DOM manipulation
     */
    private applySmartLayering(): void {
        // Disabled to prevent settings page blocking
    }

    private applyMinimalLayering(): void {
        // Disabled to prevent settings page blocking
    }

    private adjustElementLayering(): void {
        // Disabled to prevent settings page blocking
    }

    private removeStyleInjection(): void {
        // Disabled to prevent settings page blocking
    }

    private restoreElementLayering(): void {
        // Disabled to prevent settings page blocking
    }

    /**
     * Resize canvas to match window size (safe version)
     */
    public resizeCanvas(): void {
        try {
            // Use safe defaults if window properties are not available
            const width = window.innerWidth || 1920;
            const height = window.innerHeight || 1080;

            this.canvas.width = width;
            this.canvas.height = height;
        } catch (error) {
            console.error('Error resizing canvas:', error);
            // Fallback to default size
            this.canvas.width = 1920;
            this.canvas.height = 1080;
        }
    }

    /**
     * Initialize boids with random positions
     */
    private initializeBoids(): void {
        this.boids = [];
        for (let i = 0; i < this.config.boidCount; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const boid = new Boid(x, y, this.config.maxSpeed, this.config.maxForce);
            this.boids.push(boid);
        }
    }

    /**
     * Update configuration and reinitialize if needed
     */
    public updateConfig(newConfig: Partial<BoidSystemConfig>): void {
        const oldBoidCount = this.config.boidCount;
        const oldZIndex = this.config.zIndex;
        this.config = { ...this.config, ...newConfig };

        // Update canvas properties
        this.canvas.style.opacity = this.config.opacity.toString();
        this.canvas.style.zIndex = this.config.zIndex.toString();

        // Smart layering disabled to prevent settings page blocking

        // Reinitialize boids if count changed
        if (this.config.boidCount !== oldBoidCount) {
            this.initializeBoids();
        } else {
            // Update existing boids' properties
            this.boids.forEach(boid => {
                boid.maxSpeed = this.config.maxSpeed;
                boid.maxForce = this.config.maxForce;
            });
        }
    }

    /**
     * Start the animation loop
     */
    public start(): void {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.animate();
    }

    /**
     * Stop the animation loop
     */
    public stop(): void {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Main animation loop with adaptive performance optimization
     */
    private animate = (): void => {
        if (!this.isRunning) return;

        const now = performance.now();
        if (!this.lastFrameTime) this.lastFrameTime = now;

        const deltaTime = now - this.lastFrameTime;
        const targetFrameTime = 1000 / this.config.maxFPS;

        // Skip frames if we're running too fast or performance mode is enabled
        if (this.skipFrames > 0) {
            this.skipFrames--;
            this.animationId = requestAnimationFrame(this.animate);
            return;
        }

        // Only update if enough time has passed
        if (deltaTime >= targetFrameTime) {
            const frameStart = performance.now();

            this.update();
            this.render();

            const frameEnd = performance.now();
            const frameTime = frameEnd - frameStart;

            // Performance monitoring and adaptive quality
            this.updatePerformanceMetrics(frameTime, deltaTime);
            this.adaptPerformance(frameTime);

            this.lastFrameTime = now;
        }

        this.animationId = requestAnimationFrame(this.animate);
    };

    /**
     * Update performance metrics and FPS calculation
     */
    private updatePerformanceMetrics(frameTime: number, deltaTime: number): void {
        this.frameCount++;
        this.performanceHistory.push(frameTime);

        // Keep only last 60 frames for average calculation
        if (this.performanceHistory.length > 60) {
            this.performanceHistory.shift();
        }

        // Update FPS every second
        const now = performance.now();
        if (now - this.lastFPSUpdate >= 1000) {
            this.currentFPS = Math.round(1000 / deltaTime);
            this.averageFrameTime = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
            this.lastFPSUpdate = now;

            // Log performance in debug mode
            if (this.config.enablePerformanceMode) {
                console.log(`Boids FPS: ${this.currentFPS}, Avg Frame Time: ${this.averageFrameTime.toFixed(2)}ms`);
            }
        }
    }

    /**
     * Adapt performance based on frame time
     */
    private adaptPerformance(frameTime: number): void {
        if (!this.config.enablePerformanceMode) return;

        const targetFrameTime = 1000 / this.config.maxFPS;

        // If frame time is consistently high, enable adaptive quality
        if (frameTime > targetFrameTime * 1.5) {
            if (!this.adaptiveQuality) {
                this.adaptiveQuality = true;
                console.log('Boids: Enabling adaptive quality mode');
            }

            // Skip every other frame if performance is poor
            if (frameTime > targetFrameTime * 2) {
                this.skipFrames = 1;
            }
        } else if (frameTime < targetFrameTime * 0.8 && this.adaptiveQuality) {
            // Re-enable full quality if performance improves
            this.adaptiveQuality = false;
            this.skipFrames = 0;
            console.log('Boids: Disabling adaptive quality mode');
        }
    }

    /**
     * Update all boids with performance optimizations
     */
    private update(): void {
        // In performance mode, use spatial partitioning or reduce neighbor checks
        if (this.config.enablePerformanceMode && this.boids.length > 100) {
            this.updateWithSpatialOptimization();
        } else {
            this.updateStandard();
        }
    }

    /**
     * Standard update method
     */
    private updateStandard(): void {
        for (const boid of this.boids) {
            // Apply flocking behavior
            boid.flock(
                this.boids,
                this.config.separationRadius,
                this.config.alignmentRadius,
                this.config.cohesionRadius
            );

            // Update position and velocity
            boid.update();

            // Handle edge wrapping
            boid.edges(this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Optimized update with spatial partitioning for large numbers of boids
     */
    private updateWithSpatialOptimization(): void {
        const gridSize = Math.max(this.config.separationRadius, this.config.alignmentRadius, this.config.cohesionRadius);
        const cols = Math.ceil(this.canvas.width / gridSize);
        const rows = Math.ceil(this.canvas.height / gridSize);

        // Create spatial grid
        const grid: Boid[][] = Array(cols * rows).fill(null).map(() => []);

        // Assign boids to grid cells
        for (const boid of this.boids) {
            const col = Math.floor(boid.position.x / gridSize);
            const row = Math.floor(boid.position.y / gridSize);
            const index = row * cols + col;

            if (index >= 0 && index < grid.length) {
                grid[index].push(boid);
            }
        }

        // Update boids using only nearby neighbors
        for (let i = 0; i < this.boids.length; i++) {
            const boid = this.boids[i];
            const col = Math.floor(boid.position.x / gridSize);
            const row = Math.floor(boid.position.y / gridSize);

            // Get neighbors from surrounding cells
            const neighbors: Boid[] = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const neighborCol = col + dx;
                    const neighborRow = row + dy;
                    const neighborIndex = neighborRow * cols + neighborCol;

                    if (neighborIndex >= 0 && neighborIndex < grid.length) {
                        neighbors.push(...grid[neighborIndex]);
                    }
                }
            }

            // Apply flocking behavior with reduced neighbor set
            boid.flock(
                neighbors,
                this.config.separationRadius,
                this.config.alignmentRadius,
                this.config.cohesionRadius
            );

            // Update position and velocity
            boid.update();

            // Handle edge wrapping
            boid.edges(this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Render all boids to canvas with performance optimizations
     */
    private render(): void {
        // Clear canvas completely for transparent background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Only add background if not transparent
        if (this.config.backgroundColor !== 'transparent') {
            this.ctx.fillStyle = this.config.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Debug: Add a subtle border to verify canvas is visible (only if boids exist)
        if (this.boids.length > 0 && this.config.backgroundColor === 'transparent') {
            this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);
        }

        // Use optimized rendering based on performance mode and boid count
        if (this.config.enablePerformanceMode || this.adaptiveQuality) {
            this.renderOptimized();
        } else {
            this.renderStandard();
        }
    }

    /**
     * Standard rendering method
     */
    private renderStandard(): void {
        for (const boid of this.boids) {
            boid.render(this.ctx);
        }
    }

    /**
     * Optimized rendering with LOD and batching
     */
    private renderOptimized(): void {
        const boidCount = this.boids.length;

        // Use simpler rendering for large numbers of boids
        if (boidCount > 150) {
            this.renderAsPoints();
        } else if (boidCount > 75) {
            this.renderSimplified();
        } else {
            this.renderStandard();
        }
    }

    /**
     * Render boids as simple points for maximum performance
     */
    private renderAsPoints(): void {
        this.ctx.fillStyle = 'rgba(100, 150, 255, 0.8)';
        this.ctx.beginPath();

        for (const boid of this.boids) {
            this.ctx.moveTo(boid.position.x + 2, boid.position.y);
            this.ctx.arc(boid.position.x, boid.position.y, 2, 0, Math.PI * 2);
        }

        this.ctx.fill();
    }

    /**
     * Render boids with simplified shapes
     */
    private renderSimplified(): void {
        for (const boid of this.boids) {
            const x = boid.position.x;
            const y = boid.position.y;
            const size = boid.size * 0.7; // Smaller size for performance

            this.ctx.fillStyle = boid.color;
            this.ctx.fillRect(x - size/2, y - size/2, size, size);
        }
    }

    /**
     * Add a new boid at specified position
     */
    public addBoid(x: number, y: number): void {
        const boid = new Boid(x, y, this.config.maxSpeed, this.config.maxForce);
        this.boids.push(boid);
    }

    /**
     * Remove a random boid
     */
    public removeBoid(): void {
        if (this.boids.length > 0) {
            this.boids.pop();
        }
    }

    /**
     * Get current number of boids
     */
    public getBoidCount(): number {
        return this.boids.length;
    }

    /**
     * Clear all boids
     */
    public clear(): void {
        this.boids = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Destroy the system and clean up resources
     */
    public destroy(): void {
        this.stop();
        this.clear();

        // Element layering restoration disabled

        if (this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }

    /**
     * Get current configuration
     */
    public getConfig(): BoidSystemConfig {
        return { ...this.config };
    }

    /**
     * Check if system is running
     */
    public isActive(): boolean {
        return this.isRunning;
    }

    /**
     * Get current performance metrics
     */
    public getPerformanceMetrics(): {
        fps: number;
        averageFrameTime: number;
        adaptiveQuality: boolean;
        boidCount: number;
    } {
        return {
            fps: this.currentFPS,
            averageFrameTime: this.averageFrameTime,
            adaptiveQuality: this.adaptiveQuality,
            boidCount: this.boids.length
        };
    }

    /**
     * Force performance mode on/off
     */
    public setPerformanceMode(enabled: boolean): void {
        this.config.enablePerformanceMode = enabled;
        if (!enabled) {
            this.adaptiveQuality = false;
            this.skipFrames = 0;
        }
    }
}
