import { Joint } from "./joint.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
export class DistanceJoint extends Joint {
    constructor(bodyA, bodyB, anchorA, anchorB, length = -1) {
        super(bodyA, bodyB);
        this.impulseSum = 0;
        this.localAnchorA = this.bodyA.globalToLocal.mulVector(anchorA, 1);
        this.localAnchorB = this.bodyB.globalToLocal.mulVector(anchorB, 1);
        if (length < 0)
            this.length = anchorB.subV(anchorA).length;
        else
            this.length = length;
    }
    prepare(delta) {
        this.ra = this.bodyA.localToGlobal.mulVector(this.localAnchorA, 0);
        this.rb = this.bodyB.localToGlobal.mulVector(this.localAnchorB, 0);
        let pa = this.bodyA.position.addV(this.ra);
        let pb = this.bodyB.position.addV(this.rb);
        let u = pb.subV(pa);
        this.n = u.normalized();
        this.k = this.bodyA.inverseMass + this.bodyB.inverseMass
            + this.bodyA.inverseInertia * this.n.cross(this.ra) * this.n.cross(this.ra)
            + this.bodyB.inverseInertia * this.n.cross(this.rb) * this.n.cross(this.rb);
        let error = (u.length - this.length);
        if (Settings.positionCorrection)
            this.bias = error * Settings.positionCorrectionBeta / delta;
        else
            this.bias = 0;
        if (Settings.warmStarting) {
            this.impulseSum *= 0.5;
            this.applyImpulse(this.impulseSum);
        }
    }
    solve() {
        // Calculate corrective impulse: λ
        // λ = (J * M^-1 * J^t)^-1 * -(Jv+b)
        let jv = this.bodyB.linearVelocity.addV(Util.cross(this.bodyB.angularVelocity, this.rb))
            .subV(this.bodyA.linearVelocity.addV(Util.cross(this.bodyA.angularVelocity, this.ra))).dot(this.n);
        let impulse = -(jv + this.bias) / this.k;
        this.applyImpulse(impulse);
        if (Settings.warmStarting)
            this.impulseSum += impulse;
    }
    applyImpulse(impulse) {
        this.bodyA.linearVelocity = this.bodyA.linearVelocity.subV(this.n.mulS(impulse * this.bodyA.inverseMass));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.n.dot(this.ra.normal) * impulse * this.bodyA.inverseInertia;
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.addV(this.n.mulS(impulse * this.bodyB.inverseMass));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.n.dot(this.rb.normal) * impulse * this.bodyB.inverseInertia;
    }
}
