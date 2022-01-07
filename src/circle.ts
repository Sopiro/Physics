import { RigidBody, Type } from "./rigidbody.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";

export class Circle extends RigidBody
{
    public readonly radius: number;
    public readonly area: number;

    constructor(radius: number, type: Type = Type.Dynamic, density: number = Settings.defaultDensity)
    {
        super(type);

        this.radius = radius;
        this.area = Math.PI * this.radius * this.radius;

        if (this.type == Type.Dynamic)
        {
            Util.assert(density > 0);

            this._density = density;
            this._mass = density * this.area;
            this._invMass = 1.0 / this._mass;
            this._inertia = Util.calculateCircleInertia(this.radius, this._mass);
            this._invInertia = 1.0 / this._inertia;
        }
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
        this._inertia = Util.calculateCircleInertia(this.radius, this._mass);
        this._invInertia = 1.0 / this._inertia;
    }

    override get density(): number
    {
        return this._density;
    }

    // This will automatically set the mass and inertia
    override set density(density: number) //kg/m²
    {
        Util.assert(density > 0);

        this._density = density;
        this._mass = density * this.area;
        this._invMass = 1.0 / this._mass;
        this._inertia = Util.calculateCircleInertia(this.radius, this._mass);
        this._invInertia = 1.0 / this._inertia;
    }
}