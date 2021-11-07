import { Collider } from "./collider";
import { Vector2 } from "./math.js";
import * as Util from "./util.js";

let penetration_slop = 0.05;
let restitution_slop = 10.0;

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
    private readonly contact: Contact;
    private constraintType!: ConstraintType;

    private ra!: Vector2;
    private rb!: Vector2;

    private jacobian!: Jacobian;
    private bias: number = 0.0;
    private effectiveMass!: number;

    private beta!: number;
    private restitution!: number;
    private friction!: number;

    private impulseSum: number = 0.0; // For accumulated impulse

    constructor(contact: Contact)
    {
        this.contact = contact;
    }

    init(dir: Vector2, constraintType: ConstraintType, delta: number)
    {
        const a = this.contact.bodyA;
        const b = this.contact.bodyB;;

        this.ra = this.contact.contactPointAGlobal!.subV(a.localToGlobal().mulVector(a.centerOfMass, 1));
        this.rb = this.contact.contactPointBGlobal!.subV(b.localToGlobal().mulVector(b.centerOfMass, 1));

        this.constraintType = constraintType;

        this.beta = a.contactBeta * b.contactBeta;
        this.restitution = a.restitution * b.restitution;
        this.friction = a.friction * b.friction;

        this.jacobian = {
            va: dir.inverted(),
            wa: -this.ra!.cross(dir),
            vb: dir,
            wb: this.rb!.cross(dir),
        }

        if (this.constraintType == ConstraintType.Normal)
        {
            // Relative velocity at contact point
            let relativeVelocity = b.linearVelocity.addV(Util.cross(b.angularVelocity, this.rb))
                .subV(a.linearVelocity.addV(Util.cross(a.angularVelocity, this.ra)));
            let approachingVelocity = relativeVelocity.dot(this.contact.contactNormal!);

            this.bias = -(this.beta / delta) * Math.max(this.contact.penetrationDepth! - penetration_slop, 0) +
                this.restitution * Math.max(approachingVelocity - restitution_slop, 0);
        }

        let k: number =
            + a.inverseMass
            + this.jacobian.wa * a.inverseInertia * this.jacobian.wa
            + b.inverseMass
            + this.jacobian.wb * b.inverseInertia * this.jacobian.wb;

        this.effectiveMass = 1.0 / k;
    }

    resolve()
    {
        const a = this.contact.bodyA;
        const b = this.contact.bodyB;;

        // Jacobian * velocity vector
        let jv: number =
            + this.jacobian.va.dot(a.linearVelocity)
            + this.jacobian.wa * a.angularVelocity
            + this.jacobian.vb.dot(b.linearVelocity)
            + this.jacobian.wb * b.angularVelocity;

        let lambda = this.effectiveMass * -(jv + this.bias);

        let oldImpulseSum = this.impulseSum;
        switch (this.constraintType)
        {
            case ConstraintType.Normal:
                {
                    this.impulseSum = Math.max(0.0, this.impulseSum + lambda);
                    break;
                }
            case ConstraintType.Tangent:
                {
                    let maxFriction = this.friction * this.contact.solverN.impulseSum;
                    this.impulseSum = Util.clamp(this.impulseSum + lambda, -maxFriction, maxFriction);
                    break;
                }
        }
        lambda = this.impulseSum - oldImpulseSum;

        // Apply impulse
        a.linearVelocity = a.linearVelocity.addV(this.jacobian.va.mulS(a.inverseMass * lambda));
        a.angularVelocity = a.angularVelocity + a.inverseInertia * this.jacobian.wa * lambda;
        b.linearVelocity = b.linearVelocity.addV(this.jacobian.vb.mulS(b.inverseMass * lambda));
        b.angularVelocity = b.angularVelocity + b.inverseInertia * this.jacobian.wb * lambda;
    }
}

export class Contact
{
    public bodyA!: Collider;
    public bodyB!: Collider;

    // Contact informations
    public penetrationDepth!: number;
    public contactNormal!: Vector2;
    public contactTangent!: Vector2;
    public contactPointAGlobal!: Vector2;
    public contactPointBGlobal!: Vector2;
    public contactPointALocal!: Vector2;
    public contactPointBLocal!: Vector2;

    public readonly solverN: ContactConstraintSolver;
    public readonly solverT: ContactConstraintSolver;

    constructor()
    {
        this.solverN = new ContactConstraintSolver(this);
        this.solverT = new ContactConstraintSolver(this);
    }

    prepareResolution(delta: number)
    {
        this.solverN.init(this.contactNormal!, ConstraintType.Normal, delta);
        this.solverT.init(this.contactTangent!, ConstraintType.Tangent, delta);
    }

    resolveConstraint()
    {
        // Order matters. To clamp friction's lambda range, you should get the normal impulse(lambda) value
        this.solverN.resolve();
        this.solverT.resolve();
    }
}