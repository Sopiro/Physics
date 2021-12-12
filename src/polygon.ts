import { RigidBody, Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";

export class Polygon extends RigidBody
{
    public readonly vertices: Vector2[];

    constructor(vertices: Vector2[], type: Type = Type.Dynamic, resetPosition: boolean = true)
    {
        super(type);

        this.vertices = vertices;

        let centerOfMass = new Vector2(0, 0);

        for (let i = 0; i < this.count; i++)
        {
            centerOfMass.x += this.vertices[i].x;
            centerOfMass.y += this.vertices[i].y;
        }

        centerOfMass.x /= this.count;
        centerOfMass.y /= this.count;

        for (let i = 0; i < this.count; i++)
        {
            this.vertices[i].x -= centerOfMass.x;
            this.vertices[i].y -= centerOfMass.y;
        }

        if (!resetPosition)
            this.translate(centerOfMass);
    }

    repositionCenter(p: Vector2)
    {
        for(let i = 0; i < this.vertices.length; i++)
        {
            let vertex = this.vertices[i];
            vertex.x -= p.x;
            vertex.y -= p.y;
        }
    }

    get count(): number
    {
        return this.vertices.length;
    }
}