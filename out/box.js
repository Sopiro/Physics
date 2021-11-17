import { Type } from "./collider.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import * as Util from "./util.js";
export class Box extends Polygon {
    constructor(position, wh, type = Type.Normal, centered = true) {
        super([new Vector2(0, 0), new Vector2(0, wh.y), wh.copy(), new Vector2(wh.x, 0)], type);
        this.translate(position);
        if (!centered)
            this.translate(wh.copy().divS(2));
        if (type == Type.Normal) {
            this.mass = 2;
            this.inertia = Util.calculateBoxInertia(wh.x, wh.y, this.mass);
        }
    }
}
