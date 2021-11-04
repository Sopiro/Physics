import { Collider, Type } from "./collider.js";
import { Vector2 } from "./math.js";
export class Circle extends Collider {
    constructor(center, radius, name = "ball") {
        super(Type.Circle, name);
        this._mass = 10;
        this._invMass = 1 / this.mass;
        this._inertia = this.mass * radius * radius / 2;
        this._invInertia = 1 / this._inertia;
        this.translate(center);
        this._cm = new Vector2(0, 0);
        this.radius = radius;
    }
}
