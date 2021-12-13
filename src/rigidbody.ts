import { Entity } from "./entity.js";
import { Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";

export enum Type
{
    Static = 0,
    Dynamic
}


// Children: Circle, Polygon
export class RigidBody extends Entity
{
    // Center of mass in local space = (0, 0)
    private _force: Vector2;
    private _torque: number;
    private _mass: number; // kg
    private _invMass: number;
    private _inertia: number; // kg⋅m²
    private _invInertia: number;
    private _linearVelocity: Vector2; // m/s
    private _angularVelocity: number; // rad/s
    private _friction: number;
    private _restitution: number;
    private _surfaceSpeed: number; // m/s (Tangential speed)

    public readonly type: Type;

    public id: number = -1;
    public contactIDs: Set<number> = new Set(); // ids of contact manifold containing this body
    public jointIDs: Set<number> = new Set(); // ids of the joint containing this body

    constructor(type: Type)
    {
        super();

        this._force = new Vector2(0, 0);
        this._torque = 0.0;
        this._linearVelocity = new Vector2(0, 0);
        this._angularVelocity = 0;
        this._friction = Settings.defaultFriction;
        this._restitution = Settings.defaultRestitution;
        this._surfaceSpeed = 0.0;
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
                this._mass = Settings.defaultMass;
                this._invMass = 1 / this._mass;
                this._inertia = Util.calculateCircleInertia(Settings.defaultMass, Settings.defaultSize);
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

    protected set inertia(i: number)
    {
        this._inertia = Util.clamp(i, 0, Number.MAX_VALUE);
        this._invInertia = this._inertia == Number.MAX_VALUE ? 0 : 1.0 / this._inertia;
    }

    get inverseInertia(): number
    {
        return this._invInertia;
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

    get surfaceSpeed(): number
    {
        return this._surfaceSpeed;
    }

    set surfaceSpeed(s: number)
    {
        this._surfaceSpeed = s;
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
        this._force.x = f.x;
        this._force.y = f.y;
    }

    get torque(): number
    {
        return this._torque;
    }

    set torque(t)
    {
        this._torque = t;
    }
}