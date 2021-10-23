import { detectCollision } from "./pyhsics.js";
import { Vector2 } from "./math.js";
import * as Input from "./input.js";
import { Polygon } from "./polygon.js";
import { Camera } from "./camera.js";
import { createRandomConvexCollider } from "./util.js";
export class Game {
    constructor(renderer, width, height) {
        this.static_resolution = false;
        this.r = renderer;
        this.width = width;
        this.height = height;
        this.camera = new Camera();
        this.time = 0;
        this.cursorPos = new Vector2(0, 0);
        this.colliders = [];
        this.p = new Polygon([new Vector2(100, 100), new Vector2(100, 200), new Vector2(200, 200), new Vector2(200, 100)], true);
        this.p2 = new Polygon([new Vector2(100, 100), new Vector2(150, 200), new Vector2(200, 100)], false);
        this.colliders.push(this.p2);
        this.camera.translate(new Vector2(-this.width / 2.0, -this.height / 2.0));
    }
    update(delta) {
        // Game Logic Here
        this.time += delta;
        const speed = delta * 500;
        const mx = Input.curr_keys.ArrowLeft ? -1 : Input.curr_keys.ArrowRight ? 1 : 0;
        const my = Input.curr_keys.ArrowDown ? -1 : Input.curr_keys.ArrowUp ? 1 : 0;
        let mr = Input.curr_keys.e ? -1 : Input.curr_keys.q ? 1 : 0;
        this.camera.translate(new Vector2(mx * speed, my * speed));
        this.cursorPos = new Vector2(Input.mouses.currX, this.height - Input.mouses.currY - 1);
        this.cursorPos = this.camera.getTransform().mulVector(this.cursorPos, 1);
        this.p.translate(new Vector2(mx * speed, my * speed));
        this.p.rotate(mr * delta * 2.5);
        if (Input.mouses.curr_down && !Input.mouses.last_down) {
            let nc = createRandomConvexCollider(Math.random() * 60 + 40);
            nc.setPosition(this.cursorPos);
            this.colliders.push(nc);
        }
        if (Input.curr_keys.r && !Input.last_keys.r) {
            this.static_resolution = !this.static_resolution;
        }
        if (Input.curr_keys.n && !Input.last_keys.n) {
            this.p = createRandomConvexCollider(Math.random() * 60 + 40);
            this.camera.resetTransform();
            this.camera.translate(new Vector2(-this.width / 2.0, -this.height / 2.0));
        }
    }
    render() {
        this.r.setCameraTransform(this.camera.getCameraTransform());
        this.r.drawLine(-10000, 0, 10000, 0);
        this.r.drawLine(0, -10000, 0, 10000);
        // this.r.drawVectorP(new Vector2(), this.cursorPos);
        // this.r.log(this.cursorPos.x + ", " + this.cursorPos.y);
        this.colliders.forEach((collider) => {
            let res = detectCollision(this.p, collider);
            if (res.collide) {
                this.r.log("collide!");
                this.r.resetCameraTransform();
                this.r.drawText(630, 150, "collision vector");
                this.r.drawVector(new Vector2(700, 500), res.collisionNormal.mulS(res.penetrationDepth), 2);
                this.r.setCameraTransform(this.camera.getCameraTransform());
                this.r.drawVector(res.contactPonintA, res.collisionNormal.mulS(-res.penetrationDepth), 2);
                // Draw contact point
                // this.r.drawCircleV(res.contactPonintA!);
                // this.r.drawCircleV(res.contactPonintB!);
                if (this.static_resolution) {
                    this.p.translate(res.collisionNormal.mulS(-(res.penetrationDepth + 0.01)));
                    this.camera.translate(res.collisionNormal.mulS(-(res.penetrationDepth + 0.01)));
                }
            }
            this.r.drawCollider(collider);
        });
        this.r.drawCollider(this.p);
        if (this.static_resolution)
            this.r.log("static collision resolution enabled", 25);
    }
}
