import { Box } from "./box.js";
import { Circle } from "./circle.js";
import { Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import { Settings } from "./settings.js";
export function subPolygon(p1, p2) {
    let res = [];
    for (let i = 0; i < p1.count; i++) {
        let p1v = p1.localToGlobal.mulVector2(p1.vertices[i], 1);
        for (let j = 0; j < p2.count; j++) {
            let p2v = p2.localToGlobal.mulVector2(p2.vertices[j], 1);
            res.push(p1v.sub(p2v));
        }
    }
    return new Polygon(res, Type.Dynamic, false);
}
export function toFixed(value, limit = 1e-13) {
    return Math.round(value / limit) * limit;
}
// Project point p to edge ab, calculate barycentric weights and return it
export function getUV(a, b, p) {
    let dir = b.sub(a);
    const len = dir.length;
    dir.normalize();
    const region = dir.dot(p.sub(a)) / len;
    return { u: 1 - region, v: region };
}
// Linearly combine(interpolate) the vector using weights u, v
export function lerpVector(a, b, uv) {
    return a.mul(uv.u).add(b.mul(uv.v));
}
export function createRandomConvexBody(radius = 50, numVertices = -1) {
    if (numVertices < 0)
        numVertices = Math.trunc(Math.random() * Settings.randonConvexMaxVertices);
    if (numVertices == 0)
        return new Circle(radius);
    if (numVertices == Settings.randonConvexMaxVertices - 1)
        return new Box(radius * 2, radius * 2);
    numVertices += 2;
    let angles = [];
    for (let i = 0; i < numVertices; i++)
        angles.push(Math.random() * Math.PI * 2);
    angles.sort();
    let res = new Polygon(angles.map((angle) => {
        return new Vector2(Math.cos(angle), Math.sin(angle)).mul(radius);
    }));
    return res;
}
export function createRegularPolygon(radius, numVertices = -1) {
    if (numVertices < 3)
        numVertices = Math.trunc(random(3, Settings.regularPolygonMaxVertices));
    let angleStart = Math.PI / 2;
    let angle = Math.PI * 2 / numVertices;
    if ((numVertices % 2) == 0)
        angleStart += angle / 2;
    let vertices = [];
    for (let i = 0; i < numVertices; i++) {
        let currentAngle = angleStart + angle * i;
        vertices.push(new Vector2(Math.cos(currentAngle), Math.sin(currentAngle)).mul(radius * 1.4142));
    }
    return new Polygon(vertices, Type.Dynamic);
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
    // return Math.max(min, Math.min(value, max));
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
    return (width * width + height * height) * mass / 12.0;
}
export function calculateCircleInertia(radius, mass) {
    return mass * radius * radius / 2.0;
}
export function checkInside(b, p) {
    let localP = b.globalToLocal.mulVector2(p, 1);
    if (b instanceof Circle) {
        return localP.length <= b.radius;
    }
    else if (b instanceof Polygon) {
        let poly = b;
        let dir = poly.vertices[0].sub(localP).cross(poly.vertices[1].sub(localP));
        for (let i = 1; i < poly.vertices.length; i++) {
            let nDir = poly.vertices[i].sub(localP).cross(poly.vertices[(i + 1) % poly.count].sub(localP));
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
export function separate_pair(p) {
    let w = Math.floor((Math.sqrt(8 * p + 1) - 1) / 2.0);
    let t = (w * w + w) / 2.0;
    let y = p - t;
    let x = w - y;
    return { p1: x, p2: y };
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
export function mid(a, b) {
    return new Vector2((a.x + b.x) / 2.0, (a.y + b.y) / 2.0);
}
