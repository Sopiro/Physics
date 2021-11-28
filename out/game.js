import { Vector2 } from "./math.js";
import * as Input from "./input.js";
import * as Util from "./util.js";
import { Camera } from "./camera.js";
import { Type } from "./rigidbody.js";
import { World } from "./world.js";
import { Box } from "./box.js";
import { Circle } from "./circle.js";
import { createAABB } from "./detection.js";
import { GenerationShape, Settings, updateSetting } from "./settings.js";
import { demos } from "./demo.js";
import { RevoluteJoint } from "./revolute.js";
import { DistanceJoint } from "./distance.js";
export class Game {
    constructor() {
        this.cursorPos = new Vector2(0, 0);
        this.cameraMove = false;
        this.grabBody = false;
        this.currentDemo = 0;
        this.camera = new Camera();
        this.camera.position = new Vector2(0, Settings.height / 2.0);
        this.camera.scale = new Vector2(2, 2);
        this.world = new World();
        const restartBtn = document.querySelector("#restart");
        restartBtn.addEventListener("click", () => {
            this.initDemo();
        });
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
        if (this.grabBody && !this.cameraMove) {
            if (Input.isMouseUp()) {
                let bindInGlobal = this.targetBody.localToGlobal.mulVector(this.bindPosition, 1);
                let force = this.cursorPos.subV(bindInGlobal).mulS(this.targetBody.mass).mulS(Settings.frequency);
                let torque = bindInGlobal.subV(this.targetBody.localToGlobal.
                    mulVector(this.targetBody.centerOfMass, 1)).cross(force);
                this.targetBody.addForce(force);
                this.targetBody.addTorque(torque);
                this.grabBody = false;
            }
        }
        if (Input.isMouseDown()) {
            let skipGeneration = false;
            for (let i = 0; i < this.world.bodies.length; i++) {
                let b = this.world.bodies[i];
                if (b.type != Type.Ground && Util.checkInside(b, this.cursorPos)) {
                    this.grabBody = true;
                    if (Settings.grabCenter)
                        this.bindPosition = b.centerOfMass;
                    else
                        this.bindPosition = b.globalToLocal.mulVector(this.cursorPos, 1);
                    this.targetBody = b;
                    skipGeneration = true;
                    break;
                }
            }
            if (!skipGeneration && !this.cameraMove) {
                let nb;
                let nbs = Settings.newBodySettings;
                switch (nbs.shape) {
                    case GenerationShape.Box:
                        {
                            nb = new Box(nbs.size, nbs.size);
                            break;
                        }
                    case GenerationShape.Circle:
                        {
                            nb = new Circle(nbs.size / 2);
                            break;
                        }
                    case GenerationShape.Regular:
                        {
                            nb = Util.createRegularPolygon(nbs.numVertices, nbs.size / 2);
                            break;
                        }
                    case GenerationShape.Random:
                        {
                            nb = Util.createRandomConvexBody(Math.random() * nbs.size / 3 + nbs.size / 2);
                            break;
                        }
                }
                nb.position = this.cursorPos;
                nb.friction = nbs.friction;
                nb.restitution = nbs.restitution;
                this.world.register(nb);
            }
        }
        if (Input.isMouseDown(2)) {
            for (let i = 0; i < this.world.bodies.length; i++) {
                let b = this.world.bodies[i];
                if (Util.checkInside(b, this.cursorPos)) {
                    this.world.unregisterBody(i);
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
        if (Input.isKeyDown("i"))
            updateSetting("i");
    }
    render(r) {
        r.setCamera(this.camera);
        if (Settings.showInfo) {
            let target;
            let i = 0;
            for (; i < this.world.bodies.length; i++) {
                target = this.world.bodies[i];
                if (Util.checkInside(target, this.cursorPos))
                    break;
            }
            if (this.world.bodies.length > 0 && i != this.world.bodies.length) {
                let line = 0;
                r.log("Type: " + String(Type[target.type]), line++);
                r.log("Mass: " + String(target.mass) + "kg", line++);
                r.log("Moment of inertia: " + String((target.inertia / 10000).toFixed(4)) + "kg⋅m²", line++);
                r.log("Friction: " + String(target.friction), line++);
                r.log("Restitution: " + String(target.restitution), line++);
                r.log("Linear velocity: [" + String((target.linearVelocity.x / 100).toFixed(4)) + ", " + String((target.linearVelocity.y / 100).toFixed(4)) + "]m/s", line++);
                r.log("Angular velocity: " + String((target.angularVelocity).toFixed(4)) + "rad/s", line++);
            }
        }
        if (Settings.indicateCP) {
            this.world.manifolds.forEach(m => {
                let i = 0;
                let mid = new Vector2();
                for (; i < m.numContacts; i++) {
                    mid = mid.addV(m.contactPoints[i]);
                    r.drawCircleV(m.contactPoints[i], 4);
                }
                mid = mid.divS(i);
                r.drawVectorP(mid, mid.addV(m.contactNormal.mulS(20)), 1.5);
            });
        }
        if (this.grabBody)
            r.drawVectorP(this.targetBody.localToGlobal.mulVector(this.bindPosition, 1), this.cursorPos);
        this.world.bodies.forEach(b => {
            r.drawBody(b, Settings.indicateCoM);
            if (Settings.showBoundingBox) {
                let aabb = createAABB(b);
                r.drawAABB(aabb);
            }
        });
        this.world.joints.forEach(j => {
            if (j instanceof RevoluteJoint) {
                let anchorA = j.bodyA.localToGlobal.mulVector(j.localAnchorA, 1);
                let anchorB = j.bodyB.localToGlobal.mulVector(j.localAnchorB, 1);
                if (j.drawConnectionLine) {
                    r.drawLineV(anchorA, j.bodyA.position);
                    r.drawLineV(anchorB, j.bodyB.position);
                }
                if (j.drawAnchor) {
                    r.drawCircleV(anchorA, 3);
                }
            }
            else if (j instanceof DistanceJoint) {
                let anchorA = j.bodyA.localToGlobal.mulVector(j.localAnchorA, 1);
                let anchorB = j.bodyB.localToGlobal.mulVector(j.localAnchorB, 1);
                if (j.drawConnectionLine) {
                    r.drawLineV(anchorA, anchorB);
                }
                if (j.drawAnchor) {
                    r.drawCircleV(anchorA, 3);
                    r.drawCircleV(anchorB, 3);
                }
            }
        });
    }
}
