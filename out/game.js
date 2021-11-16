import { Vector2 } from "./math.js";
import * as Input from "./input.js";
import * as Util from "./util.js";
import { Camera } from "./camera.js";
import { Type } from "./collider.js";
import { World } from "./world.js";
import { Box } from "./box.js";
export class Game {
    constructor(renderer, width, height) {
        this.time = 0;
        this.cursorPos = new Vector2(0, 0);
        this.indicateCM = false;
        this.indicateCP = false;
        this.mouseBound = false;
        this.r = renderer;
        this.width = width;
        this.height = height;
        this.camera = new Camera();
        this.camera.position = new Vector2(-this.width / 2.0, -10);
        this.world = new World(true);
        // Register colliders to the physics world
        {
            this.p = new Box(new Vector2(), new Vector2(50, 50));
            // this.p = new Circle(new Vector2(0, 0), 50);
            this.p.position = new Vector2(0, height * 0.8);
            // this.p.angularVelocity = 5;
            // this.world.register(this.p);
            this.ground = new Box(new Vector2(0, 0), new Vector2(width * 5, 40), Type.Ground);
            this.wallL = new Box(new Vector2(0, 0), new Vector2(400, 20), Type.Ground);
            this.wallL.rotate(-Math.PI / 7);
            this.wallL.translate(new Vector2(-500, height / 3.0));
            this.wallR = new Box(new Vector2(0, 0), new Vector2(400, 20), Type.Ground);
            this.wallR.rotate(Math.PI / 7);
            this.wallR.translate(new Vector2(500, height / 3.0));
            this.spinner = new Box(new Vector2(0, 0), new Vector2(width / 4, 15), Type.Ground);
            this.spinner.translate(new Vector2(0, height / 2.0));
            this.spinner.inertia = Util.calculateBoxInertia(width / 4, 15, 500);
            this.world.register(this.ground);
            // this.world.register(this.wallL);
            this.world.register(this.wallR);
            // this.world.register(this.spinner);
            // this.world.register(new Circle(new Vector2(300, height * 0.8), 50));
            // this.world.register(new Circle(new Vector2(-300, height * 0.8), 50));
            for (let i = 0; i < 10; i++) {
                this.world.register(new Box(new Vector2(0, 50 + i * 35), new Vector2(30, 30)));
                // this.world.register(new Circle(new Vector2(0, 70.1 + i * 100), 50));
            }
        }
    }
    update(delta) {
        this.time += delta;
        this.handleInput(delta);
        this.world.update(delta);
    }
    handleInput(delta) {
        const speed = delta * 500;
        const mx = Input.isKeyPressed("ArrowLeft") ? -1 : Input.isKeyPressed("ArrowRight") ? 1 : 0;
        const my = Input.isKeyPressed("ArrowDown") ? -1 : Input.isKeyPressed("ArrowUp") ? 1 : 0;
        let mr = Input.isKeyPressed("e") ? -1 : Input.isKeyPressed("q") ? 1 : 0;
        this.camera.translate(new Vector2(mx * speed, my * speed));
        // this.camera.translate(new Vector2(-this.width / 2.0, -this.height / 2.0));
        this.cursorPos = new Vector2(Input.mousePosition.x, this.height - Input.mousePosition.y - 1);
        this.cursorPos = this.camera.getTransform().mulVector(this.cursorPos, 1);
        if (this.mouseBound) {
            if (Input.isMouseUp()) {
                let bindInGlobal = this.targetCollider.localToGlobal().mulVector(this.bindPosition, 1);
                let force = this.cursorPos.subV(bindInGlobal).mulS(5000);
                let torque = bindInGlobal.subV(this.targetCollider.localToGlobal().
                    mulVector(this.targetCollider.centerOfMass, 1)).cross(force);
                this.targetCollider.addForce(force);
                this.targetCollider.addTorque(torque);
                this.mouseBound = false;
            }
        }
        if (Input.isMouseDown()) {
            let skipGeneration = false;
            for (let i = 0; i < this.world.colliders.length; i++) {
                let c = this.world.colliders[i];
                if (c.type != Type.Ground && Util.checkInside(c, this.cursorPos)) {
                    this.mouseBound = true;
                    this.bindPosition = c.globalToLocal().mulVector(this.cursorPos, 1);
                    this.targetCollider = c;
                    skipGeneration = true;
                    break;
                }
            }
            if (!skipGeneration) {
                // let nc = Util.createRandomConvexCollider(Math.random() * 30 + 20);
                let nc = new Box(new Vector2(), new Vector2(50, 50));
                nc.position = this.cursorPos;
                // nc.angularVelocity = Util.random(-10, 10);
                this.world.register(nc);
            }
        }
        if (Input.isMouseDown(2)) {
            for (let i = 0; i < this.world.colliders.length; i++) {
                let c = this.world.colliders[i];
                if (c.type != Type.Ground && Util.checkInside(c, this.cursorPos)) {
                    this.world.unregister(i);
                    break;
                }
            }
        }
        if (Input.isKeyDown("c")) {
            this.world.clear();
            this.world.register(this.ground);
            this.world.register(this.wallL);
            this.world.register(this.wallR);
            this.world.register(this.spinner);
        }
        if (Input.isKeyDown("m")) {
            this.indicateCM = !this.indicateCM;
        }
        if (Input.isKeyDown("p")) {
            this.indicateCP = !this.indicateCP;
        }
        if (Input.isKeyDown("g")) {
            World.applyGravity = !World.applyGravity;
        }
        if (Input.isKeyDown("w")) {
            World.warmStartingEnabled = !World.warmStartingEnabled;
        }
    }
    render() {
        this.r.setCameraTransform(this.camera.getCameraTransform());
        // Draw axis
        // this.r.drawLine(-10000, 0, 10000, 0);
        // this.r.drawLine(0, -10000, 0, 10000);
        // this.r.drawVectorP(new Vector2(), this.cursorPos);
        // this.r.log(this.cursorPos.x + ", " + this.cursorPos.y);
        if (this.indicateCP) {
            this.world.manifolds.forEach(m => {
                let i = 0;
                let mid = new Vector2();
                for (; i < m.numContacts; i++) {
                    mid = mid.addV(m.contactPoints[i]);
                    this.r.drawCircleV(m.contactPoints[i], 4);
                }
                mid = mid.divS(i);
                this.r.drawVectorP(mid, mid.addV(m.contactNormal.mulS(20)), 1.5);
            });
        }
        if (this.mouseBound)
            this.r.drawVectorP(this.targetCollider.localToGlobal().mulVector(this.bindPosition, 1), this.cursorPos);
        this.world.colliders.forEach((collider) => {
            this.r.drawCollider(collider, this.indicateCM);
        });
    }
}
