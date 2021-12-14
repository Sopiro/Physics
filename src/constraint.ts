import { Vector2, Vector3 } from "./math.js";
import { RigidBody } from "./rigidbody.js";

// Children: ContactManifold, Joint
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

    /*
    * C: Constraint equation
    * C = J·v = 0
    * J is depend on constraint
    *
    * Calculate Jacobian J and effective mass M
    * M = K^-1 = (J · M^-1 · J^t)^-1 
    */
    public abstract prepare(): void;

    /*
    * Solve velocity constraint, calculate corrective impulse for current iteration
    * Pc: Corrective impulse
    * λ: lagrangian multiplier
    * 
    * Pc = J^t · λ (∵ Pc ∥ J^t)
    * λ = (J · M^-1 · J^t)^-1 ⋅ -(Jv + (β/h)·C(x)) where C(x): positional error
    * 
    * with soft constraint,
    * λ = (J · M^-1 · J^t + λ·I)^-1 ⋅ -( Jv + (β/h)·C(x) + (γ/h)·λ' ) where I = identity matrix and λ' = accumulated impulse
    * 
    * More reading:
    * https://pybullet.org/Bullet/phpBB3/viewtopic.php?f=4&t=1354
    */
    public abstract solve(): void;

    /* 
    * Apply impulse
    * V2 = V2' + M^-1 ⋅ Pc
    * Pc = J^t ⋅ λ
    * 
    * More reading:
    * https://box2d.org/files/ErinCatto_ModelingAndSolvingConstraints_GDC2009.pdf
    */
    protected abstract applyImpulse(impulse: number | Vector2 | Vector3, impulse2?: number): void;
}