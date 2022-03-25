import { RigidBody } from "./rigidbody.js";
import { Matrix2, Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
import { Constraint } from "./constraint.js";
import { ContactPoint } from "./detection.js";

enum ContactType
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

class ContactSolver
{
    private manifold: ContactManifold;

    private bodyA: RigidBody;
    private bodyB: RigidBody;
    private contactPoint: Vector2;
    private contactType!: ContactType;

    private beta: number;
    private restitution: number;
    private friction: number;

    private ra!: Vector2;
    private rb!: Vector2;

    public jacobian!: Jacobian;
    public bias!: number;
    public effectiveMass!: number;

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

    prepare(dir: Vector2, contactType: ContactType, featureFlipped: boolean)
    {
        // Calculate Jacobian J and effective mass M
        // J = [-dir, -ra × dir, dir, rb × dir] (dir: Contact vector, normal or tangent)
        // M = (J · M^-1 · J^t)^-1

        this.contactType = contactType;

        this.ra = this.contactPoint.sub(this.bodyA.position);
        this.rb = this.contactPoint.sub(this.bodyB.position);

        this.jacobian =
        {
            va: dir.inverted(),
            wa: -this.ra!.cross(dir),
            vb: dir,
            wb: this.rb!.cross(dir),
        }

        this.bias = 0.0;
        if (this.contactType == ContactType.Normal)
        {
            // Relative velocity at contact point
            let relativeVelocity = this.bodyB.linearVelocity.add(Util.cross(this.bodyB.angularVelocity, this.rb))
                .sub(this.bodyA.linearVelocity.add(Util.cross(this.bodyA.angularVelocity, this.ra)));
            let normalVelocity = this.manifold.contactNormal.dot(relativeVelocity);

            if (Settings.positionCorrection)
                this.bias = -(this.beta * Settings.inv_dt) * Math.max(this.manifold.penetrationDepth! - Settings.penetrationSlop, 0.0);

            this.bias += this.restitution * Math.min(normalVelocity + Settings.restitutionSlop, 0.0);
            // if (approachingVelocity + Settings.restitutionSlop < 0) this.bias += this.restitution * approachingVelocity;
        } else
        {
            // Bias for surface speed that enables the conveyor belt-like behavior
            this.bias = -(this.bodyB.surfaceSpeed - this.bodyA.surfaceSpeed);
            if (featureFlipped) this.bias *= -1;
        }

        let k: number =
            + this.bodyA.inverseMass
            + this.jacobian.wa * this.bodyA.inverseInertia * this.jacobian.wa
            + this.bodyB.inverseMass
            + this.jacobian.wb * this.bodyB.inverseInertia * this.jacobian.wb;

        this.effectiveMass = k > 0.0 ? 1.0 / k : 0.0;

        // Apply the old impulse calculated in the previous time step
        if (Settings.warmStarting)
            this.applyImpulse(this.impulseSum);
    }

    solve(normalContact?: ContactSolver)
    {
        // Calculate corrective impulse: Pc
        // Pc = J^t * λ (λ: lagrangian multiplier)
        // λ = (J · M^-1 · J^t)^-1 ⋅ -(J·v+b)

        // Jacobian * velocity vector (Normal velocity)
        let jv: number =
            + this.jacobian.va.dot(this.bodyA.linearVelocity)
            + this.jacobian.wa * this.bodyA.angularVelocity
            + this.jacobian.vb.dot(this.bodyB.linearVelocity)
            + this.jacobian.wb * this.bodyB.angularVelocity;

        let lambda = this.effectiveMass * -(jv + this.bias);

        let oldImpulseSum = this.impulseSum;
        switch (this.contactType)
        {
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

class BlockSolver
{
    private bodyA: RigidBody;
    private bodyB: RigidBody;

    // Normal contacts
    private nc1!: ContactSolver;
    private nc2!: ContactSolver;
    // Jacobians
    private j1!: Jacobian;
    private j2!: Jacobian;

    private k!: Matrix2;
    private m!: Matrix2;

    constructor(manifold: ContactManifold)
    {
        this.bodyA = manifold.bodyA;
        this.bodyB = manifold.bodyB;
    }

    prepare(normalContacts: ContactSolver[])
    {
        // Calculate Jacobian J and effective mass M
        // J = [-n, -ra1 × n, n, rb1 × n
        //      -n, -ra2 × n, n, rb2 × n]
        // K = (J · M^-1 · J^t)
        // M = K^-1

        this.nc1 = normalContacts[0];
        this.nc2 = normalContacts[1];

        this.j1 = normalContacts[0].jacobian;
        this.j2 = normalContacts[1].jacobian;

        this.k = new Matrix2();

        this.k.m00 =
            + this.bodyA.inverseMass
            + this.j1.wa * this.bodyA.inverseInertia * this.j1.wa
            + this.bodyB.inverseMass
            + this.j1.wb * this.bodyB.inverseInertia * this.j1.wb;

        this.k.m11 =
            + this.bodyA.inverseMass
            + this.j2.wa * this.bodyA.inverseInertia * this.j2.wa
            + this.bodyB.inverseMass
            + this.j2.wb * this.bodyB.inverseInertia * this.j2.wb;

        this.k.m01 =
            + this.bodyA.inverseMass
            + this.j1.wa * this.bodyA.inverseInertia * this.j2.wa
            + this.bodyB.inverseMass
            + this.j1.wb * this.bodyB.inverseInertia * this.j2.wb;

        this.k.m10 = this.k.m01;

        Util.assert(this.k.determinant != 0);
        this.m = this.k.inverted();
    }

    solve()
    {
        // The comments below are copied from Box2D::b2_contact_solver.cpp
        // Check out Box2D: https://box2d.org
        //
        // Block solver developed in collaboration with Dirk Gregorius (back in 01/07 on Box2D_Lite).
        // Build the mini LCP for this contact patch
        //
        // vn = A * x + b, vn >= 0, x >= 0 and vn_i * x_i = 0 with i = 1..2
        //  
        // A = J * W * JT and J = ( -n, -r1 x n, n, r2 x n )
        // b = vn0 - velocityBias
        //
        // The system is solved using the "Total enumeration method" (s. Murty). The complementary constraint vn_i * x_i
        // implies that we must have in any solution either vn_i = 0 or x_i = 0. So for the 2D contact problem the cases
        // vn1 = 0 and vn2 = 0, x1 = 0 and x2 = 0, x1 = 0 and vn2 = 0, x2 = 0 and vn1 = 0 need to be tested. The first valid
        // solution that satisfies the problem is chosen.
        //
        // In order to account of the accumulated impulse 'a' (because of the iterative nature of the solver which only requires
        // that the accumulated impulse is clamped and not the incremental impulse) we change the impulse variable (x_i).
        //
        // Substitute:
        //
        // x = a + d
        //
        // a := old total impulse
        // x := new total impulse
        // d := incremental impulse 
        //
        // For the current iteration we extend the formula for the incremental impulse
        // to compute the new total impulse:
        //
        // vn = A * d + b
        //     = A * (x - a) + b
        //     = A * x + b - A * a
        //     = A * x + b'
        // b' = b - A * a; 

        let a = new Vector2(this.nc1.impulseSum, this.nc2.impulseSum); // old total impulse
        Util.assert(a.x >= 0.0, a.y >= 0.0);

        // (Velocity constraint) Normal velocity: Jv = 0
        let vn1: number =
            + this.nc1.jacobian.va.dot(this.bodyA.linearVelocity)
            + this.nc1.jacobian.wa * this.bodyA.angularVelocity
            + this.nc1.jacobian.vb.dot(this.bodyB.linearVelocity)
            + this.nc1.jacobian.wb * this.bodyB.angularVelocity;

        let vn2: number =
            + this.nc2.jacobian.va.dot(this.bodyA.linearVelocity)
            + this.nc2.jacobian.wa * this.bodyA.angularVelocity
            + this.nc2.jacobian.vb.dot(this.bodyB.linearVelocity)
            + this.nc2.jacobian.wb * this.bodyB.angularVelocity;

        let b = new Vector2(vn1 + this.nc1.bias, vn2 + this.nc2.bias);

        // b' = b - K * a
        b = b.sub(this.k.mulVector(a));
        let x: Vector2; // Lambda

        while (true)
        {
            //
            // Case 1: vn = 0
            // Both constraints are violated
            //
            // 0 = A * x + b'
            //
            // Solve for x:
            //
            // x = - inv(A) * b'
            //
            x = this.m.mulVector(b).inverted();
            if (x.x >= 0.0 && x.y >= 0.0) break;

            //
            // Case 2: vn1 = 0 and x2 = 0
            // The first constraint is violated and the second constraint is satisfied
            //
            //   0 = a11 * x1 + a12 * 0 + b1' 
            // vn2 = a21 * x1 + a22 * 0 + b2'
            //
            x.x = this.nc1.effectiveMass * -b.x;
            x.y = 0.0;
            vn1 = 0.0;
            vn2 = this.k.m01 * x.x + b.y;
            if (x.x >= 0.0 && vn2 >= 0.0) break;

            //
            // Case 3: vn2 = 0 and x1 = 0
            // The first constraint is satisfied and the second constraint is violated
            //
            // vn1 = a11 * 0 + a12 * x2 + b1' 
            //   0 = a21 * 0 + a22 * x2 + b2'
            //
            x.x = 0.0;
            x.y = this.nc2.effectiveMass * -b.y;
            vn1 = this.k.m10 * x.y + b.x;
            vn2 = 0.0;
            if (x.y >= 0.0 && vn1 >= 0.0) break;

            //
            // Case 4: x1 = 0 and x2 = 0
            // Both constraints are satisfied 
            //
            // vn1 = b1
            // vn2 = b2;
            //
            x.x = 0.0;
            x.y = 0.0;
            vn1 = b.x;
            vn2 = b.y;
            if (vn1 >= 0.0 && vn2 >= 0.0) break;

            // How did you reach here?! something went wrong!
            Util.assert(false);
            break;
        }

        // Get the incremental impulse
        let d = x.sub(a);
        this.applyImpulse(d);

        // Accumulate
        this.nc1.impulseSum = x.x;
        this.nc2.impulseSum = x.y;
    }

    private applyImpulse(lambda: Vector2): void
    {
        // V2 = V2' + M^-1 ⋅ Pc
        // Pc = J^t ⋅ λ

        this.bodyA.linearVelocity = this.bodyA.linearVelocity.add(this.j1.va.mul(this.bodyA.inverseMass * (lambda.x + lambda.y)));
        this.bodyA.angularVelocity = this.bodyA.angularVelocity + this.bodyA.inverseInertia * (this.j1.wa * lambda.x + this.j2.wa * lambda.y);
        this.bodyB.linearVelocity = this.bodyB.linearVelocity.add(this.j1.vb.mul(this.bodyB.inverseMass * (lambda.x + lambda.y)));
        this.bodyB.angularVelocity = this.bodyB.angularVelocity + this.bodyB.inverseInertia * (this.j1.wb * lambda.x + this.j2.wb * lambda.y);
    }
}

export interface ContactInfo
{
    other: RigidBody,
    numContacts: number;
    contactDir: Vector2;
    contactPoints: Vector2[];
    impulse: number;
}

export class ContactManifold extends Constraint
{
    // Contact informations
    public readonly penetrationDepth: number;
    public readonly contactNormal: Vector2;
    public readonly contactTangent: Vector2;
    public readonly contactPoints: ContactPoint[];

    private readonly normalContacts: ContactSolver[] = [];
    private readonly tangentContacts: ContactSolver[] = [];
    private readonly blockSolver!: BlockSolver;

    private readonly featureFlipped;
    public persistent = false;

    constructor(
        bodyA: RigidBody, bodyB: RigidBody,
        contactPoints: ContactPoint[], penetrationDepth: number, contactNormal: Vector2,
        featureFlipped: boolean
    )
    {
        super(bodyA, bodyB);
        this.contactPoints = contactPoints;
        this.penetrationDepth = penetrationDepth;
        this.contactNormal = contactNormal;
        this.contactTangent = new Vector2(-contactNormal.y, contactNormal.x);
        this.featureFlipped = featureFlipped;

        for (let i = 0; i < this.numContacts; i++)
        {
            this.normalContacts.push(new ContactSolver(this, contactPoints[i].point));
            this.tangentContacts.push(new ContactSolver(this, contactPoints[i].point));
        }

        if (this.numContacts == 2 && Settings.blockSolve)
        {
            this.blockSolver = new BlockSolver(this);
        }
    }

    override prepare(): void
    {
        for (let i = 0; i < this.numContacts; i++)
        {
            this.normalContacts[i].prepare(this.contactNormal, ContactType.Normal, this.featureFlipped);
            this.tangentContacts[i].prepare(this.contactTangent, ContactType.Tangent, this.featureFlipped);
        }

        // If we have two contact points, then prepare the block solver.
        if (this.numContacts == 2 && Settings.blockSolve)
        {
            this.blockSolver.prepare(this.normalContacts);
        }
    }

    override solve(): void
    {
        // Solve tangent constraint first
        for (let i = 0; i < this.numContacts; i++)
        {
            this.tangentContacts[i].solve(this.normalContacts[i]);
        }

        if (this.numContacts == 1 || !Settings.blockSolve)
        {
            for (let i = 0; i < this.numContacts; i++)
            {
                this.normalContacts[i].solve();
            }
        }
        else // Solve two contact constraint in one shot using block solver
        {
            this.blockSolver.solve();
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
                if (this.contactPoints[n].id == oldManifold.contactPoints[o].id)
                {
                    if (Settings.applyWarmStartingThreshold)
                    {
                        let dist = Util.squared_distance(this.contactPoints[n].point, oldManifold.contactPoints[o].point);
                        // If contact points are close enough, warm start.
                        // Otherwise, it means it's penetrating too deeply, skip the warm starting to prevent the overshoot
                        if (dist < Settings.warmStartingThreshold)
                            break;
                    }
                    else
                    {
                        break;
                    }
                }
            }

            if (o < oldManifold.numContacts)
            {
                this.normalContacts[n].impulseSum = oldManifold.normalContacts[o].impulseSum;
                this.tangentContacts[n].impulseSum = oldManifold.tangentContacts[o].impulseSum;

                this.persistent = true;
            }
        }
    }

    get numContacts()
    {
        return this.contactPoints.length;
    }

    getContactInfo(flip: boolean): ContactInfo
    {
        let contactInfo: ContactInfo = {
            other: flip ? this.bodyB : this.bodyA,
            numContacts: this.numContacts,
            contactDir: flip ? this.contactNormal.inverted() : this.contactNormal.copy(),
            contactPoints: [],
            impulse: 0,
        }

        for (let i = 0; i < this.numContacts; i++)
        {
            contactInfo.contactPoints.push(this.contactPoints[i].point.copy());
            contactInfo.impulse += this.normalContacts[i].impulseSum;
        }

        return contactInfo;
    }
}