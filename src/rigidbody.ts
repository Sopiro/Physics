import { Entity } from "./entity.js";
import { Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";

export enum Type
{
    Static = 0,
    Dynamic
}

export class RigidBody extends Entity
{
    private _force: Vector2;
    private _torque: number;
    private _mass: number; // kg
    private _invMass: number;
    private _inertia: number; // kg⋅cm²
    private _invInertia: number;
    private _centerOfMass: Vector2;
    private _linearVelocity: Vector2; // cm/s
    private _angularVelocity: number; // rad/s
    private _friction: number;
    private _restitution: number;

    public readonly type: Type;

    public id: number = -1;
    public contactIDs: Set<number> = new Set(); // ids of contact manifold containing this body
    public jointIDs: Set<number> = new Set(); // ids of the joint containing this body

    constructor(type: Type, friction = 0.7, restitution = 0.001)
    {
        super();

        this._force = new Vector2(0, 0);
        this._torque = 0.0;
        this._linearVelocity = new Vector2(0, 0);
        this._angularVelocity = 0;
        this._centerOfMass = new Vector2(0, 0);
        this._friction = friction;
        this._restitution = restitution;
        this.type = type;

        switch (this.type)
        {
            case Type.Static:
                this._mass = Number.MAX_VALUE;
                this._invMass = 0;
                this._inertia = Number.MAX_VALUE;
                this._invInertia = 0;
                break;
            case Type.Dynamic:
                this._mass = Settings.newBodySettings.mass;
                this._invMass = 1 / this._mass;
                this._inertia = Util.calculateCircleInertia(Settings.newBodySettings.size, this.mass);
                this._invInertia = 1 / this._inertia;
                break;
        }
    }

    get mass(): number
    {
        return this._mass;
    }

    set mass(m: number)
    {
        this._mass = Util.clamp(m, 0, Number.MAX_VALUE);
        this._invMass = this._mass == 0 ? 0 : 1.0 / this._mass;
    }

    get inverseMass(): number
    {
        return this._invMass;
    }

    get inertia(): number
    {
        return this._inertia;
    }

    set inertia(i: number)
    {
        this._inertia = Util.clamp(i, 0, Number.MAX_VALUE);
        this._invInertia = this._inertia == Number.MAX_VALUE ? 0 : 1.0 / this._inertia;
    }

    get inverseInertia(): number
    {
        return this._invInertia;
    }

    get centerOfMass(): Vector2
    {
        return this._centerOfMass;
    }

    protected set centerOfMass(cm: Vector2)
    {
        this._centerOfMass = cm.copy();
    }

    get friction(): number
    {
        return this._friction;
    }

    set friction(f: number)
    {
        this._friction = Util.clamp(f, 0.0, Number.MAX_VALUE);
    }

    get restitution(): number
    {
        return this._restitution;
    }

    set restitution(r: number)
    {
        this._restitution = Util.clamp(r, 0.0, 1.0);
    }

    get linearVelocity(): Vector2
    {
        return this._linearVelocity;
    }

    set linearVelocity(v: Vector2)
    {
        this._linearVelocity = v.copy();
    }

    get angularVelocity(): number
    {
        return this._angularVelocity;
    }

    set angularVelocity(w: number)
    {
        this._angularVelocity = w;
    }

    get force(): Vector2
    {
        return this._force;
    }

    set force(f: Vector2)
    {
        this._force = f.copy();
    }

    get torque(): number
    {
        return this._torque;
    }

    set torque(t)
    {
        this._torque = t;
    }

    addForce(f: Vector2): void
    {
        this._force = this._force.add(f);
    }

    addTorque(t: number): void
    {
        this._torque += t;
    }

    addVelocity(vt: Vector2): void //accelerate
    {
        this._linearVelocity.x += vt.x;
        this._linearVelocity.y += vt.y;
    }

    addAngularVelocity(wt: number): void
    {
        this._angularVelocity += wt;
    }
}