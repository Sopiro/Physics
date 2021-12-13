import { RigidBody, Type } from "./rigidbody.js";
import * as Util from "./util.js";
export class Circle extends RigidBody {
    constructor(radius, type = Type.Dynamic) {
        super(type);
        this.radius = radius;
        this.area = Math.PI * this.radius * this.radius;
        this.inertia = Util.calculateCircleInertia(radius, this.mass);
        this._density = this.mass / this.area;
    }
    get mass() {
        return super.mass;
    }
    // This will automatically set the inertia
    set mass(mass) {
        super.mass = mass;
        super.inertia = Util.calculateCircleInertia(this.radius, mass);
        this._density = mass / this.area;
    }
    get density() {
        return this._density;
    }
    // This will automatically set the mass and inertia
    set density(density) {
        super.mass = density * this.area;
        super.inertia = Util.calculateCircleInertia(this.radius, this.mass);
        this._density = density;
    }
}
