import { Constraint } from "./constraint.js";
export class Joint extends Constraint {
    constructor(bodyA, bodyB) {
        super(bodyA, bodyB);
        this.drawAnchor = true;
        this.drawConnectionLine = true;
        this.id = -1;
    }
}
// Children: Revolute, Prismatic, Distance, Max distance, Weld, Line, Angle, Grab
