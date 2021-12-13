import { Constraint } from "./constraint.js";
export class Joint extends Constraint {
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
    constructor(bodyA, bodyB) {
        super(bodyA, bodyB);
        this.drawAnchor = true;
        this.drawConnectionLine = true;
        this.id = -1;
    }
}
// Children: Revolute, Prismatic, Distance, Max distance, Weld, Motor, Line, Angle, Grab
