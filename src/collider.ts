import { Entity } from "./entity.js";
import { Vector2 } from "./math.js";
import { toFixed } from "./util.js";

export enum Type
{
    Circle = 0,
    Polygon
}

// Rigid body collider
export class Collider extends Entity
{
    public readonly type: Type;

    protected _mass!: number;
    protected _invMass!: number;
    protected _inertia!: number;
    protected _invInertia!: number;
    protected _cm!: Vector2;
    protected _linearVelocity: Vector2;
    protected _angularVelocity: number;
    protected _friction: number;
    protected _beta: number;
    protected _restitution: number;

    public readonly name: string;

    constructor(type: Type, name: string = "")
    {
        super();
        this.type = type;

        this._linearVelocity = new Vector2(0, 0);
        this._angularVelocity = 0;
        this._friction = 0.7;
        this._beta = 0.5
        this._restitution = 0.7;
        this.name = name;
    }

    get mass(): number
    {
        return this._mass;
    }

    set mass(m: number)
    {
        this._mass = m;
        this._invMass = 1.0 / this._mass;
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
        this._inertia = i;
        this._invInertia = 1.0 / i;
    }

    get inverseInertia(): number
    {
        return this._invInertia;
    }

    get centerOfMass(): Vector2
    {
        return this._cm;
    }

    get friction(): number
    {
        return this._friction;
    }

    get contactBeta():number
    {
        return this._beta;
    }

    get restitution():number
    {
        return this._restitution;
    }

    get linearVelocity(): Vector2
    {
        return this._linearVelocity;
    }

    set linearVelocity(v: Vector2)
    {
        this._linearVelocity.x = v.x;
        this._linearVelocity.y = v.y;
    }

    get angularVelocity(): number
    {
        return this._angularVelocity;
    }

    set angularVelocity(w: number)
    {
        this._angularVelocity = w;
    }

    update(delta: number)
    {
        this._position.x += this._linearVelocity.x * delta;
        this._position.y += this._linearVelocity.y * delta;
        this._rotation += this._angularVelocity * delta;
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