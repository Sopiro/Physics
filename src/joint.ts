import * as Util from "./util.js";
import { Constraint } from "./constraint.js";
import { RigidBody } from "./rigidbody.js";
import { Settings } from "./settings.js";

// Children: Revolute, Prismatic, Distance, Max distance, Weld, Motor, Line, Angle, Grab
export abstract class Joint extends Constraint
{
    public drawAnchor = true;
    public drawConnectionLine = true;
    public id: number = -1;

    private _frequency: number;
    private _dampingRatio: number;
    private _jointMass: number;

    /*
    * Equation of motion for the damped harmonic oscillator
    * a = d²x/dt²
    * v = dx/dt
    *
    * ma + cv + kx = 0
    * 
    * c = damping coefficient for springy motion
    * m = mass 
    * k = spring constant
    *
    * a + 2ζωv + ω²x = 0
    * 
    * ζ = damping ratio
    * ω = angular frequecy
    * 
    * 2ζω = c / m
    * ω² = k / m
    * 
    * Constraint equation
    * J·v + (β/h)·C(x) + (γ/h)·λ = 0 
    * 
    * h = dt
    * C(x) = Posiitonal error 
    * λ = Corrective impulse
    *  
    * β = hk / (c + hk)
    * γ = 1 / (c + hk)
    * 
    * More reading:
    * https://box2d.org/files/ErinCatto_SoftConstraints_GDC2011.pdf
    * https://pybullet.org/Bullet/phpBB3/viewtopic.php?f=4&t=1354
    */
    constructor(bodyA: RigidBody, bodyB: RigidBody, frequency = 15, dampingRatio = 1.0, jointMass = -1)
    {
        super(bodyA, bodyB);

        this._frequency = frequency <= 0 ? 0.1 : frequency;
        this._dampingRatio = Util.clamp(dampingRatio, 0.0, 1.0);
        this._jointMass = jointMass <= 0 ? bodyB.mass : jointMass;

        this.calculateBetaAndGamma();
    }

    private calculateBetaAndGamma()
    {
        let omega = 2 * Math.PI * this._frequency;
        let d = 2 * this._jointMass * this._dampingRatio * omega; // Damping coefficient
        let k = this._jointMass * omega * omega; // Spring constant
        let h = Settings.dt;

        this.beta = h * k / (d + h * k);
        this.gamma = 1.0 / ((d + h * k) * h);
    }

    get frequency(): number
    {
        return this._frequency;
    }

    set frequency(frequency: number)
    {
        this._frequency = frequency <= 0 ? 0.1 : frequency;
        this.calculateBetaAndGamma();
    }

    get dampingRatio(): number
    {
        return this._frequency;
    }

    set dampingRatio(dampingRatio: number)
    {
        this._dampingRatio = Util.clamp(dampingRatio, 0.0, 1.0);
        this.calculateBetaAndGamma();
    }

    get jointMass(): number
    {
        return this._frequency;
    }

    set jointMass(jointMass: number)
    {
        this._jointMass = jointMass <= 0 ? this.bodyB.mass : jointMass;
        this.calculateBetaAndGamma();
    }
}