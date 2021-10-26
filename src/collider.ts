import { Entity } from "./entity.js";
import { Vector2 } from "./math.js";

export enum Type
{
    Circle = 0,
    Polygon
}

export class Collider extends Entity
{
    public readonly type: Type;

    protected _velocity: Vector2;
    protected _angularVelocity: number;

    public readonly name: string;

    constructor(type: Type, name: string="")
    {
        super();
        this.type = type;

        this._velocity = new Vector2(0, 0);
        this._angularVelocity = 0;

        this.name = name;
    }

    update(delta: number)
    {
        this._translation.x += this._velocity.x * delta;
        this._translation.y += this._velocity.y * delta;
        this._rotation += this._angularVelocity * delta;
    }

    setVelocity(v: Vector2): void
    {
        this._velocity.x = v.x;
        this._velocity.y = v.y;
    }

    addVelocity(vt: Vector2): void //accelerate
    {
        this._velocity.x += vt.x;
        this._velocity.y += vt.y;
    }

    setAngularVelocity(w: number): void
    {
        this._angularVelocity = w;
    }

    addAngularVelocity(wt: number): void
    {
        this._angularVelocity += wt;
    }
}