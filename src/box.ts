import { Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import * as Util from "./util.js";
import { Settings } from "./settings.js";

export class Box extends Polygon
{
    public readonly width;
    public readonly height;

    constructor(width: number, height: number = width, type: Type = Type.Dynamic, density: number = Settings.defaultDensity)
    {
        super([new Vector2(0, 0), new Vector2(0, height), new Vector2(width, height), new Vector2(width, 0)], type, true, density);

        this.width = width;
        this.height = height;
    }

    override get mass(): number
    {
        return this._mass;
    }

    // This will automatically set the inertia
    override set mass(mass: number)
    {
        Util.assert(mass > 0);

        this._density = mass / this.area;
        this._mass = mass;
        this._invMass = 1.0 / this._mass;
        this._inertia = Util.calculateBoxInertia(this.width, this.height, this._mass);
        this._invInertia = 1.0 / this._inertia;
    }

    override get density(): number
    {
        return this._density;
    }

    // This will automatically set the mass and inertia
    override set density(density: number)
    {
        Util.assert(density > 0);

        this._density = density;
        this._mass = density * this.area;
        this._invMass = 1.0 / this._mass;
        this._inertia = Util.calculateBoxInertia(this.width, this.height, this._mass);
        this._invInertia = 1.0 / this._inertia;
    }
}