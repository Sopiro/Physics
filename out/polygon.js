import { Collider, Type } from "./collider.js";
import { Vector2 } from "./math.js";
export class Polygon extends Collider {
    constructor(vertices, resetPosition = true) {
        super(Type.Polygon);
        this.vertices = vertices;
        this.cm = new Vector2(0, 0);
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
    get count() {
        return this.vertices.length;
    }
    getGlobalVertices() {
        const transform = this.localToGlobal;
        let res = [];
        for (let i = 0; i < this.count; i++)
            res.push(transform.mulVector(this.vertices[i], 1));
        return res;
    }
}
