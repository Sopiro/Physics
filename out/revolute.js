import { Matrix2, Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
import { Joint } from "./joint.js";
export class RevoluteJoint extends Joint {
    constructor(bodyA, bodyB, anchor) {
        super(bodyA, bodyB);
        this.impulseSum = new Vector2();
        this.localAnchorA = this.bodyA.globalToLocal.mulVector(anchor, 1);
        this.localAnchorB = this.bodyB.globalToLocal.mulVector(anchor, 1);
    }
    prepare(delta) {
        // Calculate Jacobian J and effective mass M
        // J = [-I, -cross(ra), I, cross(rb)]
        // M = J · M^-1 · J^t
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
            this.bias = error.mulS(Settings.positionCorrectionBeta / delta);
        else
            this.bias = new Vector2(0, 0);
        if (Settings.warmStarting)
            this.applyImpulse(this.impulseSum);
    }
    solve() {
        // Calculate corrective impulse: Pc
        // Pc = J^t * λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)
        let jv = this.bodyB.linearVelocity.addV(Util.cross(this.bodyB.angularVelocity, this.rb))
            .subV(this.bodyA.linearVelocity.addV(Util.cross(this.bodyA.angularVelocity, this.ra)));
        // You don't have to clamp the impulse. It's equality constraint.
        let impulse = this.m.mulVector(jv.addV(this.bias).inverted());
        this.applyImpulse(impulse);
        if (Settings.warmStarting)
            this.impulseSum = this.impulseSum.addV(impulse);
    }
    applyImpulse(impulse) {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ
        this.bodyA.linearVelocity = this.bodyA.linearVelocity.subV(impulse.mulS(this.bodyA.inverseMass));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.bodyA.inverseInertia * this.ra.cross(impulse);
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.addV(impulse.mulS(this.bodyB.inverseMass));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.bodyB.inverseInertia * this.rb.cross(impulse);
    }
}
