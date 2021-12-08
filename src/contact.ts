import { RigidBody } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
import { Constraint } from "./constraint.js";

enum ConstraintType
{
    Normal,
    Tangent
}

interface Jacobian
{
    va: Vector2;
    wa: number;
    vb: Vector2;
    wb: number;
}

class ContactConstraintSolver
{
    private manifold: ContactManifold;

    private bodyA: RigidBody;
    private bodyB: RigidBody;
    private contactPoint: Vector2;
    private constraintType!: ConstraintType;

    private ra!: Vector2;
    private rb!: Vector2;
    private jacobian!: Jacobian;
    private bias!: number;
    private effectiveMass!: number;

    private beta: number;
    private restitution: number;
    private friction: number;

    public impulseSum: number = 0.0; // For accumulated impulse

    constructor(manifold: ContactManifold, contactPoint: Vector2)
    {
        this.manifold = manifold;
        this.bodyA = manifold.bodyA;
        this.bodyB = manifold.bodyB;
        this.contactPoint = contactPoint;

        this.beta = Settings.positionCorrectionBeta;
        this.restitution = this.bodyA.restitution * this.bodyB.restitution;
        this.friction = this.bodyA.friction * this.bodyB.friction;
    }

    prepare(dir: Vector2, constraintType: ConstraintType)
    {
        // Calculate Jacobian J and effective mass M
        // J = [-dir, -ra × dir, dir, rb × dir] (dir: Contact vector, normal or tangent)
        // M = (J · M^-1 · J^t)^-1

        this.constraintType = constraintType;

        this.ra = this.contactPoint.sub(this.bodyA.localToGlobal.mulVector2(this.bodyA.centerOfMass, 1));
        this.rb = this.contactPoint.sub(this.bodyB.localToGlobal.mulVector2(this.bodyB.centerOfMass, 1));

        this.jacobian =
        {
            va: dir.inverted(),
            wa: -this.ra!.cross(dir),
            vb: dir,
            wb: this.rb!.cross(dir),
        }

        this.bias = 0.0;
        if (this.constraintType == ConstraintType.Normal)
        {
            // Relative velocity at contact point
            let relativeVelocity = this.bodyB.linearVelocity.add(Util.cross(this.bodyB.angularVelocity, this.rb))
                .sub(this.bodyA.linearVelocity.add(Util.cross(this.bodyA.angularVelocity, this.ra)));
            let approachingVelocity = relativeVelocity.dot(this.manifold.contactNormal!);

            if (Settings.positionCorrection)
                this.bias = -(this.beta * Settings.inv_dt) * Math.max(this.manifold.penetrationDepth! - Settings.penetrationSlop, 0.0);

            this.bias += this.restitution * Math.min(approachingVelocity + Settings.restitutionSlop, 0.0);
            // if (approachingVelocity + Settings.restitutionSlop < 0)
            //     this.bias += this.restitution * approachingVelocity;
        }

        let k: number =
            + this.bodyA.inverseMass
            + this.jacobian.wa * this.bodyA.inverseInertia * this.jacobian.wa
            + this.bodyB.inverseMass
            + this.jacobian.wb * this.bodyB.inverseInertia * this.jacobian.wb;

        this.effectiveMass = 1.0 / k;

        // Apply the old impulse calculated in the previous time step
        if (Settings.warmStarting)
            this.applyImpulse(this.impulseSum);
    }

    solve(normalContact?: ContactConstraintSolver)
    {
        // Calculate corrective impulse: Pc
        // Pc = J^t * λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)

        // Jacobian * velocity vector
        let jv: number =
            + this.jacobian.va.dot(this.bodyA.linearVelocity)
            + this.jacobian.wa * this.bodyA.angularVelocity
            + this.jacobian.vb.dot(this.bodyB.linearVelocity)
            + this.jacobian.wb * this.bodyB.angularVelocity;

        let lambda = this.effectiveMass * -(jv + this.bias);

        let oldImpulseSum = this.impulseSum;
        switch (this.constraintType)
        {
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
                    let maxFriction = this.friction * normalContact!.impulseSum;
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

    private applyImpulse(lambda: number)
    {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ

        this.bodyA.linearVelocity = this.bodyA.linearVelocity.add(this.jacobian.va.mul(this.bodyA.inverseMass * lambda));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity + this.bodyA.inverseInertia * this.jacobian.wa * lambda;
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.add(this.jacobian.vb.mul(this.bodyB.inverseMass * lambda));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.bodyB.inverseInertia * this.jacobian.wb * lambda;
    }
}

export class ContactManifold extends Constraint
{
    // Contact informations
    public readonly penetrationDepth: number;
    public readonly contactNormal: Vector2;
    public readonly contactTangent: Vector2;
    public readonly contactPoints: Vector2[];

    public readonly solversN: ContactConstraintSolver[] = [];
    public readonly solversT: ContactConstraintSolver[] = [];

    public persistent = false;

    constructor(
        bodyA: RigidBody, bodyB: RigidBody,
        contactPoints: Vector2[], penetrationDepth: number, contactNormal: Vector2
    )
    {
        super(bodyA, bodyB);
        this.contactPoints = contactPoints;
        this.penetrationDepth = penetrationDepth;
        this.contactNormal = contactNormal;
        this.contactTangent = new Vector2(-contactNormal.y, contactNormal.x);

        for (let i = 0; i < this.numContacts; i++)
        {
            this.solversN.push(new ContactConstraintSolver(this, contactPoints[i]));
            this.solversT.push(new ContactConstraintSolver(this, contactPoints[i]));
        }
    }

    override prepare(): void
    {
        for (let i = 0; i < this.numContacts; i++)
        {
            this.solversN[i].prepare(this.contactNormal!, ConstraintType.Normal);
            this.solversT[i].prepare(this.contactTangent!, ConstraintType.Tangent);
        }
    }

    override solve(): void
    {
        for (let i = 0; i < this.numContacts; i++)
        {
            // Order matters. To clamp friction's lambda range, you should get the normal impulse(lambda) value
            this.solversN[i].solve();
            this.solversT[i].solve(this.solversN[i]);
        }
    }

    protected override applyImpulse(): void { }

    tryWarmStart(oldManifold: ContactManifold)
    {
        for (let n = 0; n < this.numContacts; n++)
        {
            let o = 0;
            for (; o < oldManifold.numContacts; o++)
            {
                let dist = Util.squared_distance(this.contactPoints[n], oldManifold.contactPoints[o]);

                if (dist < Settings.warmStartingThreshold) // If contact points are close enough, warm start.
                    break;
            }

            if (o < oldManifold.numContacts)
            {
                this.solversN[n].impulseSum = oldManifold.solversN[o].impulseSum;
                this.solversT[n].impulseSum = oldManifold.solversT[o].impulseSum;

                this.persistent = true;
            }
        }
    }

    get numContacts()
    {
        return this.contactPoints.length;
    }
}