import { Collider, Type } from "./collider.js";
import { Vector2 } from "./math.js";
export class Circle extends Collider {
    constructor(center, radius) {
        super(Type.Circle);
        this.translate(center);
        this.center = new Vector2(0, 0);
        this.radius = radius;
    }
}
