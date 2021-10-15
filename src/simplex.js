import { Vector2, Vector3, Matrix4, Matrix3 } from "./math.js";

export class Simplex
{
    constructor(vertices)
    {
        this.vertices = vertices;
        this.count = vertices.length;
    }

    getClosest(point)
    {
        switch (this.count)
        {
            case 1: // 0-Simplex: Point
                return this;
            case 2: // 1-Simplex: Line segment
                {
                    const v1 = this.vertices[0];
                    const v2 = this.vertices[1];

                    let dir = v2.subV(v1);
                    const len = dir.getLength();
                    dir.normalize();

                    const region = dir.dot(point.subV(v1)) / len;

                    if (region <= 0)
                        return v1;
                    else if (region >= 1)
                        return v2;
                    else
                        return v1.mulS(1 - region).addV(v2.mulS(region));
                }
            case 3: // 2-Simplex: Triangle

            default:
                return undefined;
        }

    }
}