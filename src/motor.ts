import { Matrix2, Matrix3, Vector2, Vector3 } from "./math.js";
import { RigidBody } from "./rigidbody.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
import { Joint } from "./joint.js";

// Revolute joint + Angle joint + limited force (torque)
export class MotorJoint extends Joint
{
    public localAnchorA: Vector2;
    public localAnchorB: Vector2;

    public initialAngle: number;
    public linearOffset: Vector2;
    public angularOffset: number;
    public maxForce: number;
    public maxTorque: number;

    private ra!: Vector2;
    private rb!: Vector2;
    private m0!: Matrix2;
    private m1!: number;
    private bias0!: Vector2;
    private bias1!: number;
    private linearImpulseSum: Vector2 = new Vector2();
    private angularImpulseSum: number = 0.0;

    constructor(
        bodyA: RigidBody, bodyB: RigidBody,
        anchor: Vector2 = bodyB.position,
        maxForce = 1000.0, maxTorque = 1000.0,
        frequency = 60, dampingRatio = 1.0, mass = -1
    )
    {
        super(bodyA, bodyB);
        this.linearOffset = new Vector2();
        this.initialAngle = bodyB.rotation - bodyA.rotation;
        this.angularOffset = 0.0;
        this.maxForce = maxForce;
        this.maxTorque = maxTorque;

        this.localAnchorA = this.bodyA.globalToLocal.mulVector2(anchor, 1);
        this.localAnchorB = this.bodyB.globalToLocal.mulVector2(anchor, 1);

        if (mass <= 0) mass = bodyB.mass;
        if (frequency <= 0) frequency = 0.01;
        dampingRatio = Util.clamp(dampingRatio, 0.0, 1.0);

        let omega = 2 * Math.PI * frequency;
        let d = 2 * mass * dampingRatio * omega; // Damping coefficient
        let k = mass * omega * omega; // Spring constant
        let h = Settings.dt;

        this.beta = h * k / (d + h * k);
        this.gamma = 1 / ((d + h * k) * h);

        this.drawConnectionLine = false;
    }

    override prepare()
    {
        // Calculate Jacobian J and effective mass M
        // J = [-I, -skew(ra), I, skew(rb)] // Revolute
        //     [ 0,        -1, 0,        1] // Angle
        // M = (J · M^-1 · J^t)^-1

        this.ra = this.bodyA.localToGlobal.mulVector2(this.localAnchorA, 0);
        this.rb = this.bodyB.localToGlobal.mulVector2(this.localAnchorB, 0);

        let k0 = new Matrix2();

        k0.m00 = this.bodyA.inverseMass + this.bodyB.inverseMass +
            this.bodyA.inverseInertia * this.ra.y * this.ra.y + this.bodyB.inverseInertia * this.rb.y * this.rb.y;

        k0.m01 = -this.bodyA.inverseInertia * this.ra.y * this.ra.x - this.bodyB.inverseInertia * this.rb.y * this.rb.x;

        k0.m10 = -this.bodyA.inverseInertia * this.ra.x * this.ra.y - this.bodyB.inverseInertia * this.rb.x * this.rb.y;

        k0.m11 = this.bodyA.inverseMass + this.bodyB.inverseMass
            + this.bodyA.inverseInertia * this.ra.x * this.ra.x + this.bodyB.inverseInertia * this.rb.x * this.rb.x;

        k0.m00 += this.gamma;
        k0.m11 += this.gamma;

        let k1 = (this.bodyA.inverseInertia + this.bodyB.inverseInertia + this.gamma);

        this.m0 = k0.inverted();
        this.m1 = 1.0 / k1;

        let pa = this.bodyA.position.add(this.ra);
        let pb = this.bodyB.position.add(this.rb);

        let error0 = pb.sub(pa.add(this.linearOffset));
        let error1 = this.bodyB.rotation - this.bodyA.rotation - this.initialAngle - this.angularOffset;

        if (Settings.positionCorrection)
        {
            this.bias0 = new Vector2(error0.x, error0.y).mul(this.beta * Settings.inv_dt);
            this.bias1 = error1 * this.beta * Settings.inv_dt;
        }
        else
        {
            this.bias0 = new Vector2(0, 0);
            this.bias1 = 0.0;
        }

        if (Settings.warmStarting)
            this.applyImpulse(this.linearImpulseSum, this.angularImpulseSum);
    }

    override solve()
    {
        // Calculate corrective impulse: Pc
        // Pc = J^t * λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)

        let jv0 = this.bodyB.linearVelocity.add(Util.cross(this.bodyB.angularVelocity, this.rb))
            .sub(this.bodyA.linearVelocity.add(Util.cross(this.bodyA.angularVelocity, this.ra)));
        let jv1 = this.bodyB.angularVelocity - this.bodyA.angularVelocity;

        let lambda0 = this.m0.mulVector(jv0.add(this.bias0).add(this.linearImpulseSum.mul(this.gamma)).inverted());
        let lambda1 = this.m1 * -(jv1 + this.bias1);

        // Clamp linear impulse
        {
            let maxLinearImpulse = Settings.dt * this.maxForce;
            let oldLinearImpulse = this.linearImpulseSum.copy();
            this.linearImpulseSum = this.linearImpulseSum.add(lambda0);

            if (this.linearImpulseSum.length > maxLinearImpulse)
                this.linearImpulseSum = this.linearImpulseSum.normalized().mul(maxLinearImpulse);

            lambda0 = this.linearImpulseSum.sub(oldLinearImpulse);
        }

        // Clamp angular impulse
        {
            let maxAngularImpulse = Settings.dt * this.maxTorque;
            let oldAngularImpulse = this.angularImpulseSum;
            this.angularImpulseSum += lambda1;

            this.angularImpulseSum = Util.clamp(this.angularImpulseSum, -maxAngularImpulse, maxAngularImpulse);

            lambda1 = this.angularImpulseSum - oldAngularImpulse;
        }

        this.applyImpulse(lambda0, lambda1);

        if (Settings.warmStarting)
        {
            this.linearImpulseSum = this.linearImpulseSum.add(lambda0);
            this.angularImpulseSum = this.angularImpulseSum + lambda1;
        }
    }

    protected applyImpulse(lambda01: Vector2, lambda2: number)
    {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ

        // Solve for point-to-point constraint
        this.bodyA.linearVelocity = this.bodyA.linearVelocity.sub(lambda01.mul(this.bodyA.inverseMass));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.bodyA.inverseInertia * this.ra.cross(lambda01);
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.add(lambda01.mul(this.bodyB.inverseMass));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.bodyB.inverseInertia * this.rb.cross(lambda01);

        // Solve for angle constraint
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - lambda2 * this.bodyA.inverseInertia;
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + lambda2 * this.bodyB.inverseInertia;
    }
}