import { Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import * as Util from "./util.js";

export class Box extends Polygon
{
    constructor(wh: Vector2, type: Type = Type.Normal, centered: boolean = true)
    {
        super([new Vector2(0, 0), new Vector2(0, wh.y), wh.copy(), new Vector2(wh.x, 0)], type);
        
        this.inertia = Util.calculateBoxInertia(wh.x, wh.y, this.mass);

        if (!centered)
            this.translate(wh.divS(2));
    }
}