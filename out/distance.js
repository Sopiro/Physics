import { Joint } from "./joint.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
export class DistanceJoint extends Joint {
    constructor(bodyA, bodyB, anchorA = bodyA.position, anchorB = bodyB.position, length = -1, frequency = 15, dampingRatio = 1.0, mass = -1) {
        super(bodyA, bodyB);
        this.impulseSum = 0;
        this.localAnchorA = this.bodyA.globalToLocal.mulVector2(anchorA, 1);
        this.localAnchorB = this.bodyB.globalToLocal.mulVector2(anchorB, 1);
        this.length = length <= 0 ? anchorB.subV(anchorA).length : length;
        if (mass <= 0)
            mass = bodyB.mass;
        if (frequency <= 0)
            frequency = 0.01;
        dampingRatio = Util.clamp(dampingRatio, 0.0, 1.0);
        let omega = 2 * Math.PI * frequency;
        let d = 2 * mass * dampingRatio * omega; // Damping coefficient
        let k = mass * omega * omega; // Spring constant
        let h = Settings.fixedDeltaTime;
        this.beta = h * k / (d + h * k);
        this.gamma = 1 / ((d + h * k) * h);
    }
    prepare(delta) {
        // Calculate Jacobian J and effective mass M
        // J = [-n, -n·cross(ra), n, n·cross(rb)] ( n = (anchorB-anchorA) / ||anchorB-anchorA|| )
        // M = (J · M^-1 · J^t)^-1
        this.ra = this.bodyA.localToGlobal.mulVector2(this.localAnchorA, 0);
        this.rb = this.bodyB.localToGlobal.mulVector2(this.localAnchorB, 0);
        let pa = this.bodyA.position.addV(this.ra);
        let pb = this.bodyB.position.addV(this.rb);
        let u = pb.subV(pa);
        this.n = u.normalized();
        let k = this.bodyA.inverseMass + this.bodyB.inverseMass
            + this.bodyA.inverseInertia * this.n.cross(this.ra) * this.n.cross(this.ra)
            + this.bodyB.inverseInertia * this.n.cross(this.rb) * this.n.cross(this.rb)
            + this.gamma;
        this.m = 1.0 / k;
        let error = (u.length - this.length);
        if (Settings.positionCorrection)
            this.bias = error * this.beta / delta;
        else
            this.bias = 0.0;
        if (Settings.warmStarting)
            this.applyImpulse(this.impulseSum);
    }
    solve() {
        // Calculate corrective impulse: Pc
        // Pc = J^t · λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)
        let jv = this.bodyB.linearVelocity.addV(Util.cross(this.bodyB.angularVelocity, this.rb))
            .subV(this.bodyA.linearVelocity.addV(Util.cross(this.bodyA.angularVelocity, this.ra))).dot(this.n);
        // Check out below for the reason why the (accumulated impulse * gamma) term is on the right hand side
        // https://pybullet.org/Bullet/phpBB3/viewtopic.php?f=4&t=1354
        let lambda = this.m * -(jv + this.bias + this.impulseSum * this.gamma);
        this.applyImpulse(lambda);
        if (Settings.warmStarting)
            this.impulseSum += lambda;
    }
    applyImpulse(lambda) {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ
        this.bodyA.linearVelocity = this.bodyA.linearVelocity.subV(this.n.mulS(lambda * this.bodyA.inverseMass));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.n.dot(Util.cross(lambda, this.ra)) * this.bodyA.inverseInertia;
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.addV(this.n.mulS(lambda * this.bodyB.inverseMass));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.n.dot(Util.cross(lambda, this.rb)) * this.bodyB.inverseInertia;
    }
}
