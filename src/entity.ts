import { Matrix3, Vector2 } from "./math.js";

export class Entity
{
    protected _translation: Vector2;
    protected _rotation: number;
    protected _scale: Vector2;

    constructor()
    {
        this._translation = new Vector2(0, 0);
        this._rotation = 0;
        this._scale = new Vector2(1, 1);
    }

    resetTransform(): void
    {
        this._translation.clear();
        this._rotation= 0;
        this._scale = new Vector2(1, 1);
    }

    setPosition(p: Vector2): void
    {
        this._translation.x = p.x;
        this._translation.y = p.y;
    }

    translate(t: Vector2): void
    {
        this._translation.x += t.x;
        this._translation.y += t.y;
    }

    setRotation(r: number): void
    {
        this._rotation = r;
    }

    rotate(r: number): void
    {
        this._rotation += r;
    }

    setScale(s: Vector2): void
    {
        this._scale.x = s.x;
        this._scale.y = s.y;
    }

    scale(s: Vector2): void
    {
        this._scale.x *= s.x;
        this._scale.y *= s.y;
    }

    // Returns local to global transform
    get localToGlobal(): Matrix3
    {
        return new Matrix3().translate(this._translation.x, this._translation.y)
            .rotate(this._rotation)
            .scale(this._scale.x, this._scale.y);
    }

    // Returns global to local transform
    get globalToLocal(): Matrix3
    {
        return new Matrix3().scale(1.0 / this._scale.x, 1.0 / this._scale.y)
            .rotate(-this._rotation)
            .translate(-this._translation.x, -this._translation.y);
    }
}