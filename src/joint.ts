import { Constraint } from "./constraint.js";
import { RigidBody } from "./rigidbody.js";

export abstract class Joint extends Constraint
{
    public drawAnchor = true;
    public drawConnectionLine = true;

    constructor(bodyA: RigidBody, bodyB: RigidBody)
    {
        super(bodyA, bodyB);
    }
}