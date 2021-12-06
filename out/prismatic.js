import { Joint } from "./joint.js";
import { Matrix2, Vector2 } from "./math.js";
import { Type } from "./rigidbody.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
// Line joint + Angle joint
export class PrismaticJoint extends Joint {
    constructor(bodyA, bodyB, anchorA = bodyA.position, anchorB = bodyB.position, frequency = 20000, dampingRatio = 1.0, mass = 10000) {
        super(bodyA, bodyB);
        this.impulseSum = new Vector2();
        if (bodyA.type == Type.Ground && bodyB.type == Type.Ground)
            throw "Can't make prismatic constraint between static bodies";
        if (bodyB.type == Type.Ground)
            throw "Please make prismatic constraint by using the bodyA as a static body";
        this.localAnchorA = this.bodyA.globalToLocal.mulVector2(anchorA, 1);
        this.localAnchorB = this.bodyB.globalToLocal.mulVector2(anchorB, 1);
        this.initialAngle = bodyB.rotation - bodyA.rotation;
        let u = anchorB.subV(anchorA);
        this.t = new Vector2(-u.y, u.x).normalized();
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
        // J = [-t^t, -(ra + u)×t, t^t, rb×t
        //         0,          -1,   0,    1]
        // M = (J · M^-1 · J^t)^-1
        this.ra = this.bodyA.localToGlobal.mulVector2(this.localAnchorA, 0);
        this.rb = this.bodyB.localToGlobal.mulVector2(this.localAnchorB, 0);
        let pa = this.bodyA.position.addV(this.ra);
        let pb = this.bodyB.position.addV(this.rb);
        this.u = pb.subV(pa).normalized();
        let sa = this.ra.addV(this.u).cross(this.t);
        let sb = this.rb.cross(this.t);
        let k = new Matrix2();
        k.m00 = this.bodyA.inverseMass + sa * sa * this.bodyA.inverseInertia + this.bodyB.inverseMass + sb * sb * this.bodyB.inverseInertia;
        k.m01 = sa * this.bodyA.inverseInertia + sb * this.bodyB.inverseInertia;
        k.m10 = sa * this.bodyA.inverseInertia + sb * this.bodyB.inverseInertia;
        k.m11 = this.bodyA.inverseInertia + this.bodyB.inverseInertia;
        k.m00 += this.gamma;
        k.m11 += this.gamma;
        this.m = k.inverted();
        let error0 = this.u.dot(this.t);
        let error1 = this.bodyB.rotation - this.bodyA.rotation - this.initialAngle;
        if (Settings.positionCorrection)
            this.bias = new Vector2(error0, error1).mulS(this.beta / delta);
        else
            this.bias = new Vector2();
        if (Settings.warmStarting)
            this.applyImpulse(this.impulseSum);
    }
    solve() {
        // Calculate corrective impulse: Pc
        // Pc = J^t · λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)
        let jv0 = this.t.dot(this.bodyB.linearVelocity) + this.rb.cross(this.t) * this.bodyB.angularVelocity
            - (this.t.dot(this.bodyA.linearVelocity) + this.rb.addV(this.u).cross(this.t) * this.bodyA.angularVelocity)
            + this.gamma;
        let jv1 = this.bodyB.angularVelocity - this.bodyA.angularVelocity;
        let jv = new Vector2(jv0, jv1);
        let lambda = this.m.mulVector(jv.addV(this.bias).addV(this.impulseSum.mulS(this.gamma)).inverted());
        this.applyImpulse(lambda);
        if (Settings.warmStarting)
            this.impulseSum.addV(lambda);
    }
    applyImpulse(lambda) {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ
        let lambda0 = lambda.x;
        let lambda1 = lambda.y;
        this.bodyA.linearVelocity = this.bodyA.linearVelocity.subV(this.t.mulS(lambda0 * this.bodyA.inverseMass));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.ra.addV(this.u).cross(this.t) * this.bodyA.inverseInertia;
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.addV(this.t.mulS(lambda0 * this.bodyB.inverseMass));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.rb.cross(this.t) * this.bodyB.inverseInertia;
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - lambda1 * this.bodyA.inverseInertia;
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + lambda1 * this.bodyB.inverseInertia;
    }
}
