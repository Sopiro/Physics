import { Collider, Type } from "./collider.js";
import { Vector2 } from "./math.js";

export class Circle extends Collider
{
    public readonly center: Vector2;
    public readonly radius: number;

    constructor(center: Vector2, radius: number, name = "ball")
    {
        super(Type.Circle, name);

        this.translate(center);
        this.center = new Vector2(0, 0);
        this.radius = radius;
    }
}