import { Matrix3, Vector2 } from "./math.js";

export class Polygon
{
    public readonly vertices: Vector2[];
    public readonly count: number;
    public readonly cm: Vector2;

    private _translation: Vector2;
    private _rotation: number;
    private _scale: Vector2;

    constructor(vertices: Vector2[], reposition: boolean = true)
    {
        this.vertices = vertices;
        this.count = vertices.length;

        this.cm = new Vector2(0, 0);

        for (let i = 0; i < this.count; i++)
        {
            this.cm.x += this.vertices[i].x;
            this.cm.y += this.vertices[i].y;
        }

        this.cm.x /= this.count;
        this.cm.y /= this.count;

        if (reposition)
        {
            for (let i = 0; i < this.count; i++)
            {
                this.vertices[i].x -= this.cm.x;
                this.vertices[i].y -= this.cm.y;
            }

            this.cm.x = 0;
            this.cm.y = 0;
        }

        this._translation = new Vector2(0, 0);
        this._rotation = 0;
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

    localToGlobal(): Matrix3
    {
        return new Matrix3().translate(this._translation.x, this._translation.y)
            .rotate(this._rotation)
            .scale(this._scale.x, this._scale.y);
    }

    getGlobalVertices(): Vector2[]
    {
        const transform = this.localToGlobal();

        let res: Vector2[] = [];

        for(let i = 0; i < this.count; i++)
            res.push(transform.mulVector(this.vertices[i], 1));

        return res;
    }

    globalToLocal(): Matrix3
    {
        return new Matrix3().scale(1.0 / this._scale.x, 1.0 / this._scale.y)
            .rotate(-this._rotation)
            .translate(-this._translation.x, -this._translation.y);
    }
}