import { Matrix3, Vector2 } from "./math.js";
export class Renderer {
    constructor(gfx, width, height) {
        this.gfx = gfx;
        this.width = width;
        this.height = height;
        this.cameraTransform = new Matrix3();
        this.transform = new Matrix3();
    }
    setTransform(transform) {
        this.transform = transform;
    }
    setCameraTransform(cameraTransfrom) {
        this.cameraTransform = cameraTransfrom;
    }
    drawRect(x, y, width, height, filled = false, centered = false) {
        this.drawRectV(new Vector2(x, y), width, height, filled, centered);
    }
    drawRectV(v, width, height, filled = false, centered = false) {
        let tv = v.copy();
        if (!centered) {
            tv.x -= width / 2.0;
            tv.y -= height / 2.0;
        }
        tv = this.cameraTransform.mulVector(tv, 1);
        this.gfx.lineWidth = 1;
        this.gfx.rect(tv.x, this.height - 1 - tv.y, width, height);
        if (filled)
            this.gfx.fill();
        else
            this.gfx.stroke();
    }
    drawCircle(x, y, radius, filled = false, centered = true) {
        this.drawCircleV(new Vector2(x, y), radius, filled, centered);
    }
    drawCircleV(v, radius, filled = false, centered = true) {
        let tv = v.copy();
        if (!centered) {
            tv.x += radius / 2.0;
            tv.y += radius / 2.0;
        }
        tv = this.cameraTransform.mulVector(tv, 1);
        this.gfx.lineWidth = 1;
        this.gfx.beginPath();
        this.gfx.arc(tv.x, this.height - 1 - tv.y, radius, 0, 2 * Math.PI);
        if (filled)
            this.gfx.fill();
        else
            this.gfx.stroke();
    }
    drawLine(x0, y0, x1, y1, lineWidth = 1) {
        this.drawLineV(new Vector2(x0, y0), new Vector2(x1, y1), lineWidth);
    }
    drawLineV(v0, v1, lineWidth = 1) {
        let tv0 = this.cameraTransform.mulVector(v0, 1);
        let tv1 = this.cameraTransform.mulVector(v1, 1);
        this.gfx.lineWidth = lineWidth;
        this.gfx.beginPath();
        this.gfx.moveTo(tv0.x, this.height - 1 - tv0.y);
        this.gfx.lineTo(tv1.x, this.height - 1 - tv1.y);
        this.gfx.stroke();
    }
    drawText(x, y, content, fontSize = 20) {
        this.gfx.font = fontSize + "px verdana";
        this.gfx.fillText(content, x, y);
    }
    // v: vector
    // p: point
    drawVector(p, v, arrowSize = 3) {
        let tp = this.cameraTransform.mulVector(p, 1);
        let tv = this.cameraTransform.mulVector(v, 0);
        this.drawLine(tp.x, tp.y, tp.x + tv.x, tp.y + tv.y);
        let n = new Vector2(-tv.y, tv.x).normalized().mulS(3 * arrowSize);
        const nv = tv.normalized();
        arrowSize *= 4;
        this.drawLine(tp.x + tv.x + n.x - nv.x * arrowSize, tp.y + tv.y + n.y - nv.y * arrowSize, tp.x + tv.x, tp.y + tv.y);
        this.drawLine(tp.x + tv.x - n.x - nv.x * arrowSize, tp.y + tv.y - n.y - nv.y * arrowSize, tp.x + tv.x, tp.y + tv.y);
    }
    // Draw p1 to p2 vector
    drawVectorP(p1, p2, arrowSize = 3) {
        this.drawVector(p1, p2.subV(p1), arrowSize);
    }
    drawSimplex(sp) {
        switch (sp.count) {
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
    drawPolygon(p, b = false) {
        for (let i = 0; i < p.count; i++) {
            if (b) {
                this.drawCircleV(p.vertices[i], 5, true);
            }
            else {
                let curr = p.vertices[i];
                let next = p.vertices[(i + 1) % p.count];
                this.drawLineV(curr, next);
            }
        }
    }
}
