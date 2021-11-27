import { Matrix2, Vector2 } from "./math.js";
import { RigidBody } from "./rigidbody.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
import { Constraint } from "./constraint.js";

export class RevoluteJoint extends Constraint
{
    public readonly bodyA: RigidBody;
    public readonly bodyB: RigidBody;
    public localAnchorA: Vector2;
    public localAnchorB: Vector2;
    private ra!: Vector2;
    private rb!: Vector2;

    private m!: Matrix2;
    private bias: Vector2 = new Vector2();
    private impulseSum: Vector2 = new Vector2();

    public drawAnchor = true;
    public drawAnchorOnly = false;
    public motor = false;

    constructor(bodyA: RigidBody, bodyB: RigidBody, anchor: Vector2)
    {
        super();
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.localAnchorA = this.bodyA.globalToLocal.mulVector(anchor.subV(this.bodyA.position), 0);
        this.localAnchorB = this.bodyB.globalToLocal.mulVector(anchor.subV(this.bodyB.position), 0);
    }

    override prepare(delta: number)
    {
        this.ra = this.bodyA.localToGlobal.mulVector(this.localAnchorA, 0);
        this.rb = this.bodyB.localToGlobal.mulVector(this.localAnchorB, 0);

        let k = new Matrix2();

        k.m00 = this.bodyA.inverseMass + this.bodyB.inverseMass +
            this.bodyA.inverseInertia * this.ra.y * this.ra.y + this.bodyB.inverseInertia * this.rb.y * this.rb.y;

        k.m01 = -this.bodyA.inverseInertia * this.ra.y * this.ra.x - this.bodyB.inverseInertia * this.rb.y * this.rb.x;

        k.m10 = -this.bodyA.inverseInertia * this.ra.x * this.ra.y - this.bodyB.inverseInertia * this.rb.x * this.rb.y;

        k.m11 = this.bodyA.inverseMass + this.bodyB.inverseMass
            + this.bodyA.inverseInertia * this.ra.x * this.ra.x + this.bodyB.inverseInertia * this.rb.x * this.rb.x;

        this.m = k.inverted();

        let pa = this.bodyA.position.addV(this.ra);
        let pb = this.bodyB.position.addV(this.rb);

        let error = pb.subV(pa);

        if (Settings.positionCorrection)
        {
            this.bias = error.mulS(Settings.positionCorrectionBeta / delta);
        }

        if (Settings.warmStarting)
        {
            this.bodyA.linearVelocity = this.bodyA.linearVelocity.subV(this.impulseSum.mulS(this.bodyA.inverseMass));
            this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.bodyA.inverseInertia * this.ra.cross(this.impulseSum);
            this.bodyB.linearVelocity = this.bodyB.linearVelocity.addV(this.impulseSum.mulS(this.bodyB.inverseMass));
            this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.bodyB.inverseInertia * this.rb.cross(this.impulseSum);
        }
    }

    override solve()
    {
        // Calculate corrective impulse: λ
        // λ = (J * M^-1 * J^t)^-1 * -(Jv+b)

        let jv: Vector2 = this.bodyB.linearVelocity.addV(Util.cross(this.bodyB.angularVelocity, this.rb))
            .subV(this.bodyA.linearVelocity.addV(Util.cross(this.bodyA.angularVelocity, this.ra)));

        // You don't have to clamp the impulse. It's equality constraint.
        let impulse = this.m.mulVector(jv.addV(this.bias).inverted());

        impulse.mulS(0.7);

        this.bodyA.linearVelocity = this.bodyA.linearVelocity.subV(impulse.mulS(this.bodyA.inverseMass));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.bodyA.inverseInertia * this.ra.cross(impulse);
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.addV(impulse.mulS(this.bodyB.inverseMass));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.bodyB.inverseInertia * this.rb.cross(impulse);

        if (Settings.warmStarting)
            this.impulseSum = this.impulseSum.addV(impulse);
    }
}