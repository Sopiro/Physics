import { Joint } from "./joint.js";
import { Vector2 } from "./math.js";
import { RigidBody, Type } from "./rigidbody.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";

export class LineJoint extends Joint
{
    public localAnchorA: Vector2;
    public localAnchorB: Vector2;
    private t: Vector2;

    private ra!: Vector2;
    private rb!: Vector2;

    private m!: number;
    private u!: Vector2;
    private bias!: number;
    private impulseSum: number = 0;

    private beta;
    private gamma; // Softness

    constructor(bodyA: RigidBody, bodyB: RigidBody, anchorA: Vector2 = bodyA.position, anchorB: Vector2 = bodyB.position,
        frequency = 15, dampingRatio = 1.0, mass = -1)
    {
        super(bodyA, bodyB);

        if (bodyA.type == Type.Ground && bodyB.type == Type.Ground)
            throw "Can't make line constraint between static bodies";
        if (bodyB.type == Type.Ground)
            throw "Please make line constraint by using the bodyA as a static body"

        this.localAnchorA = this.bodyA.globalToLocal.mulVector2(anchorA, 1);
        this.localAnchorB = this.bodyB.globalToLocal.mulVector2(anchorB, 1);

        let u = anchorB.subV(anchorA);
        this.t = new Vector2(-u.y, u.x).normalized();

        if (mass <= 0) mass = bodyB.mass;
        if (frequency <= 0) frequency = 0.01;
        dampingRatio = Util.clamp(dampingRatio, 0.0, 1.0);

        let omega = 2 * Math.PI * frequency;
        let d = 2 * mass * dampingRatio * omega; // Damping coefficient
        let k = mass * omega * omega; // Spring constant
        let h = Settings.fixedDeltaTime;

        this.beta = h * k / (d + h * k);
        this.gamma = 1 / ((d + h * k) * h);
    }

    override prepare(delta: number): void
    {
        // Calculate Jacobian J and effective mass M
        // J = [-t^t, -(ra + u)×t, t^t, rb×t]
        // M = (J · M^-1 · J^t)^-1

        this.ra = this.bodyA.localToGlobal.mulVector2(this.localAnchorA, 0);
        this.rb = this.bodyB.localToGlobal.mulVector2(this.localAnchorB, 0);

        let pa = this.bodyA.position.addV(this.ra);
        let pb = this.bodyB.position.addV(this.rb);

        this.u = pb.subV(pa).normalized();

        let k = this.bodyB.inverseMass + this.rb.cross(this.t) * this.bodyB.inverseInertia
            - this.bodyA.inverseMass - this.ra.addV(this.u).cross(this.t) * this.bodyA.inverseInertia;

        this.m = 1.0 / k;

        let error = 0;

        if (Settings.positionCorrection)
            this.bias = error * this.beta / delta;
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

        let jv = this.t.dot(this.bodyB.linearVelocity) + this.rb.cross(this.t) * this.bodyB.angularVelocity
            - (this.t.dot(this.bodyA.linearVelocity) + this.rb.addV(this.u).cross(this.t) * this.bodyA.angularVelocity);

        let lambda = this.m * -(jv);

        this.applyImpulse(lambda);

        if (Settings.warmStarting)
            this.impulseSum += lambda;
    }

    protected override applyImpulse(lambda: number): void
    {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ

        this.bodyA.linearVelocity = this.bodyA.linearVelocity.subV(this.t.mulS(lambda * this.bodyA.inverseMass));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.ra.addV(this.u).cross(this.t) * this.bodyA.inverseInertia;
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.addV(this.t.mulS(lambda * this.bodyB.inverseMass));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.rb.cross(this.t) * this.bodyB.inverseInertia;
    }
}