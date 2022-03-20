import { Vector2 } from "./math.js";
import { Settings } from "./settings.js";
export class Island {
    constructor(world) {
        this.bodies = [];
        // Constraints to be solved
        this.constraints = [];
        this.manifolds = [];
        this.joints = [];
        this.sleeping = false;
        this.world = world;
    }
    solve(delta) {
        let awakeIsland = false;
        // Integrate forces, yield tentative velocities that possibly violate the constraint
        for (let i = 0; i < this.bodies.length; i++) {
            let b = this.bodies[i];
            b.sleeping = this.sleeping;
            if (this.sleeping) {
                b.linearVelocity.clear();
                b.angularVelocity = 0;
            }
            if (this.world.forceIntegration) {
                let linear_a = b.force.mul(b.inverseMass * Settings.dt); // Force / mass * dt
                b.linearVelocity.x += linear_a.x;
                b.linearVelocity.y += linear_a.y;
                let angular_a = b.torque * b.inverseInertia * Settings.dt; // Torque / inertia * dt
                b.angularVelocity += angular_a;
                if (this.sleeping &&
                    (linear_a.squaredLength >= Settings.restLinearTolerance) || (angular_a * angular_a >= Settings.restAngularTolerance)) {
                    this.sleeping = false;
                    awakeIsland = true;
                }
            }
            if ((this.sleeping && !this.world.forceIntegration) ||
                ((b.linearVelocity.squaredLength < Settings.restLinearTolerance) &&
                    (b.angularVelocity * b.angularVelocity < Settings.restAngularTolerance))) {
                b.resting += delta;
            }
            else {
                this.sleeping = false;
                awakeIsland = true;
            }
            // Apply gravity 
            if (Settings.applyGravity && !this.sleeping) {
                let gravity = new Vector2(0, Settings.gravity * Settings.gravityScale * Settings.dt);
                b.linearVelocity.x += gravity.x;
                b.linearVelocity.y += gravity.y;
            }
        }
        // If island is sleeping, skip the extra computation
        if (this.sleeping)
            return;
        // Prepare for solving
        {
            for (let i = 0; i < this.manifolds.length; i++)
                this.manifolds[i].prepare();
            for (let i = 0; i < this.joints.length; i++)
                this.joints[i].prepare();
        }
        // Iteratively solve the violated velocity constraint
        {
            for (let i = 0; i < Settings.numIterations - 1; i++) {
                for (let j = 0; j < this.manifolds.length; j++)
                    this.manifolds[j].solve();
                for (let j = 0; j < this.joints.length; j++)
                    this.joints[j].solve();
            }
            for (let i = 0; i < this.manifolds.length; i++) {
                let manifold = this.manifolds[i];
                manifold.solve();
                // Contact callbacks
                if (manifold.bodyA.onContact != undefined) {
                    let contactInfo = manifold.getContactInfo(false);
                    if (manifold.bodyA.onContact(contactInfo))
                        manifold.bodyA.onContact = undefined;
                }
                if (manifold.bodyB.onContact != undefined) {
                    let contactInfo = manifold.getContactInfo(true);
                    if (manifold.bodyB.onContact(contactInfo))
                        manifold.bodyB.onContact = undefined;
                }
            }
            for (let i = 0; i < this.joints.length; i++)
                this.joints[i].solve();
        }
        // Update positions using corrected velocities (Semi-implicit euler integration)
        for (let i = 0; i < this.bodies.length; i++) {
            let b = this.bodies[i];
            if (awakeIsland)
                b.awake();
            b.force.clear();
            b.torque = 0;
            b.position.x += b.linearVelocity.x * Settings.dt;
            b.position.y += b.linearVelocity.y * Settings.dt;
            b.rotation += b.angularVelocity * Settings.dt;
            if (b.position.y < Settings.deadBottom)
                this.world.unregister(b.id);
        }
    }
    addBody(body) {
        this.bodies.push(body);
    }
    addManifold(manifold) {
        this.manifolds.push(manifold);
        this.constraints.push(manifold);
    }
    addJoint(joint) {
        this.joints.push(joint);
        this.constraints.push(joint);
    }
    clear() {
        this.bodies = [];
        this.manifolds = [];
        this.joints = [];
        this.constraints = [];
        this.sleeping = false;
    }
    get numBodies() {
        return this.bodies.length;
    }
}
