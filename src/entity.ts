import { Matrix3, Vector2 } from "./math.js";

export class Entity
{
    protected _position: Vector2;
    protected _rotation: number;
    protected _scale: Vector2;

    constructor()
    {
        this._position = new Vector2(0, 0);
        this._rotation = 0;
        this._scale = new Vector2(1, 1);
    }

    get position(): Vector2
    {
        return this._position;
    }

    set position(p: Vector2)
    {
        this._position.x = p.x;
        this._position.y = p.y;
    }

    get rotation(): number
    {
        return this._rotation;
    }

    set rotation(r: number)
    {
        this._rotation = r;
    }

    get scale(): Vector2
    {
        return this._scale;
    }

    set scale(s: Vector2)
    {
        this._scale.x = s.x;
        this._scale.y = s.y;
    }

    resetTransform(): void
    {
        this._position.clear();
        this._rotation = 0;
        this._scale = new Vector2(1, 1);
    }

    translate(t: Vector2): void
    {
        this._position.x += t.x;
        this._position.y += t.y;
    }

    rotate(r: number): void
    {
        this._rotation += r;
    }

    doScale(s: Vector2): void
    {
        this._scale.x *= s.x;
        this._scale.y *= s.y;
    }

    // Returns local to global transform
    get localToGlobal(): Matrix3
    {
        return new Matrix3()
            .translate(this._position.x, this._position.y)
            .rotate(this._rotation)
            .scale(this._scale.x, this._scale.y);
    }

    // Returns global to local transform
    get globalToLocal(): Matrix3
    {
        return new Matrix3()
            .scale(1.0 / this._scale.x, 1.0 / this._scale.y)
            .rotate(-this._rotation)
            .translate(-this._position.x, -this._position.y);
    }
}