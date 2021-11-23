import { Circle } from "./circle.js";
import { Matrix3, Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import { Settings } from "./settings.js";
export class Renderer {
    constructor(gfx) {
        this.gfx = gfx;
        this.cameraTransform = new Matrix3();
        this.modelTransform = new Matrix3();
    }
    log(content, line = 0) {
        let y = 80 + line * 20;
        this.drawText(30, y, content);
    }
    setCamera(camera) {
        this.camera = camera;
        this.cameraTransform = this.camera.globalToLocal;
    }
    setModelTransform(modelTransform) {
        this.modelTransform = modelTransform;
    }
    resetModelTransform() {
        this.modelTransform.loadIdentity();
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
        tv = this.cameraTransform.mulVector(this.modelTransform.mulVector(tv, 1), 1);
        this.gfx.lineWidth = 1;
        this.gfx.rect(Settings.width / 2.0 - 1 + tv.x, Settings.height / 2.0 - 1 - tv.y, width, height);
        if (filled)
            this.gfx.fill();
        else
            this.gfx.stroke();
    }
    drawCircle(x, y, radius = 5, filled = false, centered = true) {
        this.drawCircleV(new Vector2(x, y), radius, filled, centered);
    }
    drawCircleV(v, radius = 5, filled = false, centered = true) {
        let tv = v.copy();
        if (!centered) {
            tv.x += radius / 2.0;
            tv.y += radius / 2.0;
        }
        tv = this.cameraTransform.mulVector(this.modelTransform.mulVector(tv, 1), 1);
        this.gfx.lineWidth = 1;
        this.gfx.beginPath();
        this.gfx.arc(Settings.width / 2.0 - 1 + tv.x, Settings.height / 2.0 - 1 - tv.y, radius / this.camera.scale.x, 0, 2 * Math.PI);
        if (filled)
            this.gfx.fill();
        else
            this.gfx.stroke();
    }
    drawLine(x0, y0, x1, y1, lineWidth = 1) {
        this.drawLineV(new Vector2(x0, y0), new Vector2(x1, y1), lineWidth);
    }
    drawLineV(v0, v1, lineWidth = 1) {
        let tv0 = this.cameraTransform.mulVector(this.modelTransform.mulVector(v0, 1), 1);
        let tv1 = this.cameraTransform.mulVector(this.modelTransform.mulVector(v1, 1), 1);
        this.gfx.lineWidth = lineWidth;
        this.gfx.beginPath();
        this.gfx.moveTo(Settings.width / 2.0 - 1 + tv0.x, Settings.height / 2.0 - 1 - tv0.y);
        this.gfx.lineTo(Settings.width / 2.0 - 1 + tv1.x, Settings.height / 2.0 - 1 - tv1.y);
        this.gfx.stroke();
    }
    drawText(x, y, content, fontSize = 20) {
        this.gfx.font = fontSize + "px verdana";
        this.gfx.fillText(content, x, y);
    }
    // Draw vector from point p toward direction v
    drawVector(p, v, arrowSize = 3) {
        this.drawLine(p.x, p.y, p.x + v.x, p.y + v.y);
        let n = new Vector2(-v.y, v.x).normalized().mulS(3 * arrowSize);
        const nv = v.normalized();
        arrowSize *= 4;
        this.drawLine(p.x + v.x + n.x - nv.x * arrowSize, p.y + v.y + n.y - nv.y * arrowSize, p.x + v.x, p.y + v.y);
        this.drawLine(p.x + v.x - n.x - nv.x * arrowSize, p.y + v.y - n.y - nv.y * arrowSize, p.x + v.x, p.y + v.y);
    }
    // Draw p1 to p2 vector
    drawVectorP(p1, p2, arrowSize = 3) {
        this.drawVector(p1, p2.subV(p1), arrowSize);
    }
    drawSimplex(sp) {
        switch (sp.count) {
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
    drawBody(b, drawCenterOfMass = false, drawVerticesOnly = false, lineWidth = 1) {
        this.setModelTransform(b.localToGlobal);
        if (b instanceof Polygon) {
            for (let i = 0; i < b.count; i++) {
                if (drawVerticesOnly) {
                    this.drawCircleV(b.vertices[i], 5, true);
                }
                else {
                    let curr = b.vertices[i];
                    let next = b.vertices[(i + 1) % b.count];
                    this.drawLineV(curr, next, lineWidth);
                }
            }
        }
        else if (b instanceof Circle) {
            this.drawCircleV(b.centerOfMass, b.radius);
            this.drawLineV(b.centerOfMass, b.centerOfMass.addV(new Vector2(b.radius, 0)));
        }
        else {
            throw "Not supported shape";
        }
        if (drawCenterOfMass)
            this.drawCircleV(b.centerOfMass, 1, true);
        this.resetModelTransform();
    }
    drawAABB(aabb, lineWidth = 1) {
        this.drawLine(aabb.min.x, aabb.min.y, aabb.min.x, aabb.max.y, lineWidth);
        this.drawLine(aabb.min.x, aabb.max.y, aabb.max.x, aabb.max.y, lineWidth);
        this.drawLine(aabb.max.x, aabb.max.y, aabb.max.x, aabb.min.y, lineWidth);
        this.drawLine(aabb.max.x, aabb.min.y, aabb.min.x, aabb.min.y, lineWidth);
    }
}
