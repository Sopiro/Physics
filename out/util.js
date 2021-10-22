import { Circle } from "./circle.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
export function createRandomConvexCollider(radius = 50, numVertices = -1) {
    if (numVertices < 0)
        numVertices = Math.trunc(Math.random() * 10);
    if (numVertices == 0)
        return new Circle(new Vector2(), radius);
    numVertices += 2;
    let angles = [];
    for (let i = 0; i < numVertices; i++)
        angles.push(Math.random() * Math.PI * 2);
    angles.sort();
    return new Polygon(angles.map((angle) => {
        return new Vector2(Math.cos(angle), Math.sin(angle)).mulS(radius);
    }));
}
