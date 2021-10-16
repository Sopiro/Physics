import { Matrix3, Vector2 } from "./math.js";
export class Polygon {
    constructor(vertices) {
        this.vertices = vertices;
        this.count = vertices.length;
        this.cm = new Vector2(0, 0);
        for (let i = 0; i < this.count; i++) {
            this.cm.x += this.vertices[i].x;
            this.cm.y += this.vertices[i].y;
        }
        this.cm.x /= this.count;
        this.cm.y /= this.count;
        this.transform = new Matrix3();
    }
}
