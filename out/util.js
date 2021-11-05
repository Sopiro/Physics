import { Circle } from "./circle.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
export function subPolygon(p1, p2) {
    let res = [];
    for (let i = 0; i < p1.count; i++) {
        let p1v = p1.localToGlobal().mulVector(p1.vertices[i], 1);
        for (let j = 0; j < p2.count; j++) {
            let p2v = p2.localToGlobal().mulVector(p2.vertices[j], 1);
            res.push(p1v.subV(p2v));
        }
    }
    return new Polygon(res, false);
}
export function toFixed(value) {
    return Math.round(value * 1e9) / 1e9;
}
// Project point p to edge ab, calculate barycentric weights and return it
export function getUV(a, b, p) {
    let dir = b.subV(a);
    const len = dir.getLength();
    dir.normalize();
    const region = dir.dot(p.subV(a)) / len;
    return { u: 1 - region, v: region };
}
// Linearly combine(interpolate) the vector using weights u, v
export function lerpVector(a, b, uv) {
    return a.mulS(uv.u).addV(b.mulS(uv.v));
}
export function createRandomConvexCollider(radius = 50, numVertices = -1) {
    if (numVertices < 0)
        numVertices = Math.trunc(Math.random() * 7);
    if (numVertices == 0)
        return new Circle(new Vector2(), radius);
    numVertices += 2;
    let angles = [];
    for (let i = 0; i < numVertices; i++)
        angles.push(Math.random() * Math.PI * 2);
    angles.sort();
    let res = new Polygon(angles.map((angle) => {
        return new Vector2(Math.cos(angle), Math.sin(angle)).mulS(radius);
    }));
    res.inertia = res.mass * (radius * radius * 2) / 12.0;
    return res;
}
export function random(left = -1, right = 1) {
    if (left > right) {
        let tmp = right;
        right = left;
        left = tmp;
    }
    let range = right - left;
    return Math.random() * range + left;
}
export function clamp(value, min, max) {
    if (value < min)
        return min;
    else if (value > max)
        return max;
    else
        return value;
}
export function createBox(position, wh, name = "box", centered = true) {
    let box = new Polygon([new Vector2(0, 0), new Vector2(0, wh.y), wh.copy(), new Vector2(wh.x, 0)], true, name);
    box.translate(position);
    if (!centered)
        box.translate(wh.copy().divS(2));
    return box;
}
export function cross(scalar, vector) {
    return new Vector2(-scalar * vector.y, scalar * vector.x);
}
