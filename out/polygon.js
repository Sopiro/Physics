import { RigidBody, Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import * as Util from "./util.js";
// Children: Box
export class Polygon extends RigidBody {
    constructor(vertices, type = Type.Dynamic, resetPosition = true) {
        super(type);
        this.vertices = vertices;
        let centerOfMass = new Vector2(0, 0);
        let count = this.count;
        for (let i = 0; i < count; i++) {
            centerOfMass.x += this.vertices[i].x;
            centerOfMass.y += this.vertices[i].y;
        }
        centerOfMass.x /= count;
        centerOfMass.y /= count;
        let area = 0;
        this.vertices[0].x -= centerOfMass.x;
        this.vertices[0].y -= centerOfMass.y;
        for (let i = 1; i < count; i++) {
            this.vertices[i].x -= centerOfMass.x;
            this.vertices[i].y -= centerOfMass.y;
            area += this.vertices[i - 1].cross(this.vertices[i]);
        }
        area += this.vertices[count - 1].cross(this.vertices[0]);
        this.area = Math.abs(area) / 2.0;
        this._density = this.mass / this.area;
        if (!resetPosition)
            this.translate(centerOfMass);
    }
    repositionCenterOfMass(p) {
        for (let i = 0; i < this.vertices.length; i++) {
            let vertex = this.vertices[i];
            vertex.x -= p.x;
            vertex.y -= p.y;
        }
    }
    get count() {
        return this.vertices.length;
    }
    get mass() {
        return super.mass;
    }
    // This will automatically set the inertia
    set mass(mass) {
        super.mass = mass;
        super.inertia = Util.calculateCircleInertia(Math.sqrt(this.area) / 2.0, mass);
        this._density = mass / this.area;
    }
    get density() {
        return this._density;
    }
    // This will automatically set the mass and inertia
    set density(density) {
        super.mass = density * this.area;
        super.inertia = Util.calculateCircleInertia(Math.sqrt(this.area) / 2.0, this.mass);
        this._density = density;
    }
}
