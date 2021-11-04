import { Collider, Type } from "./collider.js";
import { Vector2 } from "./math.js";
export class Polygon extends Collider {
    constructor(vertices, resetPosition = true, name = "poly") {
        super(Type.Polygon, name);
        this.vertices = vertices;
        this._mass = 200;
        this._invMass = 1 / this.mass;
        const h = 100;
        const w = 100;
        this._inertia = (w * w + h * h) * this._mass / 12;
        this._invInertia = 1 / this._inertia;
        this._cm = new Vector2(0, 0);
        for (let i = 0; i < this.count; i++) {
            this._cm.x += this.vertices[i].x;
            this._cm.y += this.vertices[i].y;
        }
        this._cm.x /= this.count;
        this._cm.y /= this.count;
        for (let i = 0; i < this.count; i++) {
            this.vertices[i].x -= this._cm.x;
            this.vertices[i].y -= this._cm.y;
        }
        if (!resetPosition)
            this.translate(this._cm);
        this._cm.x = 0;
        this._cm.y = 0;
    }
    get count() {
        return this.vertices.length;
    }
    getGlobalVertices() {
        const transform = this.localToGlobal();
        let res = [];
        for (let i = 0; i < this.count; i++)
            res.push(transform.mulVector(this.vertices[i], 1));
        return res;
    }
}
