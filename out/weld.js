import { Matrix3, Vector2, Vector3 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
import { Joint } from "./joint.js";
// Revolute joint + Angle joint
export class WeldJoint extends Joint {
    constructor(bodyA, bodyB, anchor = Util.mid(bodyA.position, bodyB.position), frequency = -1, dampingRatio = 1.0, jointMass = -1) {
        super(bodyA, bodyB, frequency, dampingRatio, jointMass);
        this.impulseSum = new Vector3();
        this.initialAngleOffset = bodyB.rotation - bodyA.rotation;
        this.localAnchorA = this.bodyA.globalToLocal.mulVector2(anchor, 1);
        this.localAnchorB = this.bodyB.globalToLocal.mulVector2(anchor, 1);
        this.drawAnchor = false;
        this.drawConnectionLine = false;
    }
    prepare() {
        // Calculate Jacobian J and effective mass M
        // J = [-I, -skew(ra), I, skew(rb)] // Revolute
        //     [ 0,        -1, 0,        1] // Angle
        // M = (J · M^-1 · J^t)^-1
        this.ra = this.bodyA.localToGlobal.mulVector2(this.localAnchorA, 0);
        this.rb = this.bodyB.localToGlobal.mulVector2(this.localAnchorB, 0);
        let k = new Matrix3();
        k.m00 = this.bodyA.inverseMass + this.bodyB.inverseMass +
            this.bodyA.inverseInertia * this.ra.y * this.ra.y + this.bodyB.inverseInertia * this.rb.y * this.rb.y;
        k.m01 = -this.bodyA.inverseInertia * this.ra.y * this.ra.x - this.bodyB.inverseInertia * this.rb.y * this.rb.x;
        k.m10 = -this.bodyA.inverseInertia * this.ra.x * this.ra.y - this.bodyB.inverseInertia * this.rb.x * this.rb.y;
        k.m11 = this.bodyA.inverseMass + this.bodyB.inverseMass
            + this.bodyA.inverseInertia * this.ra.x * this.ra.x + this.bodyB.inverseInertia * this.rb.x * this.rb.x;
        k.m02 = -this.bodyA.inverseInertia * this.ra.y - this.bodyB.inverseInertia * this.rb.y;
        k.m12 = this.bodyA.inverseInertia * this.ra.x + this.bodyB.inverseInertia * this.rb.x;
        k.m20 = -this.bodyA.inverseInertia * this.ra.y - this.bodyB.inverseInertia * this.rb.y;
        k.m21 = this.bodyA.inverseInertia * this.ra.x + this.bodyB.inverseInertia * this.rb.x;
        k.m22 = this.bodyA.inverseInertia + this.bodyB.inverseInertia;
        k.m00 += this.gamma;
        k.m11 += this.gamma;
        k.m22 += this.gamma;
        this.m = k.inverted();
        let pa = this.bodyA.position.add(this.ra);
        let pb = this.bodyB.position.add(this.rb);
        let error01 = pb.sub(pa);
        let error2 = this.bodyB.rotation - this.bodyA.rotation - this.initialAngleOffset;
        if (Settings.positionCorrection)
            this.bias = new Vector3(error01.x, error01.y, error2).mul(this.beta * Settings.inv_dt);
        else
            this.bias = new Vector3(0.0, 0.0, 0.0);
        if (Settings.warmStarting)
            this.applyImpulse(this.impulseSum);
    }
    solve() {
        // Calculate corrective impulse: Pc
        // Pc = J^t * λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)
        let jv01 = this.bodyB.linearVelocity.add(Util.cross(this.bodyB.angularVelocity, this.rb))
            .sub(this.bodyA.linearVelocity.add(Util.cross(this.bodyA.angularVelocity, this.ra)));
        let jv2 = this.bodyB.angularVelocity - this.bodyA.angularVelocity;
        let jv = new Vector3(jv01.x, jv01.y, jv2);
        let lambda = this.m.mulVector3(jv.add(this.bias).add(this.impulseSum.mul(this.gamma)).inverted());
        this.applyImpulse(lambda);
        if (Settings.warmStarting)
            this.impulseSum = this.impulseSum.add(lambda);
    }
    applyImpulse(lambda) {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ
        let lambda01 = new Vector2(lambda.x, lambda.y);
        let lambda2 = lambda.z;
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
