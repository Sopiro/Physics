import { Circle } from "./circle.js";
import { Collider, Type } from "./collider.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";

export function subPolygon(p1: Polygon, p2: Polygon): Polygon
{
    let res: Vector2[] = [];

    for (let i = 0; i < p1.count; i++)
    {
        let p1v = p1.localToGlobal().mulVector(p1.vertices[i], 1);
        for (let j = 0; j < p2.count; j++)
        {
            let p2v = p2.localToGlobal().mulVector(p2.vertices[j], 1);

            res.push(p1v.subV(p2v));
        }
    }

    return new Polygon(res, Type.Normal, false);
}

export function toFixed(value: number): number
{
    return Math.round(value * 1e9) / 1e9;
}

export interface UV
{
    u: number;
    v: number;
}

// Project point p to edge ab, calculate barycentric weights and return it
export function getUV(a: Vector2, b: Vector2, p: Vector2): UV
{
    let dir = b.subV(a);
    const len = dir.getLength();
    dir.normalize();

    const region = dir.dot(p.subV(a)) / len;

    return { u: 1 - region, v: region };
}

// Linearly combine(interpolate) the vector using weights u, v
export function lerpVector(a: Vector2, b: Vector2, uv: UV): Vector2
{
    return a.mulS(uv.u).addV(b.mulS(uv.v));
}

export function createRandomConvexCollider(radius: number = 50, numVertices: number = -1): Collider
{
    if (numVertices < 0)
        numVertices = Math.trunc(Math.random() * 7);

    if (numVertices == 0)
        return new Circle(new Vector2(), radius);

    numVertices += 2;

    let angles: number[] = [];

    for (let i = 0; i < numVertices; i++)
        angles.push(Math.random() * Math.PI * 2);

    angles.sort();

    let res = new Polygon(angles.map((angle) =>
    {
        return new Vector2(Math.cos(angle), Math.sin(angle)).mulS(radius);
    }));

    res.mass = 20;
    res.inertia = res.mass * (radius * radius * 2) / 12.0;

    return res;
}

export interface Pair<A, B>
{
    p1: A;
    p2: B;
}

export function random(left: number = -1, right: number = 1): number
{
    if (left > right)
    {
        let tmp = right;
        right = left;
        left = tmp;
    }

    let range = right - left;
    return Math.random() * range + left
}

export function clamp(value: number, min: number, max: number)
{
    if (value < min) return min;
    else if (value > max) return max;
    else return value;
}

export function cross(scalar: number, vector: Vector2): Vector2
{
    return new Vector2(-scalar * vector.y, scalar * vector.x);
}

export function calculateBoxInertia(w: number, h: number, mass: number)
{
    return (w * w + h * h) * mass / 12;
}