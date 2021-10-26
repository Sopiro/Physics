import { Collider, Type } from "./collider.js";
import { Vector2 } from "./math.js";
export class Circle extends Collider {
    constructor(center, radius, name = "ball") {
        super(Type.Circle, name);
        this.translate(center);
        this.center = new Vector2(0, 0);
        this.radius = radius;
    }
}
