import { Matrix2, Vector2 } from "./math.js";
import { RigidBody } from "./rigidbody.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
import { Joint } from "./joint.js";

export class RevoluteJoint extends Joint
{
    public localAnchorA: Vector2;
    public localAnchorB: Vector2;

    private ra!: Vector2;
    private rb!: Vector2;
    private m!: Matrix2;
    private bias!: Vector2;
    private impulseSum: Vector2 = new Vector2();

    private beta;
    private gamma; // Softness

    constructor(bodyA: RigidBody, bodyB: RigidBody, anchor: Vector2,
        frequency = 15, dampingRatio = 1.0, mass = -1)
    {
        super(bodyA, bodyB);
        this.localAnchorA = this.bodyA.globalToLocal.mulVector2(anchor, 1);
        this.localAnchorB = this.bodyB.globalToLocal.mulVector2(anchor, 1);

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

    override prepare(delta: number)
    {
        // Calculate Jacobian J and effective mass M
        // J = [-I, -cross(ra), I, cross(rb)]
        // M = (J · M^-1 · J^t)^-1

        this.ra = this.bodyA.localToGlobal.mulVector2(this.localAnchorA, 0);
        this.rb = this.bodyB.localToGlobal.mulVector2(this.localAnchorB, 0);

        let k = new Matrix2();

        k.m00 = this.bodyA.inverseMass + this.bodyB.inverseMass +
            this.bodyA.inverseInertia * this.ra.y * this.ra.y + this.bodyB.inverseInertia * this.rb.y * this.rb.y;

        k.m01 = -this.bodyA.inverseInertia * this.ra.y * this.ra.x - this.bodyB.inverseInertia * this.rb.y * this.rb.x;

        k.m10 = -this.bodyA.inverseInertia * this.ra.x * this.ra.y - this.bodyB.inverseInertia * this.rb.x * this.rb.y;

        k.m11 = this.bodyA.inverseMass + this.bodyB.inverseMass
            + this.bodyA.inverseInertia * this.ra.x * this.ra.x + this.bodyB.inverseInertia * this.rb.x * this.rb.x;

        k.m00 += this.gamma;
        k.m11 += this.gamma;

        this.m = k.inverted();

        let pa = this.bodyA.position.addV(this.ra);
        let pb = this.bodyB.position.addV(this.rb);

        let error = pb.subV(pa);

        if (Settings.positionCorrection)
            this.bias = error.mulS(this.beta / delta);
        else
            this.bias = new Vector2(0, 0);

        if (Settings.warmStarting)
            this.applyImpulse(this.impulseSum);
    }

    override solve()
    {
        // Calculate corrective impulse: Pc
        // Pc = J^t * λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)

        let jv: Vector2 = this.bodyB.linearVelocity.addV(Util.cross(this.bodyB.angularVelocity, this.rb))
            .subV(this.bodyA.linearVelocity.addV(Util.cross(this.bodyA.angularVelocity, this.ra)));

        // You don't have to clamp the impulse. It's equality constraint.
        let lambda = this.m.mulVector(jv.addV(this.bias).addV(this.impulseSum.mulS(this.gamma)).inverted());

        this.applyImpulse(lambda);

        if (Settings.warmStarting)
            this.impulseSum = this.impulseSum.addV(lambda);
    }

    protected override applyImpulse(lambda: Vector2)
    {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ

        this.bodyA.linearVelocity = this.bodyA.linearVelocity.subV(lambda.mulS(this.bodyA.inverseMass));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.bodyA.inverseInertia * this.ra.cross(lambda);
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.addV(lambda.mulS(this.bodyB.inverseMass));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.bodyB.inverseInertia * this.rb.cross(lambda);
    }
}