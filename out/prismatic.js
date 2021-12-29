import { Joint } from "./joint.js";
import { Matrix2, Vector2 } from "./math.js";
import { Type } from "./rigidbody.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
// Line joint + Angle joint
export class PrismaticJoint extends Joint {
    constructor(bodyA, bodyB, anchorA = bodyA.position, anchorB = bodyB.position, dir, frequency = 30, dampingRatio = 1.0, jointMass = -1) {
        super(bodyA, bodyB, frequency, dampingRatio, jointMass);
        this.impulseSum = new Vector2();
        if (bodyA.type == Type.Static && bodyB.type == Type.Static)
            throw "Can't make prismatic constraint between static bodies";
        if (bodyA.type == Type.Dynamic && bodyB.type == Type.Dynamic)
            throw "Can't make prismatic constraint between dynamic bodies";
        if (bodyB.type == Type.Static)
            throw "Please make prismatic constraint by using the bodyA as a static body";
        this.localAnchorA = this.bodyA.globalToLocal.mulVector2(anchorA, 1);
        this.localAnchorB = this.bodyB.globalToLocal.mulVector2(anchorB, 1);
        this.initialAngle = bodyB.rotation - bodyA.rotation;
        if (dir == undefined) {
            let u = anchorB.sub(anchorA);
            this.t = new Vector2(-u.y, u.x).normalized();
        }
        else {
            this.t = new Vector2(-dir.y, dir.x).normalized();
        }
        Util.assert(this.t.squaredLength > 0);
    }
    prepare() {
        // Calculate Jacobian J and effective mass M
        // J = [-t^t, -(ra + u)×t, t^t, rb×t] // Line 
        //     [   0,          -1,   0,    1] // Angle
        // M = (J · M^-1 · J^t)^-1
        this.ra = this.bodyA.localToGlobal.mulVector2(this.localAnchorA, 0);
        this.rb = this.bodyB.localToGlobal.mulVector2(this.localAnchorB, 0);
        let pa = this.bodyA.position.add(this.ra);
        let pb = this.bodyB.position.add(this.rb);
        this.u = pb.sub(pa);
        let sa = this.ra.add(this.u).cross(this.t);
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
            this.bias = new Vector2(error0, error1).mul(this.beta * Settings.inv_dt);
        else
            this.bias = new Vector2(0.0, 0.0);
        if (Settings.warmStarting)
            this.applyImpulse(this.impulseSum);
    }
    solve() {
        // Calculate corrective impulse: Pc
        // Pc = J^t · λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)
        let jv0 = this.t.dot(this.bodyB.linearVelocity) + this.rb.cross(this.t) * this.bodyB.angularVelocity
            - (this.t.dot(this.bodyA.linearVelocity) + this.rb.add(this.u).cross(this.t) * this.bodyA.angularVelocity)
            + this.gamma;
        let jv1 = this.bodyB.angularVelocity - this.bodyA.angularVelocity;
        let jv = new Vector2(jv0, jv1);
        let lambda = this.m.mulVector(jv.add(this.bias).add(this.impulseSum.mul(this.gamma)).inverted());
        this.applyImpulse(lambda);
        if (Settings.warmStarting)
            this.impulseSum.add(lambda);
    }
    applyImpulse(lambda) {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ
        let lambda0 = lambda.x;
        let lambda1 = lambda.y;
        this.bodyA.linearVelocity = this.bodyA.linearVelocity.sub(this.t.mul(lambda0 * this.bodyA.inverseMass));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - this.ra.add(this.u).cross(this.t) * this.bodyA.inverseInertia;
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.add(this.t.mul(lambda0 * this.bodyB.inverseMass));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.rb.cross(this.t) * this.bodyB.inverseInertia;
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - lambda1 * this.bodyA.inverseInertia;
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + lambda1 * this.bodyB.inverseInertia;
    }
}
