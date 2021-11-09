import { Vector2 } from "./math.js";
export class Polytope {
    constructor(simplex) {
        if (simplex.count != 3)
            throw "Input simplex isn't a triangle";
        this.vertices = [
            simplex.vertices[0].copy(),
            simplex.vertices[1].copy(),
            simplex.vertices[2].copy()
        ];
        this.supports = [{
                p1: simplex.supports[0].p1.copy(),
                p2: simplex.supports[0].p2.copy()
            },
            {
                p1: simplex.supports[1].p1.copy(),
                p2: simplex.supports[1].p2.copy()
            },
            {
                p1: simplex.supports[2].p1.copy(),
                p2: simplex.supports[2].p2.copy()
            }];
    }
    get count() {
        return this.vertices.length;
    }
    // Returns the edge closest to the origin
    getClosestEdge() {
        let minIndex = 0;
        let minDistance = Infinity;
        let minNormal = new Vector2();
        for (let i = 0; i < this.count; i++) {
            let j = (i + 1) % this.count;
            let vertexI = this.vertices[i];
            let vertexJ = this.vertices[j];
            let edge = vertexJ.subV(vertexI);
            let normal = new Vector2(-edge.y, edge.x).normalized();
            let distance = normal.dot(vertexI);
            if (distance < 0) {
                distance *= -1;
                normal.invert();
            }
            if (distance < minDistance) {
                minDistance = distance;
                minNormal = normal;
                minIndex = i;
            }
        }
        return { index: minIndex, distance: minDistance, normal: minNormal };
    }
}
