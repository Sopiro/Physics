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
        this.bias = 0.0;
        this.impulseSum = 0.0; // For accumulated impulse
        this.manifold = manifold;
        this.a = manifold.bodyA;
        this.b = manifold.bodyB;
        this.contactPoint = contactPoint;
        this.ra = this.contactPoint.subV(this.a.localToGlobal.mulVector(this.a.centerOfMass, 1));
        this.rb = this.contactPoint.subV(this.b.localToGlobal.mulVector(this.b.centerOfMass, 1));
    }
    prepare(dir, constraintType, delta) {
        // Calculate Jacobian J and effective mass M
        // J = [-dir, -ra × dir, dir, rb × dir] (dir: Contact vector, normal or tangent)
        // M = J · M^-1 · J^t
        this.constraintType = constraintType;
        this.beta = Settings.positionCorrectionBeta;
        this.restitution = this.a.restitution * this.b.restitution;
        this.friction = this.a.friction * this.b.friction;
        this.jacobian = {
            va: dir.inverted(),
            wa: -this.ra.cross(dir),
            vb: dir,
            wb: this.rb.cross(dir),
        };
        if (this.constraintType == ConstraintType.Normal) {
            // Relative velocity at contact point
            let relativeVelocity = this.b.linearVelocity.addV(Util.cross(this.b.angularVelocity, this.rb))
                .subV(this.a.linearVelocity.addV(Util.cross(this.a.angularVelocity, this.ra)));
            let approachingVelocity = relativeVelocity.dot(this.manifold.contactNormal);
            if (Settings.positionCorrection)
                this.bias = -(this.beta / delta) * Math.max(this.manifold.penetrationDepth - Settings.penetrationSlop, 0.0);
            this.bias += this.restitution * Math.min(approachingVelocity + Settings.restitutionSlop, 0.0);
            // if (approachingVelocity + Settings.restitutionSlop < 0)
            //     this.bias += this.restitution * approachingVelocity;
        }
        let k = +this.a.inverseMass
            + this.jacobian.wa * this.a.inverseInertia * this.jacobian.wa
            + this.b.inverseMass
            + this.jacobian.wb * this.b.inverseInertia * this.jacobian.wb;
        this.effectiveMass = 1.0 / k;
        // Apply the old impulse calculated in the previous time step
        if (Settings.warmStarting)
            this.applyImpulse(this.impulseSum);
    }
    solve(friendNormal) {
        // Calculate corrective impulse: Pc
        // Pc = J^t * λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)
        // Jacobian * velocity vector
        let jv = +this.jacobian.va.dot(this.a.linearVelocity)
            + this.jacobian.wa * this.a.angularVelocity
            + this.jacobian.vb.dot(this.b.linearVelocity)
            + this.jacobian.wb * this.b.angularVelocity;
        let impulse = this.effectiveMass * -(jv + this.bias);
        let oldImpulseSum = this.impulseSum;
        switch (this.constraintType) {
            case ConstraintType.Normal:
                {
                    if (Settings.impulseAccumulation)
                        this.impulseSum = Math.max(0.0, this.impulseSum + impulse);
                    else
                        this.impulseSum = Math.max(0.0, impulse);
                    break;
                }
            case ConstraintType.Tangent:
                {
                    let maxFriction = this.friction * friendNormal.impulseSum;
                    if (Settings.impulseAccumulation)
                        this.impulseSum = Util.clamp(this.impulseSum + impulse, -maxFriction, maxFriction);
                    else
                        this.impulseSum = Util.clamp(impulse, -maxFriction, maxFriction);
                    break;
                }
        }
        if (Settings.impulseAccumulation)
            impulse = this.impulseSum - oldImpulseSum;
        else
            impulse = this.impulseSum;
        // Apply impulse
        this.applyImpulse(impulse);
    }
    applyImpulse(impulse) {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ
        this.a.linearVelocity = this.a.linearVelocity.addV(this.jacobian.va.mulS(this.a.inverseMass * impulse));
        this.a.angularVelocity = this.a.angularVelocity + this.a.inverseInertia * this.jacobian.wa * impulse;
        this.b.linearVelocity = this.b.linearVelocity.addV(this.jacobian.vb.mulS(this.b.inverseMass * impulse));
        this.b.angularVelocity = this.b.angularVelocity + this.b.inverseInertia * this.jacobian.wb * impulse;
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
    prepare(delta) {
        for (let i = 0; i < this.numContacts; i++) {
            this.solversN[i].prepare(this.contactNormal, ConstraintType.Normal, delta);
            this.solversT[i].prepare(this.contactTangent, ConstraintType.Tangent, delta);
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
