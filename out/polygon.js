import { Matrix3, Vector2 } from "./math.js";
export class Polygon {
    constructor(vertices, resetPosition = true) {
        this.vertices = vertices;
        this.count = vertices.length;
        this.cm = new Vector2(0, 0);
        this._translation = new Vector2(0, 0);
        this._rotation = 0;
        this._scale = new Vector2(1, 1);
        for (let i = 0; i < this.count; i++) {
            this.cm.x += this.vertices[i].x;
            this.cm.y += this.vertices[i].y;
        }
        this.cm.x /= this.count;
        this.cm.y /= this.count;
        for (let i = 0; i < this.count; i++) {
            this.vertices[i].x -= this.cm.x;
            this.vertices[i].y -= this.cm.y;
        }
        if (!resetPosition)
            this.translate(this.cm);
        this.cm.x = 0;
        this.cm.y = 0;
    }
    setPosition(p) {
        this._translation.x = p.x;
        this._translation.y = p.y;
    }
    translate(t) {
        this._translation.x += t.x;
        this._translation.y += t.y;
    }
    setRotation(r) {
        this._rotation = r;
    }
    rotate(r) {
        this._rotation += r;
    }
    setScale(s) {
        this._scale.x = s.x;
        this._scale.y = s.y;
    }
    scale(s) {
        this._scale.x *= s.x;
        this._scale.y *= s.y;
    }
    localToGlobal() {
        return new Matrix3().translate(this._translation.x, this._translation.y)
            .rotate(this._rotation)
            .scale(this._scale.x, this._scale.y);
    }
    getGlobalVertices() {
        const transform = this.localToGlobal();
        let res = [];
        for (let i = 0; i < this.count; i++)
            res.push(transform.mulVector(this.vertices[i], 1));
        return res;
    }
    globalToLocal() {
        return new Matrix3().scale(1.0 / this._scale.x, 1.0 / this._scale.y)
            .rotate(-this._rotation)
            .translate(-this._translation.x, -this._translation.y);
    }
}
