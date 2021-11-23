import { Vector2 } from "./math.js";
import { RigidBody, Type } from "./rigidbody.js";
import { detectCollision } from "./detection.js";
import { ContactManifold } from "./contact.js";
import * as Util from "./util.js";
import { Settings } from "./settings.js";

export class World
{
    private static bid = 0;
    public bmap: Map<number, ContactManifold> = new Map();

    public bodies: RigidBody[] = [];
    public manifolds: ContactManifold[] = [];

    update(delta: number): void
    {
        delta = Settings.fixedDeltaTime;

        // Integrate forces, yield tentative velocities that possibly violate the constraint
        this.bodies.forEach(b =>
        {
            b.addVelocity(b.force.mulS(b.inverseMass * delta));
            b.addAngularVelocity(b.torque * b.inverseInertia * delta);

            // Apply gravity 
            if (b.type != Type.Ground && Settings.applyGravity)
                b.addVelocity(new Vector2(0, Settings.gravity * 25 * delta));
        });

        let newManifolds: ContactManifold[] = [];

        // Detect collisions, generate contact manifolds, try warm starting
        for (let i = 0; i < this.bodies.length; i++)
        {
            let a = this.bodies[i];

            for (let j = i + 1; j < this.bodies.length; j++)
            {
                let b = this.bodies[j];

                let key = Util.make_pair_natural(a.id, b.id);
                let newManifold = detectCollision(a, b);

                if (newManifold != null)
                {
                    if (Settings.warmStarting && this.bmap.has(key))
                    {
                        let oldManifold = this.bmap.get(key)!;
                        newManifold.tryWarmStart(oldManifold);
                    }

                    this.bmap.set(key, newManifold);
                    newManifolds.push(newManifold);
                }
                else
                {
                    this.bmap.delete(key);
                }
            }
        }

        this.manifolds = newManifolds;

        // Prepare for resolution step
        this.manifolds.forEach(manifold =>
        {
            manifold.prepare(delta);
        });

        // Iteratively resolve violated velocity constraint
        for (let i = 0; i < Settings.numIterations; i++)
        {
            this.manifolds.forEach(manifold =>
            {
                manifold.solve();
            });
        }

        // Update the positions using the new velocities
        this.bodies.forEach((c, index) =>
        {
            c.position.x += c.linearVelocity.x * delta;
            c.position.y += c.linearVelocity.y * delta;
            c.rotation += c.angularVelocity * delta;

            if (c.position.y < Settings.deadBottom)
                this.bodies.splice(index, 1);

            c.force.clear();
            c.torque = 0;
        });
    }

    register(body: RigidBody): void
    {
        body.id = World.bid++;
        this.bodies.push(body);
    }

    unregister(index: number): void
    {
        this.bodies.splice(index, 1);
    }

    clear(): void
    {
        this.bodies = [];
        this.manifolds = [];
        this.bmap.clear();
        World.bid = 0;
    }

    get numBodies(): number
    {
        return this.bodies.length;
    }
}