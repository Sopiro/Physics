import { Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
import { Constraint } from "./constraint.js";
var ContactType;
(function (ContactType) {
    ContactType[ContactType["Normal"] = 0] = "Normal";
    ContactType[ContactType["Tangent"] = 1] = "Tangent";
})(ContactType || (ContactType = {}));
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
    prepare(dir, contactType) {
        // Calculate Jacobian J and effective mass M
        // J = [-dir, -ra × dir, dir, rb × dir] (dir: Contact vector, normal or tangent)
        // M = (J · M^-1 · J^t)^-1
        this.contactType = contactType;
        this.ra = this.contactPoint.sub(this.bodyA.position);
        this.rb = this.contactPoint.sub(this.bodyB.position);
        this.jacobian =
            {
                va: dir.inverted(),
                wa: -this.ra.cross(dir),
                vb: dir,
                wb: this.rb.cross(dir),
            };
        this.bias = 0.0;
        if (this.contactType == ContactType.Normal) {
            // Relative velocity at contact point
            let relativeVelocity = this.bodyB.linearVelocity.add(Util.cross(this.bodyB.angularVelocity, this.rb))
                .sub(this.bodyA.linearVelocity.add(Util.cross(this.bodyA.angularVelocity, this.ra)));
            let normalVelocity = relativeVelocity.dot(this.manifold.contactNormal);
            if (Settings.positionCorrection)
                this.bias = -(this.beta * Settings.inv_dt) * Math.max(this.manifold.penetrationDepth - Settings.penetrationSlop, 0.0);
            this.bias += this.restitution * Math.min(normalVelocity + Settings.restitutionSlop, 0.0);
            // if (approachingVelocity + Settings.restitutionSlop < 0) this.bias += this.restitution * approachingVelocity;
        }
        else {
            // Bias for surface speed that enables the conveyor belt-like behavior
            this.bias = -(this.bodyB.surfaceSpeed - this.bodyA.surfaceSpeed);
            if (this.manifold.featureFlipped)
                this.bias *= -1;
        }
        let k = +this.bodyA.inverseMass
            + this.jacobian.wa * this.bodyA.inverseInertia * this.jacobian.wa
            + this.bodyB.inverseMass
            + this.jacobian.wb * this.bodyB.inverseInertia * this.jacobian.wb;
        this.effectiveMass = k > 0.0 ? 1.0 / k : 0.0;
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
        switch (this.contactType) {
            case ContactType.Normal:
                {
                    if (Settings.impulseAccumulation)
                        this.impulseSum = Math.max(0.0, this.impulseSum + lambda);
                    else
                        this.impulseSum = Math.max(0.0, lambda);
                    break;
                }
            case ContactType.Tangent:
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
    constructor(bodyA, bodyB, contactPoints, penetrationDepth, contactNormal, featureFlipped) {
        super(bodyA, bodyB);
        this.solversN = [];
        this.solversT = [];
        this.persistent = false;
        this.contactPoints = contactPoints;
        this.penetrationDepth = penetrationDepth;
        this.contactNormal = contactNormal;
        this.contactTangent = new Vector2(-contactNormal.y, contactNormal.x);
        this.featureFlipped = featureFlipped;
        for (let i = 0; i < this.numContacts; i++) {
            this.solversN.push(new ContactConstraintSolver(this, contactPoints[i]));
            this.solversT.push(new ContactConstraintSolver(this, contactPoints[i]));
        }
    }
    prepare() {
        for (let i = 0; i < this.numContacts; i++) {
            this.solversN[i].prepare(this.contactNormal, ContactType.Normal);
            this.solversT[i].prepare(this.contactTangent, ContactType.Tangent);
        }
    }
    solve() {
        for (let i = 0; i < this.numContacts; i++) {
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
                // If contact points are close enough, warm start.
                if (dist < Settings.warmStartingThreshold)
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
