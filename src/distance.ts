import { Joint } from "./joint.js";
import { Vector2 } from "./math.js";
import { RigidBody } from "./rigidbody.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";

export class DistanceJoint extends Joint
{
    public localAnchorA: Vector2;
    public localAnchorB: Vector2;
    
    private _length: number;

    private ra!: Vector2;
    private rb!: Vector2;
    private m!: number;
    private n!: Vector2;
    private bias!: number;
    private impulseSum: number = 0.0;

    constructor(
        bodyA: RigidBody, bodyB: RigidBody,
        anchorA: Vector2 = bodyA.position, anchorB: Vector2 = bodyB.position,
        length: number = -1,
        frequency = 15, dampingRatio = 1.0, jointMass = -1
    )
    {
        super(bodyA, bodyB, frequency, dampingRatio, jointMass);

        this.localAnchorA = this.bodyA.globalToLocal.mulVector2(anchorA, 1);
        this.localAnchorB = this.bodyB.globalToLocal.mulVector2(anchorB, 1);
        this._length = length <= 0 ? anchorB.sub(anchorA).length : length;
    }

    override prepare(): void
    {
        // Calculate Jacobian J and effective mass M
        // J = [-n, -n·cross(ra), n, n·cross(rb)] ( n = (anchorB-anchorA) / ||anchorB-anchorA|| )
        // M = (J · M^-1 · J^t)^-1

        this.ra = this.bodyA.localToGlobal.mulVector2(this.localAnchorA, 0);
        this.rb = this.bodyB.localToGlobal.mulVector2(this.localAnchorB, 0);

        let pa = this.bodyA.position.add(this.ra);
        let pb = this.bodyB.position.add(this.rb);

        let u = pb.sub(pa);

        this.n = u.normalized();

        let k = this.bodyA.inverseMass + this.bodyB.inverseMass
            + this.bodyA.inverseInertia * this.n.cross(this.ra) * this.n.cross(this.ra)
            + this.bodyB.inverseInertia * this.n.cross(this.rb) * this.n.cross(this.rb)
            + this.gamma;

        this.m = 1.0 / k;

        let error = (u.length - this._length);

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

        let jv = this.bodyB.linearVelocity.add(Util.cross(this.bodyB.angularVelocity, this.rb))
            .sub(this.bodyA.linearVelocity.add(Util.cross(this.bodyA.angularVelocity, this.ra))).dot(this.n);

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

        this.bodyA.linearVelocity = this.bodyA.linearVelocity.sub(this.n.mul(lambda * this.bodyA.inverseMass));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.n.dot(Util.cross(lambda, this.ra)) * this.bodyA.inverseInertia;
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.add(this.n.mul(lambda * this.bodyB.inverseMass));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.n.dot(Util.cross(lambda, this.rb)) * this.bodyB.inverseInertia;
    }

    get length(): number
    {
        return this._length;
    }

    set length(length: number)
    {
        this._length = Util.clamp(length, 0, Number.MAX_VALUE);
    }
}