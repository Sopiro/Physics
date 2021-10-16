import { Matrix3, Vector2 } from "./math.js";

export class Camera
{
    public _translation: Vector2;
    public _rotation: number;
    public _scale: Vector2;

    constructor()
    {
        this._translation = new Vector2(0, 0);
        this._rotation = 0;
        this._scale = new Vector2(1, 1);
    }

    translate(t: Vector2): void
    {
        this._translation.x += t.x;
        this._translation.y += t.y;
    }

    rotate(r: number): void
    {
        this._rotation += r;
    }

    scale(s: Vector2): void
    {
        this._scale.x *= s.x;
        this._scale.y *= s.y;
    }

    getTransform(): Matrix3
    {
        return new Matrix3().translate(this._translation.x, this._translation.y)
            .rotate(this._rotation)
            .scale(this._scale.x, this._scale.y);
    }
    
    getCameraTransform(): Matrix3
    {
        return new Matrix3().translate(-this._translation.x, -this._translation.y)
            .rotate(-this._rotation)
            .scale(this._scale.x, this._scale.y);
    }
}