import { Joint } from "./joint.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
export class AngleJoint extends Joint {
    constructor(bodyA, bodyB, frequency = Infinity, dampingRatio = 1.0, mass = -1) {
        super(bodyA, bodyB);
        this.impulseSum = 0;
        if (mass <= 0)
            mass = bodyB.mass;
        if (frequency <= 0)
            frequency = 0.01;
        dampingRatio = Util.clamp(dampingRatio, 0.0, 1.0);
        let omega = 2 * Math.PI * frequency;
        let d = 2 * mass * dampingRatio * omega; // Damping coefficient
        let k = mass * omega * omega; // Spring constant
        let h = Settings.fixedDeltaTime;
        this.gamma = 1 / ((d + h * k) * h);
    }
    prepare(delta) {
        // Calculate Jacobian J and effective mass M
        // J = [0 -1 0 1]
        // M = J · M^-1 · J^t
        let k = this.bodyA.inverseInertia + this.bodyB.inverseInertia + this.gamma;
        this.m = 1.0 / k;
        if (Settings.warmStarting)
            this.applyImpulse(this.impulseSum);
    }
    solve() {
        // Calculate corrective impulse: Pc
        // Pc = J^t · λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)
        let jv = this.bodyB.angularVelocity - this.bodyA.angularVelocity;
        // Check out below for the reason why the (accumulated impulse * gamma) term is on the right hand side
        // https://pybullet.org/Bullet/phpBB3/viewtopic.php?f=4&t=1354
        let lambda = this.m * -(jv + this.impulseSum * this.gamma);
        this.applyImpulse(lambda);
        if (Settings.warmStarting)
            this.impulseSum += lambda;
    }
    applyImpulse(lambda) {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ
        this.bodyA.angularVelocity = this.bodyA.angularVelocity - lambda * this.bodyA.inverseInertia;
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + lambda * this.bodyB.inverseInertia;
    }
}
