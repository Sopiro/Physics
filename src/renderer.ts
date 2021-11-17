import { Circle } from "./circle.js";
import { Collider } from "./collider.js";
import { Matrix3, Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import { Simplex } from "./simplex.js";
import { AABB } from "./detection.js";

export class Renderer
{
    private gfx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private cameraTransform: Matrix3;
    private modelTransform: Matrix3;

    constructor(gfx: CanvasRenderingContext2D, width: number, height: number)
    {
        this.gfx = gfx;
        this.width = width;
        this.height = height;
        this.cameraTransform = new Matrix3();
        this.modelTransform = new Matrix3();
    }

    log(content: any, line: number = 0): void
    {
        let y = 80 + line * 20;
        this.drawText(30, y, content);
    }

    setCameraTransform(cameraTransfrom: Matrix3): void
    {
        this.cameraTransform = cameraTransfrom;
    }

    resetCameraTransform(): void
    {
        this.cameraTransform.loadIdentity();
    }

    setModelTransform(modelTransform: Matrix3): void
    {
        this.modelTransform = modelTransform;
    }

    resetModelTransform(): void
    {
        this.modelTransform.loadIdentity();
    }

    drawRect(x: number, y: number, width: number, height: number, filled: boolean = false, centered: boolean = false): void
    {
        this.drawRectV(new Vector2(x, y), width, height, filled, centered);
    }

    drawRectV(v: Vector2, width: number, height: number, filled: boolean = false, centered: boolean = false): void
    {
        let tv = v.copy();

        if (!centered)
        {
            tv.x -= width / 2.0;
            tv.y -= height / 2.0;
        }

        tv = this.cameraTransform.mulVector(this.modelTransform.mulVector(tv, 1), 1);

        this.gfx.lineWidth = 1;
        this.gfx.rect(tv.x, this.height - 1 - tv.y, width, height);

        if (filled)
            this.gfx.fill();
        else
            this.gfx.stroke();
    }

    drawCircle(x: number, y: number, radius: number = 5, filled: boolean = false, centered: boolean = true): void
    {
        this.drawCircleV(new Vector2(x, y), radius, filled, centered);
    }

    drawCircleV(v: Vector2, radius: number = 5, filled: boolean = false, centered: boolean = true): void
    {
        let tv = v.copy();

        if (!centered)
        {
            tv.x += radius / 2.0;
            tv.y += radius / 2.0;
        }

        tv = this.cameraTransform.mulVector(this.modelTransform.mulVector(tv, 1), 1);

        this.gfx.lineWidth = 1;
        this.gfx.beginPath();
        this.gfx.arc(tv.x, this.height - 1 - tv.y, radius, 0, 2 * Math.PI);

        if (filled)
            this.gfx.fill();
        else
            this.gfx.stroke();
    }

    drawLine(x0: number, y0: number, x1: number, y1: number, lineWidth = 1): void
    {
        this.drawLineV(new Vector2(x0, y0), new Vector2(x1, y1), lineWidth);
    }

    drawLineV(v0: Vector2, v1: Vector2, lineWidth: number = 1): void
    {
        let tv0 = this.cameraTransform.mulVector(this.modelTransform.mulVector(v0, 1), 1);
        let tv1 = this.cameraTransform.mulVector(this.modelTransform.mulVector(v1, 1), 1);

        this.gfx.lineWidth = lineWidth;
        this.gfx.beginPath();
        this.gfx.moveTo(tv0.x, this.height - 1 - tv0.y);
        this.gfx.lineTo(tv1.x, this.height - 1 - tv1.y);
        this.gfx.stroke();
    }

    drawText(x: number, y: number, content: any, fontSize = 20): void
    {
        this.gfx.font = fontSize + "px verdana";
        this.gfx.fillText(content, x, y);
    }

    // Draw vector from point p toward direction v
    drawVector(p: Vector2, v: Vector2, arrowSize: number = 3): void
    {
        this.drawLine(p.x, p.y, p.x + v.x, p.y + v.y);
        let n = new Vector2(-v.y, v.x).normalized().mulS(3 * arrowSize);

        const nv = v.normalized();
        arrowSize *= 4;

        this.drawLine(p.x + v.x + n.x - nv.x * arrowSize, p.y + v.y + n.y - nv.y * arrowSize, p.x + v.x, p.y + v.y);
        this.drawLine(p.x + v.x - n.x - nv.x * arrowSize, p.y + v.y - n.y - nv.y * arrowSize, p.x + v.x, p.y + v.y);
    }

    // Draw p1 to p2 vector
    drawVectorP(p1: Vector2, p2: Vector2, arrowSize: number = 3): void
    {
        this.drawVector(p1, p2.subV(p1), arrowSize);
    }

    drawSimplex(sp: Simplex): void
    {
        switch (sp.count)
        {
            case 1:
                this.drawCircleV(sp.vertices[0], 10, false, true);
                break;
            case 2:
                this.drawLineV(sp.vertices[0], sp.vertices[1]);
                break;
            case 3:
                this.drawLineV(sp.vertices[0], sp.vertices[1]);
                this.drawLineV(sp.vertices[1], sp.vertices[2]);
                this.drawLineV(sp.vertices[2], sp.vertices[0]);
                break;
            default:
                break;
        }
    }

    drawCollider(c: Collider, drawCenterOfMass: boolean = false, drawVerticesOnly: boolean = false, lineWidth: number = 1): void
    {
        this.setModelTransform(c.localToGlobal);

        if (c instanceof Polygon)
        {
            for (let i = 0; i < c.count; i++)
            {
                if (drawVerticesOnly)
                {
                    this.drawCircleV(c.vertices[i], 5, true);
                }
                else
                {
                    let curr = c.vertices[i];
                    let next = c.vertices[(i + 1) % c.count];
                    this.drawLineV(curr, next, lineWidth);
                }
            }
        }
        else if (c instanceof Circle)
        {
            this.drawCircleV(c.centerOfMass, c.radius);
            this.drawLineV(c.centerOfMass, c.centerOfMass.addV(new Vector2(c.radius, 0)));
        }
        else
        {
            throw "Not supported shape";
        }

        if (drawCenterOfMass)
            this.drawCircleV(c.centerOfMass, 1, true);

        this.resetModelTransform();
    }

    drawAABB(aabb: AABB, lineWidth = 1)
    {
        this.drawLine(aabb.min.x, aabb.min.y, aabb.min.x, aabb.max.y, lineWidth);
        this.drawLine(aabb.min.x, aabb.max.y, aabb.max.x, aabb.max.y, lineWidth);
        this.drawLine(aabb.max.x, aabb.max.y, aabb.max.x, aabb.min.y, lineWidth);
        this.drawLine(aabb.max.x, aabb.min.y, aabb.min.x, aabb.min.y, lineWidth);
    }
}