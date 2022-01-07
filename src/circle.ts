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
        
        if(this.type == Type.Dynamic)
        {
            super.density = density;
            super.mass = super.density * this.area;
            super.inertia = Util.calculateCircleInertia(radius, this.mass);
        }
    }

    get mass(): number
    {
        return super.mass;
    }

    // This will automatically set the inertia
    set mass(mass: number)
    {
        super.density = mass / this.area;
        super.mass = mass;
        super.inertia = Util.calculateCircleInertia(this.radius, mass);
    }

    get density(): number
    {
        return super.density;
    }

    // This will automatically set the mass and inertia
    set density(density: number) //kg/m²
    {
        super.density = density;
        super.mass = density * this.area;
        super.inertia = Util.calculateCircleInertia(this.radius, this.mass);
    }
}