import { Vector2 } from "./math.js";
import { Collider, Type } from "./collider.js";
import { detectCollision } from "./detection.js";
import { ContactManifold } from "./contact.js";
import * as Util from "./util.js";

export class World
{
    private static cid = 0;
    public cmap: Map<number, ContactManifold> = new Map();

    public colliders: Collider[] = [];
    // Number of resolution iterations
    public numIterations: number = 15;
    public fixedDeltaTime: number = 1 / 144.0;

    public manifolds: ContactManifold[] = [];

    public static gravity = -9.81 * 144;
    public applyGravity = true;

    private useFixedDelta: boolean;
    private static warmStartThreshold = 0.2;
    public static warmStartingEnabled = true;

    constructor(useFixedDelta: boolean)
    {
        this.useFixedDelta = useFixedDelta;
    }

    update(delta: number): void
    {
        if (this.useFixedDelta) delta = this.fixedDeltaTime;

        // Integrate forces, yield tentative velocities that possibly violate the constraint
        this.colliders.forEach(c =>
        {
            c.addVelocity(c.force.mulS(c.inverseMass * delta));
            c.addAngularVelocity(c.torque * c.inverseInertia * delta);

            // Apply gravity 
            if (c.type != Type.Ground && this.applyGravity)
                c.addVelocity(new Vector2(0, World.gravity * delta));
        });

        let newManifolds: ContactManifold[] = [];

        let numWarmStarts = 0;

        // O(N^2) Crud collision detection
        for (let i = 0; i < this.colliders.length; i++)
        {
            let a = this.colliders[i];

            for (let j = i + 1; j < this.colliders.length; j++)
            {
                let b = this.colliders[j];

                let key = Util.make_pair_natural(a.id, b.id);

                let newManifold = detectCollision(a, b);

                if (newManifold != null)
                {
                    if (this.cmap.has(key))
                    {
                        let oldManifold = this.cmap.get(key)!;

                        for (let n = 0; n < newManifold.numContacts; n++)
                        {
                            let o = 0;
                            for (; o < oldManifold.numContacts; o++)
                            {
                                let dist = Util.squared_distance(newManifold.contactPoints[n], oldManifold.contactPoints[o]);

                                if (dist < World.warmStartThreshold)
                                    break;
                            }

                            if (o < oldManifold.numContacts && World.warmStartingEnabled)
                            {
                                numWarmStarts++;

                                newManifold.solversN[n].impulseSum = oldManifold.solversN[o].impulseSum;
                                newManifold.solversT[n].impulseSum = oldManifold.solversT[o].impulseSum;
                            }
                        }
                    }

                    this.cmap.set(key, newManifold);
                    newManifolds.push(newManifold);
                }
                else
                {
                    this.cmap.delete(key);
                }
            }
        }

        // console.log(numWarms);

        this.manifolds = newManifolds;

        // Prepare for resolution step
        this.manifolds.forEach(manifold =>
        {
            manifold.prepare(delta);
        });

        // Iteratively resolve violated velocity constraint
        for (let i = 0; i < this.numIterations; i++)
        {
            this.manifolds.forEach(manifold =>
            {
                manifold.solve();
            });
        }

        // Update the positions using the new velocities
        this.colliders.forEach((c, index) =>
        {
            c.position.x += c.linearVelocity.x * delta;
            c.position.y += c.linearVelocity.y * delta;
            c.rotation += c.angularVelocity * delta;

            if (c.position.y < -500)
                this.colliders.splice(index, 1);

            c.force.clear();
            c.torque = 0;
        });
    }

    register(collider: Collider): void
    {
        collider.id = World.cid++;
        this.colliders.push(collider);
    }

    unregister(index: number)
    {
        this.colliders.splice(index, 1);
    }

    clear(): void
    {
        this.colliders = [];
    }

    get numColliders(): number
    {
        return this.colliders.length;
    }
}