import { RigidBody, Type } from "./rigidbody.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
export class Circle extends RigidBody {
    constructor(radius, type = Type.Dynamic, density = Settings.defaultDensity) {
        super(type);
        this.radius = radius;
        this.area = Math.PI * this.radius * this.radius;
        if (this.type == Type.Dynamic) {
            Util.assert(density > 0);
            this._density = density;
            this._mass = density * this.area;
            this._invMass = 1.0 / this._mass;
            this._inertia = Util.calculateCircleInertia(this.radius, this._mass);
            this._invInertia = 1.0 / this._inertia;
        }
    }
    get mass() {
        return this._mass;
    }
    // This will automatically set the inertia
    set mass(mass) {
        Util.assert(mass > 0);
        this._density = mass / this.area;
        this._mass = mass;
        this._invMass = 1.0 / this._mass;
        this._inertia = Util.calculateCircleInertia(this.radius, this._mass);
        this._invInertia = 1.0 / this._inertia;
    }
    get density() {
        return this._density;
    }
    // This will automatically set the mass and inertia
    set density(density) {
        Util.assert(density > 0);
        this._density = density;
        this._mass = density * this.area;
        this._invMass = 1.0 / this._mass;
        this._inertia = Util.calculateCircleInertia(this.radius, this._mass);
        this._invInertia = 1.0 / this._inertia;
    }
}
