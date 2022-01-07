import { RigidBody, Type } from "./rigidbody.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
export class Circle extends RigidBody {
    constructor(radius, type = Type.Dynamic, density = Settings.defaultDensity) {
        super(type);
        this.radius = radius;
        this.area = Math.PI * this.radius * this.radius;
        if (this.type == Type.Dynamic) {
            super.density = density;
            super.mass = super.density * this.area;
            super.inertia = Util.calculateCircleInertia(radius, this.mass);
        }
    }
    get mass() {
        return super.mass;
    }
    // This will automatically set the inertia
    set mass(mass) {
        super.density = mass / this.area;
        super.mass = mass;
        super.inertia = Util.calculateCircleInertia(this.radius, mass);
    }
    get density() {
        return super.density;
    }
    // This will automatically set the mass and inertia
    set density(density) {
        super.density = density;
        super.mass = density * this.area;
        super.inertia = Util.calculateCircleInertia(this.radius, this.mass);
    }
}
