// Children: ContactManifold, Joint
export class Constraint {
    constructor(bodyA, bodyB) {
        this.beta = 0.0; // Coefficient of position correction (Positional error feedback factor)
        this.gamma = 0.0; // Coefficient of Softness (Force feedback factor)
        this.bodyA = bodyA;
        this.bodyB = bodyB;
    }
}
