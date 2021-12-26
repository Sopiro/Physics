import { Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import * as Util from "./util.js";

export class Box extends Polygon
{
    public readonly width;
    public readonly height;

    constructor(width: number, height: number = width, type: Type = Type.Dynamic)
    {
        super([new Vector2(0, 0), new Vector2(0, height), new Vector2(width, height), new Vector2(width, 0)], type);

        this.width = width;
        this.height = height;
    }

    get mass(): number
    {
        return super.mass;
    }

    // This will automatically set the inertia
    set mass(mass: number)
    {
        super.mass = mass;
        super.inertia = Util.calculateBoxInertia(this.width, this.height, mass);
        this._density = mass / this.area;
    }

    get density(): number
    {
        return this._density;
    }

    // This will automatically set the mass and inertia
    set density(density: number) //kg/m²
    {
        super.mass = density * (this.width * this.height);
        super.inertia = Util.calculateBoxInertia(this.width, this.height, this.mass);
        this._density = density;
    }
}