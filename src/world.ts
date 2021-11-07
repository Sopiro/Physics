import { Vector2 } from "./math.js";
import { Collider, Type } from "./collider.js";
import { detectCollision } from "./detection.js";
import { Contact } from "./contact.js";

export class World
{
    public colliders: Collider[] = [];
    // Number of resolution iterations
    private numIterations: number = 10;
    private readonly fixedDeltaTime: number = 1 / 144.0;

    private gravity = -9.81 * 144;
    private sleep = 0.01;

    private useFixedDelta: boolean;

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
            if (c.type != Type.Ground)
                c.addVelocity(new Vector2(0, this.gravity * delta));
        });

        const contacts: Contact[] = [];

        // O(N^2) Crud collision detection
        for (let i = 0; i < this.colliders.length; i++)
        {
            let a = this.colliders[i];

            for (let j = i + 1; j < this.colliders.length; j++)
            {
                let b = this.colliders[j];

                let contact = detectCollision(a, b);
                if (contact != null)
                    contacts.push(contact);
            }
        }

        // Prepare for resolution step
        contacts.forEach(contact =>
        {
            contact.prepareResolution(delta);
        });

        // Iteratively resolve violated velocity constraint
        for (let i = 0; i < this.numIterations; i++)
        {
            contacts.forEach(contact =>
            {
                contact.resolveConstraint();
            });
        }

        // console.log(this.colliders[0].linearVelocity);

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

        // console.log(this.colliders[0].linearVelocity.getLength());
    }

    register(collider: Collider): void
    {
        this.colliders.push(collider);
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