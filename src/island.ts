import { Constraint } from "./constraint.js";
import { ContactManifold } from "./contact.js";
import { Joint } from "./joint.js";
import { Vector2 } from "./math.js";
import { RigidBody } from "./rigidbody.js";
import { Settings } from "./settings.js";
import { World } from "./world.js";

export class Island
{
    private world: World;
    private bodies: RigidBody[] = [];

    // Constraints to be solved
    private constraints: Constraint[] = [];
    private manifolds: ContactManifold[] = [];
    private joints: Joint[] = [];

    public sleeping = false;

    constructor(world: World)
    {
        this.world = world;
    }

    solve(delta: number)
    {
        // Integrate forces, yield tentative velocities that possibly violate the constraint
        for (let i = 0; i < this.bodies.length; i++)
        {
            let b = this.bodies[i];

            b.sleeping = this.sleeping;

            if (this.sleeping)
            {
                b.linearVelocity.clear();
                b.angularVelocity = 0;
            }

            if (this.world.forceIntegration)
            {
                let linear_a = b.force.mul(b.inverseMass * Settings.dt); // Force / mass * dt
                b.linearVelocity.x += linear_a.x;
                b.linearVelocity.y += linear_a.y;

                let angular_a = b.torque * b.inverseInertia * Settings.dt // Torque / Inertia * dt
                b.angularVelocity += angular_a;
            }

            if ((this.sleeping && !this.world.forceIntegration) ||
                ((b.linearVelocity.squaredLength < Settings.restLinearTolerance) &&
                    (b.angularVelocity * b.angularVelocity < Settings.restAngularTolerance)))
            {
                b.resting += delta;
            }
            else
            {
                b.awake();
                this.sleeping = false;
            }

            // Apply gravity 
            if (Settings.applyGravity && !b.sleeping)
            {
                let gravity = new Vector2(0, Settings.gravity * Settings.gravityScale * Settings.dt);
                b.linearVelocity.x += gravity.x;
                b.linearVelocity.y += gravity.y;
            }
        }

        // If island is sleeping, skip the extra computation
        if (this.sleeping) return;

        // Prepare for solving
        {
            for (let i = 0; i < this.manifolds.length; i++)
                this.manifolds[i].prepare();

            for (let i = 0; i < this.joints.length; i++)
                this.joints[i].prepare();
        }

        // Iteratively solve the violated velocity constraint
        {
            for (let i = 0; i < Settings.numIterations; i++)
            {
                for (let j = 0; j < this.manifolds.length; j++)
                    this.manifolds[j].solve();

                for (let j = 0; j < this.joints.length; j++)
                    this.joints[j].solve();
            }
        }

        // Update positions using corrected velocities (Semi-implicit euler integration)
        for (let i = 0; i < this.bodies.length; i++)
        {
            let b = this.bodies[i];

            b.force.clear();
            b.torque = 0;

            b.position.x += b.linearVelocity.x * Settings.dt;
            b.position.y += b.linearVelocity.y * Settings.dt;
            b.rotation += b.angularVelocity * Settings.dt;

            if (b.position.y < Settings.deadBottom)
                this.world.unregister(b.id);
        }
    }

    addBody(body: RigidBody)
    {
        this.bodies.push(body);
    }

    addManifold(manifold: ContactManifold)
    {
        this.manifolds.push(manifold);
        this.constraints.push(manifold);
    }

    addJoint(joint: Joint)
    {
        this.joints.push(joint);
        this.constraints.push(joint);
    }

    clear()
    {
        this.bodies = [];
        this.manifolds = [];
        this.joints = [];
        this.constraints = [];
        this.sleeping = false;
    }

    get numBodies(): number
    {
        return this.bodies.length;
    }
}
