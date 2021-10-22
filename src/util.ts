import { Circle } from "./circle.js";
import { Collider } from "./collider.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";

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

export function lerpVertex(a: Vector2, b: Vector2, u: number, v: number): Vector2
{
    return a.mulS(u).addV(b.mulS(v));
}

export function createRandomConvexCollider(radius: number = 50, numVertices: number = -1): Collider
{
    if (numVertices < 0)
        numVertices = Math.trunc(Math.random() * 10);

    if (numVertices == 0)
        return new Circle(new Vector2(), radius);

    numVertices += 2;

    let angles: number[] = [];

    for (let i = 0; i < numVertices; i++)
        angles.push(Math.random() * Math.PI * 2);

    angles.sort();

    return new Polygon(angles.map((angle) =>
    {
        return new Vector2(Math.cos(angle), Math.sin(angle)).mulS(radius);
    }));
}

export interface Pair<A, B>
{
    p1: A;
    p2: B;
}