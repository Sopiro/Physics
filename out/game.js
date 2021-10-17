import { Vector2, subPolygon, gjk } from "./math.js";
import * as Input from "./input.js";
import { Simplex } from "./simplex.js";
import { Polygon } from "./polygon.js";
import { Camera } from "./camera.js";
export class Game {
    constructor(renderer, width, height) {
        this.r = renderer;
        this.width = width;
        this.height = height;
        this.camera = new Camera();
        this.time = 0;
        this.sp = new Simplex([new Vector2(200, 200), new Vector2(400, 400), new Vector2(500, 300)]);
        this.cursorPos = new Vector2(0, 0);
        this.closest = new Vector2(0, 0);
        this.p = new Polygon([new Vector2(100, 100), new Vector2(100, 200), new Vector2(200, 200), new Vector2(200, 100)], true);
        // this.p2 = new Polygon([new Vector2(-50, -50), new Vector2(0, 50), new Vector2(50, -50)], true);
        this.p2 = new Polygon([new Vector2(-30, -30), new Vector2(-50, 0), new Vector2(0, 100), new Vector2(100, 100), new Vector2(80, 0)], true);
        this.p3 = subPolygon(this.p, this.p2);
        this.camera.translate(new Vector2(-width / 2.0, -height / 2.0));
    }
    update(delta) {
        // Game Logic Here
        this.time += delta;
        const speed = delta * 500;
        const mx = Input.keys.ArrowLeft ? -1 : Input.keys.ArrowRight ? 1 : 0;
        const my = Input.keys.ArrowDown ? -1 : Input.keys.ArrowUp ? 1 : 0;
        const mr = Input.keys.r ? 1 : 0;
        // this.camera.translate(new Vector2(mx * speed, my * speed));
        this.cursorPos = new Vector2(Input.mouses.currX, this.height - Input.mouses.currY - 1);
        this.cursorPos = this.camera.getTransform().mulVector(this.cursorPos, 1);
        this.p.translate(new Vector2(mx * speed, my * speed));
        this.p.rotate(mr * delta);
        this.p2.rotate(delta);
        this.p2.setPosition(new Vector2(70, 90));
        this.p3 = subPolygon(this.p, this.p2);
    }
    render() {
        this.r.setCameraTransform(this.camera.getCameraTransform());
        this.r.drawLine(-1000, 0, 1000, 0);
        this.r.drawLine(0, -1000, 0, 1000);
        // this.r.drawSimplex(this.sp);
        // if (this.closest != undefined)
        //     this.r.drawVectorP(this.closest, this.cursorPos);
        // if (this.closest == this.cursorPos)
        //     this.r.drawText(100, 100, "Inside");
        // this.r.log(this.cursorPos.x + ", " + this.cursorPos.y);
        // this.r.drawVectorP(this.camera._translation, this.cursorPos.addV(this.camera._translation));
        let dir = this.cursorPos;
        // this.r.drawCircleV(csoSupport(this.p, this.p2, dir), 10);
        // let res = support(this.p3, dir);
        // let res = support(this.p2.getGlobalVertices(), dir).subV(support(this.p.getGlobalVertices(), dir.mulS(-1)));
        // this.r.drawCircleV(res, 10);
        this.r.drawPolygon(this.p);
        this.r.drawPolygon(this.p2);
        this.r.drawPolygon(this.p3, true);
        this.r.drawCircleV(gjk(this.p, this.p2, this.r), 5);
    }
}
