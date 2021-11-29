import { RigidBody, Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";

export class Polygon extends RigidBody
{
    public readonly vertices: Vector2[];

    constructor(vertices: Vector2[], type: Type = Type.Normal, resetPosition: boolean = true)
    {
        super(type);

        this.vertices = vertices;

        for (let i = 0; i < this.count; i++)
        {
            this.centerOfMass.x += this.vertices[i].x;
            this.centerOfMass.y += this.vertices[i].y;
        }

        this.centerOfMass.x /= this.count;
        this.centerOfMass.y /= this.count;

        for (let i = 0; i < this.count; i++)
        {
            this.vertices[i].x -= this.centerOfMass.x;
            this.vertices[i].y -= this.centerOfMass.y;
        }

        if (!resetPosition)
            this.translate(this.centerOfMass);

        this.centerOfMass.clear();
    }

    get count(): number
    {
        return this.vertices.length;
    }

    get globalVertices(): Vector2[]
    {
        const transform = this.localToGlobal;

        let res: Vector2[] = [];

        for (let i = 0; i < this.count; i++)
            res.push(transform.mulVector(this.vertices[i], 1));

        return res;
    }
}