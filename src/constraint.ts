import { Vector2, Vector3 } from "./math.js";
import { RigidBody } from "./rigidbody.js";

export abstract class Constraint
{
    public readonly bodyA: RigidBody;
    public readonly bodyB: RigidBody;

    protected beta = 0.0; // Coefficient of position correction (Positional error feedback factor)
    protected gamma = 0.0; // Coefficient of Softness (Force feedback factor)

    constructor(bodyA: RigidBody, bodyB: RigidBody)
    {
        this.bodyA = bodyA;
        this.bodyB = bodyB;
    }

    // Calculate Jacobian J and effective mass M
    // J = (depend on constraint)
    // M = (J · M^-1 · J^t)^-1
    public abstract prepare(): void;

    // Solve velocity constraint by applying corrective impulse
    // Corrective impulse: Pc
    // Pc = J^t * λ (λ: lagrangian multiplier)
    // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)
    public abstract solve(): void;

    // Apply impulse
    // V2 = V2' + M^-1 ⋅ Pc
    // Pc = J^t ⋅ λ
    protected abstract applyImpulse(impulse: number | Vector2 | Vector3, impulse2?: number): void;
}