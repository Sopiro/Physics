import { Vector2 } from "./math.js";
export class Edge {
    constructor(p1, p2) {
        this.p1 = p1.copy();
        this.p2 = p2.copy();
        if (this.p1.equals(this.p2))
            this.dir = new Vector2(0, 0);
        else
            this.dir = p2.subV(p1).normalized();
    }
    get length() {
        return this.p2.subV(this.p1).getLength();
    }
}
