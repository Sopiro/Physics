import { RigidBody } from "./rigidbody.js";

export abstract class Constraint
{
    public readonly bodyA: RigidBody;
    public readonly bodyB: RigidBody;

    constructor(bodyA: RigidBody, bodyB: RigidBody)
    {
        this.bodyA = bodyA;
        this.bodyB = bodyB;
    }

    public abstract prepare(delta: number): void;
    public abstract solve(): void;
}