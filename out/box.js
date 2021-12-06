import { Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import * as Util from "./util.js";
export class Box extends Polygon {
    constructor(width, height = width, type = Type.Dynamic, centered = true) {
        super([new Vector2(0, 0), new Vector2(0, height), new Vector2(width, height), new Vector2(width, 0)], type);
        this.inertia = Util.calculateBoxInertia(width, height, this.mass);
        if (!centered)
            this.translate(new Vector2(width / 2, height / 2));
    }
}
