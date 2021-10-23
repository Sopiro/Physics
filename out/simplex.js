import { getUV, lerpVector } from "./util.js";
export class Simplex {
    constructor() {
        this.vertices = [];
        this.supports = [];
    }
    get count() {
        return this.vertices.length;
    }
    clear() {
        this.vertices = [];
        this.supports = [];
    }
    // Returns the closest point to the input q
    getClosest(q) {
        switch (this.count) {
            case 1: // 0-Simplex: Point
                return { result: this.vertices[0], info: [0] };
            case 2: // 1-Simplex: Line segment
                {
                    const a = this.vertices[0];
                    const b = this.vertices[1];
                    const w = getUV(a, b, q);
                    if (w.v <= 0)
                        return { result: a, info: [0] };
                    else if (w.v >= 1)
                        return { result: b, info: [1] };
                    else
                        return { result: lerpVector(a, b, w), info: [0, 1] };
                }
            case 3: // 2-Simplex: Triangle
                {
                    const a = this.vertices[0];
                    const b = this.vertices[1];
                    const c = this.vertices[2];
                    const wab = getUV(a, b, q);
                    const wbc = getUV(b, c, q);
                    const wca = getUV(c, a, q);
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
                            result: lerpVector(a, b, wab),
                            info: area != 0 ? [0, 1] : [0, 1, 2]
                        };
                    }
                    else if (wbc.u > 0 && wbc.v > 0 && u * area <= 0) // On the BC edge
                     {
                        return {
                            result: lerpVector(b, c, wbc),
                            info: area != 0 ? [1, 2] : [0, 1, 2]
                        };
                    }
                    else if (wca.u > 0 && wca.u > 0 && v * area <= 0) // On the CA edge
                     {
                        return {
                            result: lerpVector(c, a, wca),
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
    addVertex(vertex, supportPoints) {
        if (this.count >= 3)
            throw "2-simplex can have verticies less than 4";
        this.vertices.push(vertex);
        if (supportPoints != undefined)
            this.supports.push(supportPoints);
    }
    removeVertex(index) {
        if (this.count == 0)
            throw "no vertex to remove";
        this.vertices.splice(index, 1);
        this.supports.splice(index, 1);
    }
    // Return true if this simplex contains input vertex
    containsVertex(vertex) {
        for (let i = 0; i < this.count; i++) {
            if (vertex.equals(this.vertices[i]))
                return true;
        }
        return false;
    }
}
