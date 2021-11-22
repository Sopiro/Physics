import { Vector2 } from "./math.js";
import * as Input from "./input.js";
import * as Util from "./util.js";
import { Camera } from "./camera.js";
import { Type } from "./collider.js";
import { World } from "./world.js";
import { Box } from "./box.js";
import { Circle } from "./circle.js";
import { createAABB } from "./detection.js";
import { GenerationShape, Settings, updateSetting } from "./settings.js";
import { demos } from "./demo.js";
export class Game {
    constructor(renderer) {
        this.cursorPos = new Vector2(0, 0);
        this.cameraMove = false;
        this.grabCollider = false;
        this.currentDemo = 0;
        this.r = renderer;
        this.camera = new Camera();
        this.camera.position = new Vector2(0, Settings.height / 2.0);
        this.camera.scale = new Vector2(2, 2);
        this.world = new World(false);
        const demoSelect = document.querySelector("#demo_select");
        demos.forEach((demo) => {
            let option = document.createElement("option");
            option.innerHTML = Reflect.get(demo, "SimulationName");
            demoSelect.appendChild(option);
        });
        demoSelect.addEventListener("input", () => {
            this.currentDemo = demoSelect.selectedIndex;
            this.initDemo();
        });
        demoSelect.selectedIndex = this.currentDemo;
        this.initDemo();
    }
    initDemo() {
        this.world.clear();
        demos[this.currentDemo](this.world);
    }
    update(delta) {
        this.handleInput(delta);
        this.world.update(delta);
    }
    handleInput(delta) {
        const mx = Input.isKeyPressed("ArrowLeft") ? -1 : Input.isKeyPressed("ArrowRight") ? 1 : 0;
        const my = Input.isKeyPressed("ArrowDown") ? -1 : Input.isKeyPressed("ArrowUp") ? 1 : 0;
        this.camera.translate(new Vector2(mx, my).mulS(delta * 500 * this.camera.scale.x));
        // this.camera.translate(new Vector2(-this.width / 2.0, -this.height / 2.0));
        this.cursorPos = new Vector2(-Settings.width / 2.0 + Input.mousePosition.x, Settings.height / 2.0 - Input.mousePosition.y - 1);
        this.cursorPos = this.camera.transform.mulVector(this.cursorPos, 1);
        let zoom = (1 + Input.mouseScroll.y * 0.1);
        if (zoom <= 0) {
            zoom = 0.1;
            Input.mouseScroll.y = -9;
        }
        this.camera.scale = new Vector2(zoom, zoom);
        let spaceDown = Input.isKeyPressed(" ");
        if (!this.cameraMove && spaceDown && Input.isMouseDown()) {
            this.cameraMove = true;
            this.cursorStart = Input.mousePosition.copy();
            this.cameraPosStart = this.camera.position.copy();
        }
        else if (!spaceDown || Input.isMouseUp()) {
            this.cameraMove = false;
        }
        if (this.cameraMove) {
            let dist = Input.mousePosition.subV(this.cursorStart);
            dist.x *= -1;
            dist = dist.mulS(this.camera.scale.x);
            this.camera.position = this.cameraPosStart.addV(dist);
        }
        if (this.grabCollider && !this.cameraMove) {
            if (Input.isMouseUp()) {
                let bindInGlobal = this.targetCollider.localToGlobal.mulVector(this.bindPosition, 1);
                let force = this.cursorPos.subV(bindInGlobal).mulS(this.targetCollider.mass).mulS(300);
                let torque = bindInGlobal.subV(this.targetCollider.localToGlobal.
                    mulVector(this.targetCollider.centerOfMass, 1)).cross(force);
                this.targetCollider.addForce(force);
                this.targetCollider.addTorque(torque);
                this.grabCollider = false;
            }
        }
        if (Input.isMouseDown()) {
            let skipGeneration = false;
            for (let i = 0; i < this.world.colliders.length; i++) {
                let c = this.world.colliders[i];
                if (c.type != Type.Ground && Util.checkInside(c, this.cursorPos)) {
                    this.grabCollider = true;
                    if (Settings.grabCenter)
                        this.bindPosition = c.centerOfMass;
                    else
                        this.bindPosition = c.globalToLocal.mulVector(this.cursorPos, 1);
                    this.targetCollider = c;
                    skipGeneration = true;
                    break;
                }
            }
            if (!skipGeneration && !this.cameraMove) {
                let nc;
                let ncs = Settings.newColliderSettings;
                switch (ncs.shape) {
                    case GenerationShape.Box:
                        {
                            nc = new Box(new Vector2(), new Vector2(ncs.size, ncs.size));
                            break;
                        }
                    case GenerationShape.Circle:
                        {
                            nc = new Circle(new Vector2(), ncs.size / 2);
                            break;
                        }
                    case GenerationShape.Random:
                        {
                            nc = Util.createRandomConvexCollider(Math.random() * ncs.size / 3 + ncs.size / 2);
                            break;
                        }
                }
                nc.position = this.cursorPos;
                nc.mass = ncs.mass;
                nc.inertia = Util.calculateBoxInertia(ncs.size, ncs.size, nc.mass);
                nc.friction = ncs.friction;
                nc.restitution = ncs.restitution;
                this.world.register(nc);
            }
        }
        if (Input.isMouseDown(2)) {
            for (let i = 0; i < this.world.colliders.length; i++) {
                let c = this.world.colliders[i];
                if (Util.checkInside(c, this.cursorPos)) {
                    this.world.unregister(i);
                    break;
                }
            }
        }
        if (Input.isKeyDown("r"))
            this.initDemo();
        if (Input.isKeyDown("m"))
            updateSetting("m");
        if (Input.isKeyDown("p"))
            updateSetting("p");
        if (Input.isKeyDown("g"))
            updateSetting("g");
        if (Input.isKeyDown("w"))
            updateSetting("w");
        if (Input.isKeyDown("b"))
            updateSetting("b");
        if (Input.isKeyDown("c"))
            updateSetting("c");
        if (Input.isKeyDown("a"))
            updateSetting("a");
    }
    render() {
        this.r.setCamera(this.camera);
        if (Settings.showInfo) {
            let target;
            let i = 0;
            for (; i < this.world.colliders.length; i++) {
                target = this.world.colliders[i];
                if (Util.checkInside(target, this.cursorPos))
                    break;
            }
            if (this.world.colliders.length > 0 && i != this.world.colliders.length) {
                let line = 0;
                this.r.log("Type: " + String(Type[target.type]), line++);
                this.r.log("Mass: " + String(target.mass) + "kg", line++);
                this.r.log("Moment of inertia: " + String((target.inertia / 10000).toFixed(4)) + "kg⋅m²", line++);
                this.r.log("Friction: " + String(target.friction), line++);
                this.r.log("Restitution: " + String(target.restitution), line++);
                this.r.log("Linear velocity: [" + String((target.linearVelocity.x / 100).toFixed(4)) + ", " + String((target.linearVelocity.y / 100).toFixed(4)) + "]m/s", line++);
                this.r.log("Angular velocity: " + String((target.angularVelocity).toFixed(4)) + "rad/s", line++);
            }
        }
        if (Settings.indicateCP) {
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
        if (this.grabCollider)
            this.r.drawVectorP(this.targetCollider.localToGlobal.mulVector(this.bindPosition, 1), this.cursorPos);
        this.world.colliders.forEach((collider) => {
            this.r.drawCollider(collider, Settings.indicateCoM);
            if (Settings.showBoundingBox) {
                let aabb = createAABB(collider);
                this.r.drawAABB(aabb);
            }
        });
    }
}
