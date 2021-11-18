import { Vector2 } from "./math.js";
import { Type } from "./collider.js";
import { detectCollision } from "./detection.js";
import * as Util from "./util.js";
import { Settings } from "./settings.js";
export class World {
    constructor(useFixedDelta) {
        this.cmap = new Map();
        this.colliders = [];
        this.manifolds = [];
        this.useFixedDelta = useFixedDelta;
    }
    update(delta) {
        if (this.useFixedDelta)
            delta = Settings.fixedDeltaTime;
        // Integrate forces, yield tentative velocities that possibly violate the constraint
        this.colliders.forEach(c => {
            c.addVelocity(c.force.mulS(c.inverseMass * delta));
            c.addAngularVelocity(c.torque * c.inverseInertia * delta);
            // Apply gravity 
            if (c.type != Type.Ground && Settings.applyGravity)
                c.addVelocity(new Vector2(0, Settings.gravity * 144 * delta));
        });
        let newManifolds = [];
        // Detect collisions, generate contact manifolds, try warm starting
        for (let i = 0; i < this.colliders.length; i++) {
            let a = this.colliders[i];
            for (let j = i + 1; j < this.colliders.length; j++) {
                let b = this.colliders[j];
                let key = Util.make_pair_natural(a.id, b.id);
                let newManifold = detectCollision(a, b);
                if (newManifold != null) {
                    if (Settings.warmStarting && this.cmap.has(key)) {
                        let oldManifold = this.cmap.get(key);
                        newManifold.tryWarmStart(oldManifold);
                    }
                    this.cmap.set(key, newManifold);
                    newManifolds.push(newManifold);
                }
                else {
                    this.cmap.delete(key);
                }
            }
        }
        this.manifolds = newManifolds;
        // Prepare for resolution step
        this.manifolds.forEach(manifold => {
            manifold.prepare(delta);
        });
        // Iteratively resolve violated velocity constraint
        for (let i = 0; i < Settings.numIterations; i++) {
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
        collider.id = World.cid++;
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
World.cid = 0;
