import { Vector2 } from "./math.js";
import { Type } from "./collider.js";
import { detectCollision } from "./detection.js";
export class World {
    constructor(useFixedDelta) {
        this.colliders = [];
        // Number of resolution iterations
        this.numIterations = 10;
        this.fixedDeltaTime = 1 / 144.0;
        this.manifolds = [];
        this.applyGravity = true;
        this.useFixedDelta = useFixedDelta;
    }
    update(delta) {
        if (this.useFixedDelta)
            delta = this.fixedDeltaTime;
        // Integrate forces, yield tentative velocities that possibly violate the constraint
        this.colliders.forEach(c => {
            c.addVelocity(c.force.mulS(c.inverseMass * delta));
            c.addAngularVelocity(c.torque * c.inverseInertia * delta);
            // Apply gravity 
            if (c.type != Type.Ground && this.applyGravity)
                c.addVelocity(new Vector2(0, World.gravity * delta));
        });
        let newManifolds = [];
        // O(N^2) Crud collision detection
        for (let i = 0; i < this.colliders.length; i++) {
            let a = this.colliders[i];
            for (let j = i + 1; j < this.colliders.length; j++) {
                let b = this.colliders[j];
                let manifold = detectCollision(a, b);
                if (manifold != null)
                    newManifolds.push(manifold);
            }
        }
        this.manifolds = newManifolds;
        // Prepare for resolution step
        this.manifolds.forEach(manifold => {
            manifold.prepare(delta);
        });
        // Iteratively resolve violated velocity constraint
        for (let i = 0; i < this.numIterations; i++) {
            this.manifolds.forEach(manifold => {
                manifold.solve();
            });
        }
        // Update the positions using the new velocities
        this.colliders.forEach((c, index) => {
            c.position.x += c.linearVelocity.x * delta;
            c.position.y += c.linearVelocity.y * delta;
            c.rotation += c.angularVelocity * delta;
            if (c.position.y < -500)
                this.colliders.splice(index, 1);
            c.force.clear();
            c.torque = 0;
        });
    }
    register(collider) {
        this.colliders.push(collider);
    }
    unregister(index) {
        this.colliders.splice(index, 1);
    }
    clear() {
        this.colliders = [];
    }
    get numColliders() {
        return this.colliders.length;
    }
}
World.gravity = -9.81 * 144;
