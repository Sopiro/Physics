import { RigidBody, Type } from "./rigidbody.js";
import * as Util from "./util.js";

export class Circle extends RigidBody
{
    public readonly radius: number;

    constructor(radius: number, type: Type = Type.Dynamic)
    {
        super(type);

        this.radius = radius;
        this.inertia = Util.calculateCircleInertia(radius, this.mass);
    }
}