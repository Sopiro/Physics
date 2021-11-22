import { Collider, Shape, Type } from "./collider.js";
import { Vector2 } from "./math.js";
import * as Util from "./util.js";

export class Circle extends Collider
{
    public readonly radius: number;

    constructor(center: Vector2, radius: number, type: Type = Type.Normal)
    {
        super(Shape.Circle, type);

        this.mass = 2;
        this.inertia = Util.calculateCircleInertia(radius, this.mass);
        this.centerOfMass = new Vector2(0, 0);

        this.translate(center);

        this.radius = radius;
    }
}