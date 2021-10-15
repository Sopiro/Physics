import { Vector2 } from "./math.js";

export class Renderer
{
    constructor(gfx, width, height)
    {
        this.gfx = gfx;
        this.width = width;
        this.height = height;
    }

    drawRect(x, y, width, height, filled = false, centered = false)
    {
        if (centered)
        {
            x -= width / 2.0;
            y -= height / 2.0;
        }

        this.gfx.lineWidth = 1;
        this.gfx.rect(x, this.height - 1 - y, width, height);

        if (filled)
            this.gfx.fill();
        else
            this.gfx.stroke();
    }

    drawCircle(x, y, radius, filled = false, centered = true)
    {
        this.gfx.lineWidth = 1;

        if (!centered)
        {
            x += radius / 2.0;
            y += radius / 2.0;
        }

        this.gfx.beginPath();
        this.gfx.arc(x, this.height - 1 - y, radius, 0, 2 * Math.PI);

        if (filled)
            this.gfx.fill();
        else
            this.gfx.stroke();
    }

    drawCircleV(v, radius, filled = false, centered = true)
    {
        this.drawCircle(v.x, v.y, radius, filled, centered);
    }

    drawLine(x0, y0, x1, y1, lineWidth = 1)
    {
        this.gfx.lineWidth = lineWidth;

        this.gfx.beginPath();
        this.gfx.moveTo(x0, this.height - 1 - y0);
        this.gfx.lineTo(x1, this.height - 1 - y1);
        this.gfx.stroke();
    }

    drawLineV(v0, v1, lineWidth = 1)
    {
        this.drawLine(v0.x, v0.y, v1.x, v1.y, lineWidth);
    }

    drawText(x, y, content, fontSize = 20)
    {
        this.gfx.font = fontSize + "px verdana";

        this.gfx.fillText(content, x, y);
    }

    // v: vector
    // p: point
    drawVector(p, v, arrowSize = 3)
    {
        this.drawLine(p.x, p.y, p.x + v.x, p.y + v.y);
        let n = new Vector2(-v.y, v.x).normalized().mulS(3 * arrowSize);

        const nv = v.normalized();
        arrowSize *= 4;

        this.drawLine(p.x + v.x + n.x - nv.x * arrowSize, p.y + v.y + n.y - nv.y * arrowSize, p.x + v.x, p.y + v.y);
        this.drawLine(p.x + v.x - n.x - nv.x * arrowSize, p.y + v.y - n.y - nv.y * arrowSize, p.x + v.x, p.y + v.y);
    }

    // Draw p1 to p2 vector
    drawVectorP(p1, p2, arrowSize = 3)
    {
        this.drawVector(p1, p2.subV(p1), arrowSize);
    }

    drawSimplex(sp)
    {
        switch (sp.count)
        {
            case 1:
                this.drawCircleV(sp.vertices[0], 5, true, true);
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
}