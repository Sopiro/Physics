import { Vector2 } from "./math.js";
import { RigidBody, Type } from "./rigidbody.js";
import { detectCollision } from "./detection.js";
import { ContactManifold } from "./contact.js";
import * as Util from "./util.js";
import { Settings } from "./settings.js";
import { Joint } from "./joint.js";
import { Island } from "./island.js";
import { GrabJoint } from "./grab.js";

type Registrable = RigidBody | Joint;

export class World
{
    private uid = 0;

    public bodies: RigidBody[] = [];

    // Constraints to be solved
    public manifolds: ContactManifold[] = [];
    public joints: Joint[] = [];

    public manifoldMap: Map<number, ContactManifold> = new Map();
    public jointMap: Map<number, Joint> = new Map();

    public passTestSet: Set<number> = new Set();
    public numIslands: number = 0;

    update(): void
    {
        // Integrate forces, yield tentative velocities that possibly violate the constraint
        for (let i = 0; i < this.bodies.length; i++)
        {
            let b = this.bodies[i];

            let linear_a = b.force.mul(b.inverseMass * Settings.dt); // Force / mass * dt
            b.linearVelocity.x += linear_a.x;
            b.linearVelocity.y += linear_a.y;

            let angular_a = b.torque * b.inverseInertia * Settings.dt // Torque / Inertia * dt
            b.angularVelocity += angular_a;

            // Apply gravity 
            if (b.type != Type.Static && Settings.applyGravity)
            {
                let gravity = new Vector2(0, Settings.gravity * Settings.gravityScale * Settings.dt);
                b.linearVelocity.x += gravity.x;
                b.linearVelocity.y += gravity.y;
            }

            b.manifoldIDs = [];
        }

        let newManifolds: ContactManifold[] = [];

        // Detect collisions, generate contact manifolds, try warm starting
        for (let i = 0; i < this.bodies.length; i++)
        {
            let a = this.bodies[i];

            for (let j = i + 1; j < this.bodies.length; j++)
            {
                let b = this.bodies[j];

                if (a.type == Type.Static && b.type == Type.Static) continue;

                let key = Util.make_pair_natural(a.id, b.id);
                if (this.passTestSet.has(key)) continue;

                let newManifold = detectCollision(a, b);

                if (newManifold != null)
                {
                    a.manifoldIDs.push(key);
                    b.manifoldIDs.push(key);

                    if (Settings.warmStarting && this.manifoldMap.has(key))
                    {
                        let oldManifold = this.manifoldMap.get(key)!;
                        newManifold.tryWarmStart(oldManifold);
                    }

                    this.manifoldMap.set(key, newManifold);
                    newManifolds.push(newManifold);
                }
                else
                {
                    this.manifoldMap.delete(key);
                }
            }
        }

        this.manifolds = newManifolds;

        // Build the constraint island
        let island = new Island();
        let islandID = 0;

        let visited: Set<number> = new Set();
        let stack: RigidBody[] = [];

        // Perform a DFS(Depth First Search) on the constraint graph
        // After building island, each island can be solved in parallel because they are independent of each other
        for (let i = 0; i < this.bodies.length; i++)
        {
            let b = this.bodies[i];

            if (visited.has(b.id) || b.type == Type.Static)
                continue;

            stack = [];
            stack.push(b);

            islandID++;
            while (stack.length > 0)
            {
                let t = stack.pop()!;
                if (visited.has(t.id) || t.type == Type.Static)
                    continue;

                visited.add(t.id);
                t.islandID = islandID;
                island.addBody(t);

                for (let m = 0; m < t.manifoldIDs.length; m++)
                {
                    let key = t.manifoldIDs[m];
                    let manifold = this.manifoldMap.get(key)!;

                    let other = manifold.bodyB;
                    if (other.id == t.id)
                        other = manifold.bodyA;

                    if (visited.has(other.id))
                        continue;

                    island.addManifold(manifold);
                    stack.push(other);
                }

                for (let j = 0; j < t.jointIDs.length; j++)
                {
                    let key = t.jointIDs[j];
                    let joint = this.jointMap.get(key)!;

                    let other = joint.bodyB;
                    if (other.id == t.id)
                        other = joint.bodyA;

                    if (joint instanceof GrabJoint)
                        island.addJoint(joint);

                    if (visited.has(other.id))
                        continue;

                    island.addJoint(joint);
                    stack.push(other);
                }
            }

            island.solve();
            island.clear();
        }

        this.numIslands = islandID;

        // Update positions using corrected velocities using semi-implicit euler integration method
        for (let i = 0; i < this.bodies.length; i++)
        {
            let b = this.bodies[i];
            if (b.type == Type.Static) continue;

            b.position.x += b.linearVelocity.x * Settings.dt;
            b.position.y += b.linearVelocity.y * Settings.dt;
            b.rotation += b.angularVelocity * Settings.dt;

            if (b.position.y < Settings.deadBottom)
            {
                this.bodies.splice(i, 1);
                b.jointIDs.forEach(jid => this.unregister(jid, false));
            }

            b.force.clear();
            b.torque = 0;
        }
    }

