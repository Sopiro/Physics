import { RigidBody, Shape, Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import * as Util from "./util.js";

export class Circle extends RigidBody
{
    public readonly radius: number;

    constructor(center: Vector2, radius: number, type: Type = Type.Normal)
    {
        super(Shape.Circle, type);

        this.radius = radius;
        this.inertia = Util.calculateCircleInertia(radius, this.mass);

        this.position = center.copy();
    }
}