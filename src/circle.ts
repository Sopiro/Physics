import { Collider, Shape, Type } from "./collider.js";
import { Vector2 } from "./math.js";

export class Circle extends Collider
{
    public readonly radius: number;

    constructor(center: Vector2, radius: number, type: Type = Type.Normal)
    {
        super(Shape.Circle, type);

        this.mass = 20;
        this.inertia = this.mass * radius * radius / 2.0;
        this.centerOfMass = new Vector2(0, 0);

        this.translate(center);

        this.radius = radius;
    }
}