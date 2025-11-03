/**
 * Vector2D class for 2D vector operations
 */
export class Vector2D {
    constructor(public x: number = 0, public y: number = 0) {}

    // Add another vector to this vector
    add(other: Vector2D): Vector2D {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    // Subtract another vector from this vector
    subtract(other: Vector2D): Vector2D {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    // Multiply vector by a scalar
    multiply(scalar: number): Vector2D {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    // Divide vector by a scalar
    divide(scalar: number): Vector2D {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    // Get the magnitude (length) of the vector
    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    // Normalize the vector (make it unit length)
    normalize(): Vector2D {
        const mag = this.magnitude();
        if (mag > 0) {
            this.divide(mag);
        }
        return this;
    }

    // Limit the magnitude of the vector
    limit(max: number): Vector2D {
        const mag = this.magnitude();
        if (mag > max) {
            this.normalize().multiply(max);
        }
        return this;
    }

    // Get distance to another vector
    distanceTo(other: Vector2D): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Create a copy of this vector
    copy(): Vector2D {
        return new Vector2D(this.x, this.y);
    }

    // Create a new vector from this to another vector
    static subtract(a: Vector2D, b: Vector2D): Vector2D {
        return new Vector2D(a.x - b.x, a.y - b.y);
    }

    // Create a new vector by adding two vectors
    static add(a: Vector2D, b: Vector2D): Vector2D {
        return new Vector2D(a.x + b.x, a.y + b.y);
    }
}

/**
 * Individual Boid class representing a single particle
 */
export class Boid {
    position: Vector2D;
    velocity: Vector2D;
    acceleration: Vector2D;
    maxSpeed: number;
    maxForce: number;
    size: number;
    color: string;

    constructor(x: number, y: number, maxSpeed: number = 2, maxForce: number = 0.03) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        this.acceleration = new Vector2D(0, 0);
        this.maxSpeed = maxSpeed;
        this.maxForce = maxForce;
        this.size = Math.random() * 3 + 2; // Random size between 2-5
        this.color = `hsl(${Math.random() * 60 + 200}, 70%, 60%)`; // Blue-ish colors
    }

    // Apply the three rules of boids: separation, alignment, cohesion (optimized)
    flock(boids: Boid[], separationRadius: number = 25, alignmentRadius: number = 50, cohesionRadius: number = 50): void {
        // Use combined calculation to avoid multiple distance computations
        const forces = this.calculateFlockingForces(boids, separationRadius, alignmentRadius, cohesionRadius);

        // Weight the forces
        forces.separation.multiply(1.5);
        forces.alignment.multiply(1.0);
        forces.cohesion.multiply(1.0);

        // Apply forces
        this.acceleration.add(forces.separation);
        this.acceleration.add(forces.alignment);
        this.acceleration.add(forces.cohesion);
    }

    // Optimized flocking calculation that computes distance only once per neighbor
    private calculateFlockingForces(boids: Boid[], separationRadius: number, alignmentRadius: number, cohesionRadius: number): {
        separation: Vector2D;
        alignment: Vector2D;
        cohesion: Vector2D;
    } {
        const separation = new Vector2D(0, 0);
        const alignment = new Vector2D(0, 0);
        const cohesion = new Vector2D(0, 0);

        let separationCount = 0;
        let alignmentCount = 0;
        let cohesionCount = 0;

        const maxRadius = Math.max(separationRadius, alignmentRadius, cohesionRadius);

        for (const other of boids) {
            if (other === this) continue;

            const distance = this.position.distanceTo(other.position);

            // Skip if outside maximum radius
            if (distance > maxRadius) continue;

            // Separation
            if (distance < separationRadius && distance > 0) {
                const diff = Vector2D.subtract(this.position, other.position);
                diff.normalize();
                diff.divide(distance); // Weight by distance
                separation.add(diff);
                separationCount++;
            }

            // Alignment
            if (distance < alignmentRadius && distance > 0) {
                alignment.add(other.velocity);
                alignmentCount++;
            }

            // Cohesion
            if (distance < cohesionRadius && distance > 0) {
                cohesion.add(other.position);
                cohesionCount++;
            }
        }

        // Process separation
        if (separationCount > 0) {
            separation.divide(separationCount);
            separation.normalize();
            separation.multiply(this.maxSpeed);
            separation.subtract(this.velocity);
            separation.limit(this.maxForce);
        }

        // Process alignment
        if (alignmentCount > 0) {
            alignment.divide(alignmentCount);
            alignment.normalize();
            alignment.multiply(this.maxSpeed);
            const alignSteer = Vector2D.subtract(alignment, this.velocity);
            alignSteer.limit(this.maxForce);
            alignment.x = alignSteer.x;
            alignment.y = alignSteer.y;
        }

        // Process cohesion
        if (cohesionCount > 0) {
            cohesion.divide(cohesionCount);
            const cohesionSteer = this.seek(cohesion);
            cohesion.x = cohesionSteer.x;
            cohesion.y = cohesionSteer.y;
        }

        return { separation, alignment, cohesion };
    }

    // Legacy methods kept for compatibility (now use optimized calculateFlockingForces)
    separate(boids: Boid[], radius: number): Vector2D {
        const forces = this.calculateFlockingForces(boids, radius, 0, 0);
        return forces.separation;
    }

    align(boids: Boid[], radius: number): Vector2D {
        const forces = this.calculateFlockingForces(boids, 0, radius, 0);
        return forces.alignment;
    }

    cohesion(boids: Boid[], radius: number): Vector2D {
        const forces = this.calculateFlockingForces(boids, 0, 0, radius);
        return forces.cohesion;
    }

    // Seek a target position
    seek(target: Vector2D): Vector2D {
        const desired = Vector2D.subtract(target, this.position);
        desired.normalize();
        desired.multiply(this.maxSpeed);

        const steer = Vector2D.subtract(desired, this.velocity);
        steer.limit(this.maxForce);
        return steer;
    }

    // Update boid position and velocity
    update(): void {
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.multiply(0); // Reset acceleration
    }

    // Handle edge wrapping
    edges(width: number, height: number): void {
        if (this.position.x < 0) this.position.x = width;
        if (this.position.x > width) this.position.x = 0;
        if (this.position.y < 0) this.position.y = height;
        if (this.position.y > height) this.position.y = 0;
    }

    // Render the boid on canvas
    render(ctx: CanvasRenderingContext2D): void {
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);
        
        // Draw triangle pointing in direction of movement
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size, this.size / 2);
        ctx.lineTo(-this.size, -this.size / 2);
        ctx.closePath();
        
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.restore();
    }
}
