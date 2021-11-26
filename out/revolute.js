import { Matrix2, Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
import { Constraint } from "./constraint.js";
export class RevoluteJoint extends Constraint {
    constructor(bodyA, bodyB, anchor) {
        super();
        this.bias = new Vector2();
        this.impulseSum = new Vector2();
        this.drawAnchorOnly = false;
        this.motor = false;
        this.a = bodyA;
        this.b = bodyB;
        this.localAnchorA = this.a.globalToLocal.mulVector(anchor.subV(this.a.position), 0);
        this.localAnchorB = this.b.globalToLocal.mulVector(anchor.subV(this.b.position), 0);
    }
    prepare(delta) {
        this.ra = this.a.localToGlobal.mulVector(this.localAnchorA, 0);
        this.rb = this.b.localToGlobal.mulVector(this.localAnchorB, 0);
        let k = new Matrix2();
        k.m00 = this.a.inverseMass + this.b.inverseMass +
            this.a.inverseInertia * this.ra.y * this.ra.y + this.b.inverseInertia * this.rb.y * this.rb.y;
        k.m01 = -this.a.inverseInertia * this.ra.y * this.ra.x - this.b.inverseInertia * this.rb.y * this.rb.x;
        k.m10 = -this.a.inverseInertia * this.ra.x * this.ra.y - this.b.inverseInertia * this.rb.x * this.rb.y;
        k.m11 = this.a.inverseMass + this.b.inverseMass
            + this.a.inverseInertia * this.ra.x * this.ra.x + this.b.inverseInertia * this.rb.x * this.rb.x;
        this.m = k.inverted();
        let pa = this.a.position.addV(this.ra);
        let pb = this.b.position.addV(this.rb);
        let error = pb.subV(pa);
        if (Settings.positionCorrection) {
            this.bias = error.mulS(Settings.positionCorrectionBeta / delta);
        }
        if (Settings.warmStarting) {
            this.a.linearVelocity = this.a.linearVelocity.subV(this.impulseSum.mulS(this.a.inverseMass));
            this.a.angularVelocity = this.a.angularVelocity - this.a.inverseInertia * this.ra.cross(this.impulseSum);
            this.b.linearVelocity = this.b.linearVelocity.addV(this.impulseSum.mulS(this.b.inverseMass));
            this.b.angularVelocity = this.b.angularVelocity + this.b.inverseInertia * this.rb.cross(this.impulseSum);
        }
    }
    solve() {
        // Calculate corrective impulse: λ
        // λ = (J * M^-1 * J^t)^-1 * -(Jv+b)
        let jv = this.b.linearVelocity.addV(Util.cross(this.b.angularVelocity, this.rb))
            .subV(this.a.linearVelocity.addV(Util.cross(this.a.angularVelocity, this.ra)));
        let impulse = this.m.mulVector(jv.addV(this.bias).inverted());
        this.a.linearVelocity = this.a.linearVelocity.subV(impulse.mulS(this.a.inverseMass));
        this.a.angularVelocity = this.a.angularVelocity - this.a.inverseInertia * this.ra.cross(impulse);
        this.b.linearVelocity = this.b.linearVelocity.addV(impulse.mulS(this.b.inverseMass));
        this.b.angularVelocity = this.b.angularVelocity + this.b.inverseInertia * this.rb.cross(impulse);
        if (Settings.impulseAccumulation) {
            // You don't have to clamp the impulse. It's equality constraint.
            this.impulseSum = this.impulseSum.addV(impulse);
        }
    }
}
