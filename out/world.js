import { Vector2 } from "./math.js";
import { Type } from "./collider.js";
import { detectCollision } from "./detection.js";
import * as Util from "./util.js";
export class World {
    constructor(useFixedDelta) {
        this.cmap = new Map();
        this.colliders = [];
        // Number of resolution iterations
        this.numIterations = 15;
        this.fixedDeltaTime = 1 / 144.0;
        this.manifolds = [];
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
            if (c.type != Type.Ground && World.applyGravity)
                c.addVelocity(new Vector2(0, World.gravity * delta));
        });
        let newManifolds = [];
        let numWarmStarts = 0;
        // O(N^2) Crud collision detection
        for (let i = 0; i < this.colliders.length; i++) {
            let a = this.colliders[i];
            for (let j = i + 1; j < this.colliders.length; j++) {
                let b = this.colliders[j];
                let key = Util.make_pair_natural(a.id, b.id);
                let newManifold = detectCollision(a, b);
                if (newManifold != null) {
                    if (this.cmap.has(key)) {
                        let oldManifold = this.cmap.get(key);
                        for (let n = 0; n < newManifold.numContacts; n++) {
                            let o = 0;
                            for (; o < oldManifold.numContacts; o++) {
                                let dist = Util.squared_distance(newManifold.contactPoints[n], oldManifold.contactPoints[o]);
                                if (dist < World.warmStartThreshold)
                                    break;
                            }
                            if (o < oldManifold.numContacts && World.warmStartingEnabled) {
                                numWarmStarts++;
                                newManifold.solversN[n].impulseSum = oldManifold.solversN[o].impulseSum;
                                newManifold.solversT[n].impulseSum = oldManifold.solversT[o].impulseSum;
                                newManifold.persistent = true;
                            }
                        }
                    }
                    this.cmap.set(key, newManifold);
                    newManifolds.push(newManifold);
                }
                else {
                    this.cmap.delete(key);
                }
            }
        }
        // console.log(numWarms);
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
World.gravity = -9.81 * 144;
World.applyGravity = true;
World.warmStartThreshold = 0.2;
World.warmStartingEnabled = true;
