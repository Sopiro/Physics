import { Joint } from "./joint.js";
import { Vector2 } from "./math.js";
import { RigidBody } from "./rigidbody.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";

export class DistanceJoint extends Joint
{
    public localAnchorA: Vector2;
    public localAnchorB: Vector2;
    public length;
    private ra!: Vector2;
    private rb!: Vector2;

    private k!: number;
    private n!: Vector2;
    private bias!: number;
    private impulseSum: number = 0;

    constructor(bodyA: RigidBody, bodyB: RigidBody, anchorA: Vector2, anchorB: Vector2, length: number = -1)
    {
        super(bodyA, bodyB);
        this.localAnchorA = this.bodyA.globalToLocal.mulVector(anchorA, 1);
        this.localAnchorB = this.bodyB.globalToLocal.mulVector(anchorB, 1);
        if (length < 0)
            this.length = anchorB.subV(anchorA).length;
        else
            this.length = length;
    }

    override prepare(delta: number): void
    {
        this.ra = this.bodyA.localToGlobal.mulVector(this.localAnchorA, 0);
        this.rb = this.bodyB.localToGlobal.mulVector(this.localAnchorB, 0);

        let pa = this.bodyA.position.addV(this.ra);
        let pb = this.bodyB.position.addV(this.rb);

        let u = pb.subV(pa);

        this.n = u.normalized();

        this.k = this.bodyA.inverseMass + this.bodyB.inverseMass
            + this.bodyA.inverseInertia * this.n.cross(this.ra) * this.n.cross(this.ra)
            + this.bodyB.inverseInertia * this.n.cross(this.rb) * this.n.cross(this.rb);

        let error = (u.length - this.length) / 2;

        if (Settings.positionCorrection)
            this.bias = error * Settings.positionCorrectionBeta / delta;
        else
            this.bias = 0;

        if (Settings.warmStarting)
        {
            this.impulseSum *= 0.5;
            this.bodyA.linearVelocity = this.bodyA.linearVelocity.subV(this.n.mulS(this.impulseSum * this.bodyA.inverseMass));
            this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.n.dot(this.ra.normal) * this.impulseSum * this.bodyA.inverseInertia;
            this.bodyB.linearVelocity = this.bodyB.linearVelocity.addV(this.n.mulS(this.impulseSum * this.bodyB.inverseMass));
            this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.n.dot(this.rb.normal) * this.impulseSum * this.bodyB.inverseInertia;
        }
    }

    override solve(): void
    {
        // Calculate corrective impulse: λ
        // λ = (J * M^-1 * J^t)^-1 * -(Jv+b)

        let jv = this.bodyB.linearVelocity.addV(Util.cross(this.bodyB.angularVelocity, this.rb))
            .subV(this.bodyA.linearVelocity.addV(Util.cross(this.bodyA.angularVelocity, this.ra))).dot(this.n);

        let impulse = -(jv + this.bias) / this.k;

        this.bodyA.linearVelocity = this.bodyA.linearVelocity.subV(this.n.mulS(impulse * this.bodyA.inverseMass));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.n.dot(this.ra.normal) * impulse * this.bodyA.inverseInertia;
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.addV(this.n.mulS(impulse * this.bodyB.inverseMass));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.n.dot(this.rb.normal) * impulse * this.bodyB.inverseInertia;

        if (Settings.warmStarting)
            this.impulseSum += impulse;
    }
}