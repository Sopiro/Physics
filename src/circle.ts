import { Collider, Type } from "./collider.js";
import { Vector2 } from "./math.js";

export class Circle extends Collider
{
    public readonly radius: number;

    constructor(center: Vector2, radius: number, name = "ball")
    {
        super(Type.Circle, name);

        this._mass = 200;
        this._invMass = 1 / this.mass;

        this._inertia = this.mass * radius * radius;
        this._invInertia = 1 / this._inertia;

        this.translate(center);
        this._cm = new Vector2(0, 0);

        this.radius = radius;
    }
}