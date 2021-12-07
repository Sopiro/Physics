import { Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
import { Constraint } from "./constraint.js";
var ConstraintType;
(function (ConstraintType) {
    ConstraintType[ConstraintType["Normal"] = 0] = "Normal";
    ConstraintType[ConstraintType["Tangent"] = 1] = "Tangent";
})(ConstraintType || (ConstraintType = {}));
class ContactConstraintSolver {
    constructor(manifold, contactPoint) {
        this.impulseSum = 0.0; // For accumulated impulse
        this.manifold = manifold;
        this.bodyA = manifold.bodyA;
        this.bodyB = manifold.bodyB;
        this.contactPoint = contactPoint;
        this.beta = Settings.positionCorrectionBeta;
        this.restitution = this.bodyA.restitution * this.bodyB.restitution;
        this.friction = this.bodyA.friction * this.bodyB.friction;
    }
    prepare(dir, constraintType) {
        // Calculate Jacobian J and effective mass M
        // J = [-dir, -ra × dir, dir, rb × dir] (dir: Contact vector, normal or tangent)
        // M = (J · M^-1 · J^t)^-1
        this.constraintType = constraintType;
        this.ra = this.contactPoint.sub(this.bodyA.localToGlobal.mulVector2(this.bodyA.centerOfMass, 1));
        this.rb = this.contactPoint.sub(this.bodyB.localToGlobal.mulVector2(this.bodyB.centerOfMass, 1));
        this.jacobian =
            {
                va: dir.inverted(),
                wa: -this.ra.cross(dir),
                vb: dir,
                wb: this.rb.cross(dir),
            };
        this.bias = 0.0;
        if (this.constraintType == ConstraintType.Normal) {
            // Relative velocity at contact point
            let relativeVelocity = this.bodyB.linearVelocity.add(Util.cross(this.bodyB.angularVelocity, this.rb))
                .sub(this.bodyA.linearVelocity.add(Util.cross(this.bodyA.angularVelocity, this.ra)));
            let approachingVelocity = relativeVelocity.dot(this.manifold.contactNormal);
            if (Settings.positionCorrection)
                this.bias = -(this.beta * Settings.inv_dt) * Math.max(this.manifold.penetrationDepth - Settings.penetrationSlop, 0.0);
            this.bias += this.restitution * Math.min(approachingVelocity + Settings.restitutionSlop, 0.0);
            // if (approachingVelocity + Settings.restitutionSlop < 0)
            //     this.bias += this.restitution * approachingVelocity;
        }
        let k = +this.bodyA.inverseMass
            + this.jacobian.wa * this.bodyA.inverseInertia * this.jacobian.wa
            + this.bodyB.inverseMass
            + this.jacobian.wb * this.bodyB.inverseInertia * this.jacobian.wb;
        this.effectiveMass = 1.0 / k;
        // Apply the old impulse calculated in the previous time step
        if (Settings.warmStarting)
            this.applyImpulse(this.impulseSum);
    }
    solve(normalContact) {
        // Calculate corrective impulse: Pc
        // Pc = J^t * λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)
        // Jacobian * velocity vector
        let jv = +this.jacobian.va.dot(this.bodyA.linearVelocity)
            + this.jacobian.wa * this.bodyA.angularVelocity
            + this.jacobian.vb.dot(this.bodyB.linearVelocity)
            + this.jacobian.wb * this.bodyB.angularVelocity;
        let lambda = this.effectiveMass * -(jv + this.bias);
        let oldImpulseSum = this.impulseSum;
        switch (this.constraintType) {
            case ConstraintType.Normal:
                {
                    if (Settings.impulseAccumulation)
                        this.impulseSum = Math.max(0.0, this.impulseSum + lambda);
                    else
                        this.impulseSum = Math.max(0.0, lambda);
                    break;
                }
            case ConstraintType.Tangent:
                {
                    let maxFriction = this.friction * normalContact.impulseSum;
                    if (Settings.impulseAccumulation)
                        this.impulseSum = Util.clamp(this.impulseSum + lambda, -maxFriction, maxFriction);
                    else
                        this.impulseSum = Util.clamp(lambda, -maxFriction, maxFriction);
                    break;
                }
        }
        if (Settings.impulseAccumulation)
            lambda = this.impulseSum - oldImpulseSum;
        else
            lambda = this.impulseSum;
        // Apply impulse
        this.applyImpulse(lambda);
    }
    applyImpulse(lambda) {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ
        this.bodyA.linearVelocity = this.bodyA.linearVelocity.add(this.jacobian.va.mul(this.bodyA.inverseMass * lambda));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity + this.bodyA.inverseInertia * this.jacobian.wa * lambda;
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.add(this.jacobian.vb.mul(this.bodyB.inverseMass * lambda));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.bodyB.inverseInertia * this.jacobian.wb * lambda;
    }
}
export class ContactManifold extends Constraint {
    constructor(bodyA, bodyB, contactPoints, penetrationDepth, contactNormal) {
        super(bodyA, bodyB);
        this.solversN = [];
        this.solversT = [];
        this.persistent = false;
        this.contactPoints = contactPoints;
        this.penetrationDepth = penetrationDepth;
        this.contactNormal = contactNormal;
        this.contactTangent = new Vector2(-contactNormal.y, contactNormal.x);
        for (let i = 0; i < this.numContacts; i++) {
            this.solversN.push(new ContactConstraintSolver(this, contactPoints[i]));
            this.solversT.push(new ContactConstraintSolver(this, contactPoints[i]));
        }
    }
    prepare() {
        for (let i = 0; i < this.numContacts; i++) {
            this.solversN[i].prepare(this.contactNormal, ConstraintType.Normal);
            this.solversT[i].prepare(this.contactTangent, ConstraintType.Tangent);
        }
    }
    solve() {
        for (let i = 0; i < this.numContacts; i++) {
            // Order matters. To clamp friction's lambda range, you should get the normal impulse(lambda) value
            this.solversN[i].solve();
            this.solversT[i].solve(this.solversN[i]);
        }
    }
    applyImpulse() { }
    tryWarmStart(oldManifold) {
        for (let n = 0; n < this.numContacts; n++) {
            let o = 0;
            for (; o < oldManifold.numContacts; o++) {
                let dist = Util.squared_distance(this.contactPoints[n], oldManifold.contactPoints[o]);
                if (dist < Settings.warmStartingThreshold) // If contact points are close enough, warm start.
                    break;
            }
            if (o < oldManifold.numContacts) {
                this.solversN[n].impulseSum = oldManifold.solversN[o].impulseSum;
                this.solversT[n].impulseSum = oldManifold.solversT[o].impulseSum;
                this.persistent = true;
            }
        }
    }
    get numContacts() {
        return this.contactPoints.length;
    }
}
