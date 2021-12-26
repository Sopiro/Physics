import { Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import * as Util from "./util.js";
export class Box extends Polygon {
    constructor(width, height = width, type = Type.Dynamic) {
        super([new Vector2(0, 0), new Vector2(0, height), new Vector2(width, height), new Vector2(width, 0)], type);
        this.width = width;
        this.height = height;
    }
    get mass() {
        return super.mass;
    }
    // This will automatically set the inertia
    set mass(mass) {
        super.mass = mass;
        super.inertia = Util.calculateBoxInertia(this.width, this.height, mass);
        this._density = mass / this.area;
    }
    get density() {
        return this._density;
    }
    // This will automatically set the mass and inertia
    set density(density) {
        super.mass = density * (this.width * this.height);
        super.inertia = Util.calculateBoxInertia(this.width, this.height, this.mass);
        this._density = density;
    }
}
