import { Joint } from "./joint.js";
import { RigidBody } from "./rigidbody.js";
import { Settings } from "./settings.js";

export class AngleJoint extends Joint
{
    public initialAngleOffset: number;

    private m!: number;
    private bias!: number;
    private impulseSum: number = 0.0;

    constructor(
        bodyA: RigidBody, bodyB: RigidBody,
        frequency = 60, dampingRatio = 1.0, jointMass = -1
    )
    {
        super(bodyA, bodyB, frequency, dampingRatio, jointMass);
        
        this.initialAngleOffset = bodyB.rotation - bodyA.rotation;
    }

    override prepare(): void
    {
        // Calculate Jacobian J and effective mass M
        // J = [0 -1 0 1]
        // M = (J · M^-1 · J^t)^-1

        let k = this.bodyA.inverseInertia + this.bodyB.inverseInertia + this.gamma;

        this.m = 1.0 / k;

        let error = this.bodyB.rotation - this.bodyA.rotation - this.initialAngleOffset;

        if (Settings.positionCorrection)
            this.bias = error * this.beta * Settings.inv_dt;
        else
            this.bias = 0.0;

        if (Settings.warmStarting)
            this.applyImpulse(this.impulseSum);
    }

    override solve(): void
    {
        // Calculate corrective impulse: Pc
        // Pc = J^t · λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)

        let jv = this.bodyB.angularVelocity - this.bodyA.angularVelocity;

        // Check out below for the reason why the (accumulated impulse * gamma) term is on the right hand side
        // https://pybullet.org/Bullet/phpBB3/viewtopic.php?f=4&t=1354
        let lambda = this.m * -(jv + this.bias + this.impulseSum * this.gamma);

        this.applyImpulse(lambda);

        if (Settings.warmStarting)
            this.impulseSum += lambda;
    }

    protected override applyImpulse(lambda: number): void
    {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ

        this.bodyA.angularVelocity = this.bodyA.angularVelocity - lambda * this.bodyA.inverseInertia;
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + lambda * this.bodyB.inverseInertia;
    }
}