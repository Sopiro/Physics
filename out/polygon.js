import { RigidBody, Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import * as Util from "./util.js";
import { Settings } from "./settings.js";
// Children: Box
export class Polygon extends RigidBody {
    constructor(vertices, type = Type.Dynamic, resetPosition = true, density = Settings.defaultDensity) {
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
        if (this.type == Type.Dynamic) {
            super.density = density;
            super.mass = super.density * this.area;
            super.inertia = Util.calculateConvexPolygonInertia(this.vertices, this.mass, this.area);
        }
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
        super.density = mass / this.area;
        super.mass = mass;
        super.inertia = Util.calculateConvexPolygonInertia(this.vertices, this.mass, this.area);
    }
    get density() {
        return super.density;
    }
    // This will automatically set the mass and inertia
    set density(density) {
        super.density = density;
        super.mass = density * this.area;
        super.inertia = Util.calculateConvexPolygonInertia(this.vertices, this.mass, this.area);
    }
}
