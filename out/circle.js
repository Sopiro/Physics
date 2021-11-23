import { RigidBody, Shape, Type } from "./rigidbody.js";
import * as Util from "./util.js";
export class Circle extends RigidBody {
    constructor(center, radius, type = Type.Normal) {
        super(Shape.Circle, type);
        this.radius = radius;
        this.inertia = Util.calculateCircleInertia(radius, this.mass);
        this.position = center.copy();
    }
}
