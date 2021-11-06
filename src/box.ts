import { Type } from "./collider.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import * as Util from "./util.js";

export class Box extends Polygon
{
    constructor(position: Vector2, wh: Vector2, type: Type = Type.Normal, centered: boolean = true)
    {
        super([new Vector2(0, 0), new Vector2(0, wh.y), wh.copy(), new Vector2(wh.x, 0)], type);
        this.translate(position);

        if (!centered)
            this.translate(wh.copy().divS(2));

        if (type == Type.Normal)
        {
            this.mass = 200;
            this.inertia = Util.calculateBoxInertia(wh.x, wh.y, this.mass);
        }
    }
}