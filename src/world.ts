import { Vector2 } from "./math.js";
import { Collider, Type } from "./collider.js";
import { detectCollision } from "./pyhsics.js";
import { Contact } from "./contact.js";

export class World
{
    public colliders: Collider[] = [];
    // Number of resolution iterations
    private numIterations: number = 10;
    private readonly fixedDeltaTime: number = 1 / 144.0;

    private gravity = -9.81 * 144;

    private useFixedDelta: boolean;

    constructor(useFixedDelta: boolean)
    {
        this.useFixedDelta = useFixedDelta;
    }

    update(delta: number): void
    {
        if (this.useFixedDelta) delta = this.fixedDeltaTime;

        // Apply externel forces, yield tentative velocities that possibly violate the constraint
        this.colliders.forEach(collider =>
        {
            // Apply gravity 
            if (collider.type != Type.Ground)
                collider.addVelocity(new Vector2(0, this.gravity * delta));
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
            contact.prepareResoultion(delta);
        });

        // Iteratively resolve violated velocity constraint
        for (let i = 0; i < this.numIterations; i++)
        {
            contacts.forEach(contact =>
            {
                contact.resolveConstraint();
            });
        }

        // Update the positions using the new velocities
        this.colliders.forEach((collider, index) =>
        {
            collider.update(delta);

            if (collider.position.y < -500)
                this.colliders.splice(index, 1);
        });
    }

    register(collider: Collider): void
    {
        this.colliders.push(collider);
    }

    clear(): void
    {
        this.colliders = [];
    }
}