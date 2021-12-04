import { Vector2 } from "./math.js";
import { RigidBody, Type } from "./rigidbody.js";
import { detectCollision } from "./detection.js";
import * as Util from "./util.js";
import { Settings } from "./settings.js";
import { Joint } from "./joint.js";
export class World {
    constructor() {
        this.bodies = [];
        this.joints = [];
        this.manifolds = [];
        this.manifoldMap = new Map();
        this.passTestSet = new Set();
    }
    update(delta) {
        delta = Settings.fixedDeltaTime;
        // Integrate forces, yield tentative velocities that possibly violate the constraint
        this.bodies.forEach(b => {
            b.addVelocity(b.force.mulS(b.inverseMass * delta));
            b.addAngularVelocity(b.torque * b.inverseInertia * delta);
            // Apply gravity 
            if (b.type != Type.Ground && Settings.applyGravity)
                b.addVelocity(new Vector2(0, Settings.gravity * Settings.gravityScale * delta));
        });
        let newManifolds = [];
        // Detect collisions, generate contact manifolds, try warm starting
        for (let i = 0; i < this.bodies.length; i++) {
            let a = this.bodies[i];
            for (let j = i + 1; j < this.bodies.length; j++) {
                let b = this.bodies[j];
                if (a.type == Type.Ground && b.type == Type.Ground)
                    continue;
                let key = Util.make_pair_natural(a.id, b.id);
                if (this.passTestSet.has(key))
                    continue;
                let newManifold = detectCollision(a, b);
                if (newManifold != null) {
                    if (Settings.warmStarting && this.manifoldMap.has(key)) {
                        let oldManifold = this.manifoldMap.get(key);
                        newManifold.tryWarmStart(oldManifold);
                    }
                    this.manifoldMap.set(key, newManifold);
                    newManifolds.push(newManifold);
                }
                else {
                    this.manifoldMap.delete(key);
                }
            }
        }
        this.manifolds = newManifolds;
        // Prepare for resolution step
        this.manifolds.forEach(manifold => {
            manifold.prepare(delta);
        });
        this.joints.forEach(joint => {
            joint.prepare(delta);
        });
        // Iteratively resolve violated velocity constraint
        for (let i = 0; i < Settings.numIterations; i++) {
            this.manifolds.forEach(manifold => {
                manifold.solve();
            });
            this.joints.forEach(joint => {
                joint.solve();
            });
        }
        // Update the positions using the new velocities
        this.bodies.forEach((b, index) => {
            b.position.x += b.linearVelocity.x * delta;
            b.position.y += b.linearVelocity.y * delta;
            b.rotation += b.angularVelocity * delta;
            if (b.position.y < Settings.deadBottom)
                this.bodies.splice(index, 1);
            b.force.clear();
            b.torque = 0;
        });
    }
    register(r, passTest = false) {
        r.id = World.uid++;
        if (r instanceof RigidBody) {
            this.bodies.push(r);
        }
        else if (r instanceof Joint) {
            if (r.bodyA.id == -1 || r.bodyB.id == -1)
                throw "You should register the rigid bodies before registering the joint";
            if (passTest)
                this.addPassTestPair(r.bodyA, r.bodyB);
            r.bodyA.jointKeys.push(r.id);
            r.bodyB.jointKeys.push(r.id);
            this.joints.push(r);
        }
    }
    unregister(id) {
        for (let i = 0; i < this.joints.length; i++) {
            let j = this.joints[i];
            if (j.id == id) {
                this.joints.splice(i, 1);
                return true;
            }
        }
        for (let i = 0; i < this.bodies.length; i++) {
            let b = this.bodies[i];
            if (b.id == id) {
                this.bodies.splice(i, 1);
                b.jointKeys.forEach(jointKey => this.unregister(jointKey));
                return true;
            }
        }
        return false;
    }
    addPassTestPair(bodyA, bodyB) {
        this.passTestSet.add(Util.make_pair_natural(bodyA.id, bodyB.id));
        this.passTestSet.add(Util.make_pair_natural(bodyB.id, bodyA.id));
    }
    clear() {
        this.bodies = [];
        this.joints = [];
        this.manifolds = [];
        this.passTestSet.clear();
        this.manifoldMap.clear();
        World.uid = 0;
    }
    get numBodies() {
        return this.bodies.length;
    }
    get numJoints() {
        return this.joints.length;
    }
}
World.uid = 0;
