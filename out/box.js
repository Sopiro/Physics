import { Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import * as Util from "./util.js";
import { Settings } from "./settings.js";
export class Box extends Polygon {
    constructor(width, height = width, type = Type.Dynamic, density = Settings.defaultDensity) {
        super([new Vector2(0, 0), new Vector2(0, height), new Vector2(width, height), new Vector2(width, 0)], type, true, density);
        this.width = width;
        this.height = height;
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
        this._inertia = Util.calculateBoxInertia(this.width, this.height, this._mass);
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
        this._inertia = Util.calculateBoxInertia(this.width, this.height, this._mass);
        this._invInertia = 1.0 / this._inertia;
    }
}
