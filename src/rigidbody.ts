import { ContactInfo } from "./contact.js";
import { Entity } from "./entity.js";
import { Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
import { Node } from "./aabbtree.js";

export enum Type
{
    Static = 0,
    Dynamic
}


// Children: Circle, Polygon
export abstract class RigidBody extends Entity
{
    // Center of mass in local space = (0, 0)
    private _force: Vector2;            // N
    private _torque: number;            // N⋅m

    private _linearVelocity: Vector2;   // m/s
    private _angularVelocity: number;   // rad/s

    protected _density!: number;          // kg/m²
    protected _mass!: number;             // kg
    protected _invMass!: number;
    protected _inertia!: number;          // kg⋅m²
    protected _invInertia!: number;

    private _friction: number;
    private _restitution: number;
    private _surfaceSpeed: number;      // m/s (Tangential speed)

    public readonly type: Type;

    public id: number = -1;
    public islandID: number = 0;
    public manifoldIDs: number[] = [];  // ids of contact manifold containing this body
    public jointIDs: number[] = [];     // ids of the joint containing this body
    public resting: number = 0;
    public sleeping: boolean = false;

    // Pointer to the node in the AABB tree
    public node?: Node;

    // Callback function which is called after the constraint is solved
    // If the callback returns true, it will reset itself to undefined
    public onContact?: (contactInfo: ContactInfo) => boolean;

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

        if (this.type == Type.Static)
        {
            this._density = Number.MAX_VALUE;
            this._mass = Number.MAX_VALUE;
            this._invMass = 0;
            this._inertia = Number.MAX_VALUE;
            this._invInertia = 0;
            this.sleeping = true;
        }
        else
        {
            // This part is implemented by children.
        }
    }

    abstract get density(): number;
    abstract set density(d: number);

    abstract get mass(): number;
    abstract set mass(m: number)

    awake(): void
    {
        if (this.type == Type.Static) return;

        this.resting = 0;
        this.sleeping = false;
    }

    // Getters and Setters
    get inverseMass(): number
    {
        return this._invMass;
    }

    get inertia(): number
    {
        return this._inertia;
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
        Util.assert(f >= 0.0);

        this._friction = f;
    }

    get restitution(): number
    {
        return this._restitution;
    }

    set restitution(r: number)
    {
        Util.assert(r >= 0.0 && r <= 1.0);

        this._restitution = r;
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