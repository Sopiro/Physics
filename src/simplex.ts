import { Vector2, Vector3, Matrix4, Matrix3 } from "./math.js";

export interface UV
{
    u: number;
    v: number;
}

export interface ClosestWithInfo
{
    result: Vector2;
    info: number[]; // Vertex indices that are contributed to calculate the closest point
}

export class Simplex
{
    public vertices: Vector2[];
    public count: number;

    constructor(vertices: Vector2[] = [])
    {
        this.vertices = vertices;
        this.count = vertices.length;
    }

    clear(): void
    {
        this.vertices = [];
        this.count = 0;
    }

    // Returns barycentric weights u, v
    getUV(a: Vector2, b: Vector2, p: Vector2): UV
    {
        let dir = b.subV(a);
        const len = dir.getLength();
        dir.normalize();

        const region = dir.dot(p.subV(a)) / len;

        return { u: 1 - region, v: region };
    }

    // Returns the closest point to the input q
    getClosest(q: Vector2): ClosestWithInfo
    {
        switch (this.count)
        {
            case 1: // 0-Simplex: Point
                return { result: this.vertices[0], info: [0] };
            case 2: // 1-Simplex: Line segment
                {
                    const a = this.vertices[0];
                    const b = this.vertices[1];
                    const w = this.getUV(a, b, q);

                    if (w.v <= 0)
                        return { result: a, info: [0] };
                    else if (w.v >= 1)
                        return { result: b, info: [1] };
                    else
                        return { result: a.mulS(w.u).addV(b.mulS(w.v)), info: [0, 1] };
                }
            case 3: // 2-Simplex: Triangle
                {
                    const a = this.vertices[0];
                    const b = this.vertices[1];
                    const c = this.vertices[2];

                    const wab = this.getUV(a, b, q);
                    const wbc = this.getUV(b, c, q);
                    const wca = this.getUV(c, a, q);

                    if (wca.u <= 0 && wab.v <= 0) // A area
                        return { result: a, info: [0] };
                    else if (wab.u <= 0 && wbc.v <= 0) // B area
                        return { result: b, info: [1] };
                    else if (wbc.u <= 0 && wca.v <= 0) // C area
                        return { result: c, info: [2] };

                    const area = b.subV(a).cross(c.subV(a));

                    // If area == 0, 3 vertices are in collinear position, which means all aligned in a line

                    const u = b.subV(q).cross(c.subV(q));
                    const v = c.subV(q).cross(a.subV(q));
                    const w = a.subV(q).cross(b.subV(q));

                    if (wab.u > 0 && wab.v > 0 && w * area <= 0) // On the AB edge
                    {
                        return {
                            result: a.mulS(wab.u).addV(b.mulS(wab.v)),
                            info: area != 0 ? [0, 1] : [0, 1, 2]
                        };
                    }
                    else if (wbc.u > 0 && wbc.v > 0 && u * area <= 0) // On the BC edge
                    {
                        return {
                            result: b.mulS(wbc.u).addV(c.mulS(wbc.v)),
                            info: area != 0 ? [1, 2] : [0, 1, 2]
                        };
                    }
                    else if (wca.u > 0 && wca.u > 0 && v * area <= 0) // On the CA edge
                    {
                        return {
                            result: c.mulS(wca.u).addV(a.mulS(wca.v)),
                            info: area != 0 ? [2, 0] : [0, 1, 2]
                        };
                    }
                    else // Inside the triangle
                    {
                        return { result: q, info: [] };
                    }
                }

            default:
                throw "Error: Simplex constains vertices more than 3";
        }
    }

    addVertex(vertex: Vector2): void
    {
        if (this.count >= 3) throw "error";

        this.vertices.push(vertex);
        this.count++;
    }

    removeVertex(index: number): void
    {
        this.vertices.splice(index, 1);
        this.count--;
    }

    // Return true if this simplex contains input vertex
    containsVertex(vertex: Vector2): boolean
    {
        for (let i = 0; i < this.count; i++)
        {
            if (vertex.equals(this.vertices[i]))
                return true;
        }

        return false;
    }
}