    register(r: Registrable, passTest: boolean = false): void
    {
        r.id = this.uid++;

        if (r instanceof RigidBody)
        {
            this.bodies.push(r);
        }
        else if (r instanceof Joint)
        {
            if (r.bodyA.id == -1 || r.bodyB.id == -1)
                throw "You should register the rigid bodies before registering the joint";

            if (passTest)
                this.addPassTestPair(r.bodyA, r.bodyB);

            r.bodyA.jointIDs.push(r.id);
            if (r.bodyA.id != r.bodyB.id) // Extra handle for grab joint
                r.bodyB.jointIDs.push(r.id);

            this.jointMap.set(r.id, r);
            this.joints = Array.from(this.jointMap.values());
        }
    }

    unregister(id: number, isJoint?: boolean): boolean
    {
        if (isJoint)
        {
            let joint = this.jointMap.get(id)!;

            for (let i = 0; i < joint.bodyA.jointIDs.length; i++)
            {
                if (id == joint.bodyA.jointIDs[i])
                {
                    joint.bodyA.jointIDs.splice(i, 1);
                    break;
                }
            }

            for (let i = 0; i < joint.bodyB.jointIDs.length; i++)
            {
                if (id == joint.bodyB.jointIDs[i])
                {
                    joint.bodyB.jointIDs.splice(i, 1);
                    break;
                }
            }

            this.jointMap.delete(id);
            this.joints = Array.from(this.jointMap.values());

            return true;
        }

        for (let i = 0; i < this.bodies.length; i++)
        {
            let b = this.bodies[i];

            if (b.id == id)
            {
                this.bodies.splice(i, 1);

                for (let j = 0; j < b.jointIDs.length; j++)
                {
                    let jid = b.jointIDs[j];

                    let joint = this.jointMap.get(jid)!;
                    let other = joint.bodyA.id == id ? joint.bodyB : joint.bodyA;

                    for (let k = 0; k < other.jointIDs.length; k++)
                    {
                        if (other.jointIDs[k] == jid)
                        {
                            other.jointIDs.splice(k, 1);
                            break;
                        }
                    }

                    this.jointMap.delete(jid);
                }

                this.joints = Array.from(this.jointMap.values());
                return true;
            }
        }

        return false;
    }

    addPassTestPair(bodyA: RigidBody, bodyB: RigidBody)
    {
        this.passTestSet.add(Util.make_pair_natural(bodyA.id, bodyB.id));
        this.passTestSet.add(Util.make_pair_natural(bodyB.id, bodyA.id));
    }

    reset(): void
    {
        this.bodies = [];
        this.joints = [];
        this.manifolds = [];
        this.passTestSet.clear();
        this.manifoldMap.clear();
        this.jointMap.clear();
        this.uid = 0;
    }

    get numBodies(): number
    {
        return this.bodies.length;
    }

    get numJoints(): number
    {
        return this.jointMap.size;
    }
}