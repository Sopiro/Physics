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
            Util.assert(density > 0);
            this._density = density;
            this._mass = density * this.area;
            this._invMass = 1.0 / this._mass;
            this._inertia = Util.calculateConvexPolygonInertia(this.vertices, this._mass, this.area);
            this._invInertia = 1.0 / this._inertia;
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
        return this._mass;
    }
    // This will automatically set the inertia
    set mass(mass) {
        Util.assert(mass > 0);
        this._density = mass / this.area;
        this._mass = mass;
        this._invMass = 1.0 / this._mass;
        this._inertia = Util.calculateConvexPolygonInertia(this.vertices, this._mass, this.area);
        this._invInertia = 1.0 / this._inertia;
    }
    get density() {
        return this._density;
    }
    // This will automatically set the mass and inertia
    set density(density) {
        Util.assert(density > 0);
        this._density = density;
        this._mass = density * this.area;
        this._invMass = 1.0 / this._mass;
        this._inertia = Util.calculateConvexPolygonInertia(this.vertices, this._mass, this.area);
        this._invInertia = 1.0 / this._inertia;
    }
}
