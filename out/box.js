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
        return super.mass;
    }
    // This will automatically set the inertia
    set mass(mass) {
        super.density = mass / this.area;
        super.mass = mass;
        super.inertia = Util.calculateBoxInertia(this.width, this.height, mass);
    }
    get density() {
        return super.density;
    }
    // This will automatically set the mass and inertia
    set density(density) {
        super.density = density;
        super.mass = density * (this.width * this.height);
        super.inertia = Util.calculateBoxInertia(this.width, this.height, this.mass);
    }
}
