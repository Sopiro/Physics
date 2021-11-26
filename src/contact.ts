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
    private readonly manifold: ContactManifold;

    private readonly a: RigidBody;
    private readonly b: RigidBody;
    private readonly contactPoint: Vector2;
    private readonly ra: Vector2;
    private readonly rb: Vector2;
    private constraintType!: ConstraintType;

    private jacobian!: Jacobian;
    private bias: number = 0.0;
    private effectiveMass!: number;

    private beta!: number;
    private restitution!: number;
    private friction!: number;

    public impulseSum: number = 0.0; // For accumulated impulse

    constructor(manifold: ContactManifold, contactPoint: Vector2)
    {
        this.manifold = manifold;
        this.a = manifold.bodyA;
        this.b = manifold.bodyB;
        this.contactPoint = contactPoint;
        this.ra = this.contactPoint.subV(this.a.localToGlobal.mulVector(this.a.centerOfMass, 1));
        this.rb = this.contactPoint.subV(this.b.localToGlobal.mulVector(this.b.centerOfMass, 1));
    }

    init(dir: Vector2, constraintType: ConstraintType, delta: number)
    {
        this.constraintType = constraintType;

        this.beta = Settings.positionCorrectionBeta;
        this.restitution = this.a.restitution * this.b.restitution;
        this.friction = this.a.friction * this.b.friction;

        this.jacobian = {
            va: dir.inverted(),
            wa: -this.ra!.cross(dir),
            vb: dir,
            wb: this.rb!.cross(dir),
        }

        if (this.constraintType == ConstraintType.Normal)
        {
            // Relative velocity at contact point
            let relativeVelocity = this.b.linearVelocity.addV(Util.cross(this.b.angularVelocity, this.rb))
                .subV(this.a.linearVelocity.addV(Util.cross(this.a.angularVelocity, this.ra)));
            let approachingVelocity = relativeVelocity.dot(this.manifold.contactNormal!);

            if (Settings.positionCorrection)
                this.bias = -(this.beta / delta) * Math.max(this.manifold.penetrationDepth! - Settings.penetrationSlop, 0.0);

            this.bias += this.restitution * Math.min(approachingVelocity + Settings.restitutionSlop, 0.0);
            // if (approachingVelocity + Settings.restitutionSlop < 0)
            //     this.bias += this.restitution * approachingVelocity;
        }

        let k: number =
            + this.a.inverseMass
            + this.jacobian.wa * this.a.inverseInertia * this.jacobian.wa
            + this.b.inverseMass
            + this.jacobian.wb * this.b.inverseInertia * this.jacobian.wb;

        this.effectiveMass = 1.0 / k;

        if (Settings.warmStarting)
        {
            // Apply the accumulated impulse comes from previous time step
            this.a.linearVelocity = this.a.linearVelocity.addV(this.jacobian.va.mulS(this.a.inverseMass * this.impulseSum));
            this.a.angularVelocity = this.a.angularVelocity + this.a.inverseInertia * this.jacobian.wa * this.impulseSum;
            this.b.linearVelocity = this.b.linearVelocity.addV(this.jacobian.vb.mulS(this.b.inverseMass * this.impulseSum));
            this.b.angularVelocity = this.b.angularVelocity + this.b.inverseInertia * this.jacobian.wb * this.impulseSum;
        }
    }

    solve(friendNormal?: ContactConstraintSolver)
    {
        // Jacobian * velocity vector
        let jv: number =
            + this.jacobian.va.dot(this.a.linearVelocity)
            + this.jacobian.wa * this.a.angularVelocity
            + this.jacobian.vb.dot(this.b.linearVelocity)
            + this.jacobian.wb * this.b.angularVelocity;

        let impulse = this.effectiveMass * -(jv + this.bias);

        let oldImpulseSum = this.impulseSum;
        switch (this.constraintType)
        {
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
                    let maxFriction = this.friction * friendNormal!.impulseSum;
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
        this.a.linearVelocity = this.a.linearVelocity.addV(this.jacobian.va.mulS(this.a.inverseMass * impulse));
        this.a.angularVelocity = this.a.angularVelocity + this.a.inverseInertia * this.jacobian.wa * impulse;
        this.b.linearVelocity = this.b.linearVelocity.addV(this.jacobian.vb.mulS(this.b.inverseMass * impulse));
        this.b.angularVelocity = this.b.angularVelocity + this.b.inverseInertia * this.jacobian.wb * impulse;
    }
}

export class ContactManifold extends Constraint
{
    public readonly bodyA: RigidBody;
    public readonly bodyB: RigidBody;

    // Contact informations
    public readonly penetrationDepth: number;
    public readonly contactNormal: Vector2;
    public readonly contactTangent: Vector2;
    public readonly contactPoints: Vector2[];

    public readonly solversN: ContactConstraintSolver[] = [];
    public readonly solversT: ContactConstraintSolver[] = [];

    public persistent = false;

    constructor(bodyA: RigidBody, bodyB: RigidBody, contactPoints: Vector2[], penetrationDepth: number, contactNormal: Vector2)
    {
        super();
        this.bodyA = bodyA;
        this.bodyB = bodyB;
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

    override prepare(delta: number): void
    {
        for (let i = 0; i < this.numContacts; i++)
        {
            this.solversN[i].init(this.contactNormal!, ConstraintType.Normal, delta);
            this.solversT[i].init(this.contactTangent!, ConstraintType.Tangent, delta);
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