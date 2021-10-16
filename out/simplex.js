export class Simplex {
    constructor(vertices) {
        this.vertices = vertices;
        this.count = vertices.length;
    }
    // Returns barycentric weights u, v
    getUV(a, b, p) {
        let dir = b.subV(a);
        const len = dir.getLength();
        dir.normalize();
        const region = dir.dot(p.subV(a)) / len;
        return { u: 1 - region, v: region };
    }
    getClosest(p) {
        switch (this.count) {
            case 1: // 0-Simplex: Point
                return this.vertices[0];
            case 2: // 1-Simplex: Line segment
                {
                    const a = this.vertices[0];
                    const b = this.vertices[1];
                    const w = this.getUV(a, b, p);
                    if (w.v <= 0)
                        return a;
                    else if (w.v >= 1)
                        return b;
                    else
                        return a.mulS(w.u).addV(b.mulS(w.v));
                }
            case 3: // 2-Simplex: Triangle
                {
                    const a = this.vertices[0];
                    const b = this.vertices[1];
                    const c = this.vertices[2];
                    const wab = this.getUV(a, b, p);
                    const wbc = this.getUV(b, c, p);
                    const wca = this.getUV(c, a, p);
                    if (wca.u <= 0 && wab.v <= 0)
                        return a;
                    else if (wab.u <= 0 && wbc.v <= 0)
                        return b;
                    else if (wbc.u <= 0 && wca.v <= 0)
                        return c;
                    const area = b.subV(a).cross(c.subV(a));
                    const u = b.subV(p).cross(c.subV(p)) / area;
                    const v = c.subV(p).cross(a.subV(p)) / area;
                    const w = a.subV(p).cross(b.subV(p)) / area;
                    if (wab.u > 0 && wab.v > 0 && w <= 0)
                        return a.mulS(wab.u).addV(b.mulS(wab.v));
                    else if (wbc.u > 0 && wbc.v > 0 && u <= 0)
                        return b.mulS(wbc.u).addV(c.mulS(wbc.v));
                    else if (wca.u > 0 && wca.u > 0 && v <= 0)
                        return c.mulS(wca.u).addV(a.mulS(wca.v));
                    else
                        return p;
                }
            default:
                return undefined;
        }
    }
}
