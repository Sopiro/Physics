import { Box } from "./box.js";
import { Circle } from "./circle.js";
import { Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
export function subPolygon(p1, p2) {
    let res = [];
    for (let i = 0; i < p1.count; i++) {
        let p1v = p1.localToGlobal.mulVector(p1.vertices[i], 1);
        for (let j = 0; j < p2.count; j++) {
            let p2v = p2.localToGlobal.mulVector(p2.vertices[j], 1);
            res.push(p1v.subV(p2v));
        }
    }
    return new Polygon(res, Type.Normal, false);
}
export function toFixed(value, limit = 1e-13) {
    return Math.round(value / limit) * limit;
}
// Project point p to edge ab, calculate barycentric weights and return it
export function getUV(a, b, p) {
    let dir = b.subV(a);
    const len = dir.length;
    dir.normalize();
    const region = dir.dot(p.subV(a)) / len;
    return { u: 1 - region, v: region };
}
// Linearly combine(interpolate) the vector using weights u, v
export function lerpVector(a, b, uv) {
    return a.mulS(uv.u).addV(b.mulS(uv.v));
}
const maxVertices = 8;
export function createRandomConvexBody(radius = 50, numVertices = -1) {
    if (numVertices < 0)
        numVertices = Math.trunc(Math.random() * maxVertices);
    if (numVertices == 0)
        return new Circle(radius);
    if (numVertices == maxVertices - 1)
        return new Box(radius * 2, radius * 2);
    numVertices += 2;
    let angles = [];
    for (let i = 0; i < numVertices; i++)
        angles.push(Math.random() * Math.PI * 2);
    angles.sort();
    let res = new Polygon(angles.map((angle) => {
        return new Vector2(Math.cos(angle), Math.sin(angle)).mulS(radius);
    }));
    return res;
}
export function createRegularPolygon(numVertices, radius = 50) {
    if (numVertices < 3)
        numVertices = Math.trunc(random(3, 11));
    let angleStart = Math.PI / 2;
    let angle = Math.PI * 2 / numVertices;
    if ((numVertices % 2) == 0)
        angleStart += angle / 2;
    let vertices = [];
    for (let i = 0; i < numVertices; i++) {
        let currentAngle = angleStart + angle * i;
        vertices.push(new Vector2(Math.cos(currentAngle), Math.sin(currentAngle)).mulS(radius * 1.4142));
    }
    return new Polygon(vertices, Type.Normal);
    ;
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
export function cross(scalar, vector) {
    return new Vector2(-scalar * vector.y, scalar * vector.x);
}
export function calculateBoxInertia(width, height, mass) {
    return (width * width + height * height) * mass / 12;
}
export function calculateCircleInertia(radius, mass) {
    return mass * radius * radius / 2.0;
}
export function checkInside(b, p) {
    let localP = b.globalToLocal.mulVector(p, 1);
    if (b instanceof Circle) {
        return localP.length <= b.radius;
    }
    else if (b instanceof Polygon) {
        let poly = b;
        let dir = poly.vertices[0].subV(localP).cross(poly.vertices[1].subV(localP));
        for (let i = 1; i < poly.vertices.length; i++) {
            let nDir = poly.vertices[i].subV(localP).cross(poly.vertices[(i + 1) % poly.count].subV(localP));
            if (dir * nDir < 0)
                return false;
        }
        return true;
    }
    else {
        throw "Not supported shape";
    }
}
// Cantor pairing function, ((N, N) -> N) mapping function
// https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
export function make_pair_natural(a, b) {
    return (a + b) * (a + b + 1) / 2 + b;
}
export function squared_distance(a, b) {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}
export function map(v, left, right, min, max) {
    const per = (v - left) / (right - left);
    return lerp(min, max, per);
}
export function lerp(left, right, per) {
    return left + (right - left) * per;
}
