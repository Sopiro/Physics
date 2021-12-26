import { RigidBody, Type } from "./rigidbody.js";
import * as Util from "./util.js";

export class Circle extends RigidBody
{
    public readonly radius: number;
    public readonly area: number;
    protected _density: number;

    constructor(radius: number, type: Type = Type.Dynamic)
    {
        super(type);

        this.radius = radius;
        
        this.area = Math.PI * this.radius * this.radius;
        this.inertia = Util.calculateCircleInertia(radius, this.mass);
        this._density = this.mass / this.area;
    }

    get mass(): number
    {
        return super.mass;
    }

    // This will automatically set the inertia
    set mass(mass: number)
    {
        super.mass = mass;
        super.inertia = Util.calculateCircleInertia(this.radius, mass);
        this._density = mass / this.area;
    }

    get density(): number
    {
        return this._density;
    }

    // This will automatically set the mass and inertia
    set density(density: number) //kg/m²
    {
        super.mass = density * this.area;
        super.inertia = Util.calculateCircleInertia(this.radius, this.mass);
        this._density = density;
    }
}