import { Vector2 } from "./math.js";
import * as Input from "./input.js";
import * as Util from "./util.js";
import { Renderer } from "./renderer.js";
import { Camera } from "./camera.js";
import { RigidBody, Type } from "./rigidbody.js";
import { World } from "./world.js";
import { Box } from "./box.js";
import { Circle } from "./circle.js";
import { createAABB } from "./detection.js";
import { GenerationShape, MouseMode, Settings, updateSetting } from "./settings.js";
import { demos } from "./demo.js";
import { RevoluteJoint } from "./revolute.js";
import { DistanceJoint } from "./distance.js";
import { GrabJoint } from "./grab.js";
import { WeldJoint } from "./weld.js";

export class Game
{
    public cursorPos: Vector2 = new Vector2(0, 0);
    public camera: Camera;
    private world: World;

    private cameraPosStart!: Vector2;
    private cursorStart!: Vector2;
    private cameraMove = false;
    private grabBody = false;
    private bindPosition!: Vector2;
    private targetBody!: RigidBody;
    private grabJoint!: GrabJoint;

    private currentDemo = 0;
    public demoCallback = () => { };

    constructor()
    {
        this.camera = new Camera();
        this.camera.position = new Vector2(0, Settings.height / 2.0);

        this.world = new World();

        const restartBtn = document.querySelector("#restart") as HTMLButtonElement;
        restartBtn.addEventListener("click", () =>
        {
            this.initDemo();
        });

        const demoSelect = document.querySelector("#demo_select") as HTMLSelectElement;
        demos.forEach((demo) =>
        {
            let option = document.createElement("option");
            option.innerHTML = Reflect.get(demo, "SimulationName");
            demoSelect.appendChild(option);
        });
        demoSelect.addEventListener("input", () =>
        {
            this.currentDemo = demoSelect.selectedIndex;
            this.initDemo();
        });
        demoSelect.selectedIndex = this.currentDemo;
        this.initDemo();
    }

    initDemo(): void
    {
        this.world.clear();
        this.demoCallback = () => { };
        demos[this.currentDemo](this, this.world);
    }

    update(delta: number): void
    {
        this.handleInput(delta);
        this.demoCallback();
        this.world.update(delta);
    }

    private handleInput(delta: number)
    {
        const mx = Input.isKeyDown("ArrowLeft") ? -1 : Input.isKeyDown("ArrowRight") ? 1 : 0;
        const my = Input.isKeyDown("ArrowDown") ? -1 : Input.isKeyDown("ArrowUp") ? 1 : 0;

        this.camera.translate(new Vector2(mx, my).mulS(delta * 500 * this.camera.scale.x));
        // this.camera.translate(new Vector2(-this.width / 2.0, -this.height / 2.0));

        let tmpCursorPos = new Vector2(-Settings.width / 2.0 + Input.mousePosition.x, Settings.height / 2.0 - Input.mousePosition.y - 1);
        tmpCursorPos = this.camera.transform.mulVector2(tmpCursorPos, 1);

        this.cursorPos.x = tmpCursorPos.x;
        this.cursorPos.y = tmpCursorPos.y;

        if (Input.isScrolling())
        {
            this.camera.scale.x += Input.mouseScroll.y * 0.1;
            this.camera.scale.y += Input.mouseScroll.y * 0.1;

            if (this.camera.scale.x < 0.1)
            {
                this.camera.scale.x = 0.1;
                this.camera.scale.y = 0.1;
            }
        }

        let spaceDown = Input.isKeyDown(" ");

        if (!this.cameraMove && spaceDown && Input.isMousePressed())
        {
            this.cameraMove = true;
            this.cursorStart = Input.mousePosition.copy();
            this.cameraPosStart = this.camera.position.copy();
        }
        else if (!spaceDown || Input.isMouseReleased())
        {
            this.cameraMove = false;
        }

        if (this.cameraMove)
        {
            let dist = Input.mousePosition.subV(this.cursorStart);
            dist.x *= -1;
            dist = dist.mulS(this.camera.scale.x);
            this.camera.position = this.cameraPosStart.addV(dist);
        }

        if (this.grabBody && !this.cameraMove)
        {
            if (Input.isMouseReleased())
            {
                if (Settings.mode == MouseMode.Force)
                {
                    let bindInGlobal = this.targetBody.localToGlobal.mulVector2(this.bindPosition, 1);
                    let force = this.cursorPos.subV(bindInGlobal).mulS(this.targetBody.mass).mulS(Settings.frequency);
                    let torque = bindInGlobal.subV(this.targetBody.localToGlobal.
                        mulVector2(this.targetBody.centerOfMass, 1)).cross(force);
                    this.targetBody.addForce(force);
                    this.targetBody.addTorque(torque)
                }
                else if (Settings.mode == MouseMode.Grab)
                {
                    this.world.unregister(this.grabJoint.id);
                }

                this.grabBody = false;
            }
        }

        if (Input.isMousePressed())
        {
            let skipGeneration = false;

            for (let i = 0; i < this.world.bodies.length; i++)
            {
                let b = this.world.bodies[i];
                if (b.type != Type.Ground && Util.checkInside(b, this.cursorPos))
                {
                    this.grabBody = true;
                    if (Settings.grabCenter)
                        this.bindPosition = b.centerOfMass;
                    else
                        this.bindPosition = b.globalToLocal.mulVector2(this.cursorPos, 1);
                    this.targetBody = b;
                    skipGeneration = true;
                    break;
                }
            }

            if (skipGeneration && Settings.mode == MouseMode.Grab)
            {
                let bind = Settings.grabCenter ? this.targetBody.position : this.cursorPos.copy();
                this.grabJoint = new GrabJoint(this.targetBody, bind, this.cursorPos);
                this.world.register(this.grabJoint);
            }

            if (!skipGeneration && !this.cameraMove)
            {
                let nb!: RigidBody;

                let nbs = Settings.newBodySettings;

                switch (nbs.shape)
                {
                    case GenerationShape.Box:
                        {
                            nb = new Box(nbs.size, nbs.size);
                            break;
                        }
                    case GenerationShape.Circle:
                        {
                            nb = new Circle(nbs.size / 2)
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

        if (Input.isMousePressed(2))
        {
            for (let i = 0; i < this.world.bodies.length; i++)
            {
                let b = this.world.bodies[i];
                if (Util.checkInside(b, this.cursorPos))
                {
                    this.world.bodies.splice(i, 1);
                    b.jointKeys.forEach(jointKey => this.world.unregister(jointKey));
                    break;
                }
            }
        }

        if (Input.isKeyPressed("r")) this.initDemo();
        if (Input.isKeyPressed("m")) updateSetting("m");
        if (Input.isKeyPressed("p")) updateSetting("p");
        if (Input.isKeyPressed("g")) updateSetting("g");
        if (Input.isKeyPressed("w")) updateSetting("w");
        if (Input.isKeyPressed("b")) updateSetting("b");
        if (Input.isKeyPressed("c")) updateSetting("c");
        if (Input.isKeyPressed("a")) updateSetting("a");
        if (Input.isKeyPressed("i")) updateSetting("i");
    }

    render(r: Renderer): void
    {
        r.setCamera(this.camera);

        if (Settings.showInfo)
        {
            let target!: RigidBody;
            let i = 0;
            for (; i < this.world.bodies.length; i++)
            {
                target = this.world.bodies[i];
                if (Util.checkInside(target, this.cursorPos))
                    break;
            }

            if (this.world.bodies.length > 0 && i != this.world.bodies.length)
            {
                let line = 0;
                r.log("Type: " + String(Type[target.type]), line++);
                r.log("Mass: " + String(target.mass) + "kg", line++);
                r.log("Moment of inertia: " + String((target.inertia / 10000).toFixed(4)) + "kg⋅m²", line++);
                r.log("Friction: " + String(target.friction), line++);
                r.log("Restitution: " + String(target.restitution), line++);
                r.log("Position: [" + String(target.position.x) + ", " + String(target.position.y) + "]", line++);
                r.log("Rotation: " + String((target.rotation / 100).toFixed(4)), line++);
                r.log("Linear velocity: [" + String((target.linearVelocity.x / 100).toFixed(4)) + ", " + String((target.linearVelocity.y / 100).toFixed(4)) + "]m/s", line++);
                r.log("Angular velocity: " + String((target.angularVelocity).toFixed(4)) + "rad/s", line++);
            }
        }

        if (Settings.indicateCP)
        {
            this.world.manifolds.forEach(m =>
            {
                let i = 0;
                let mid = new Vector2();
                for (; i < m.numContacts; i++)
                {
                    mid = mid.addV(m.contactPoints[i]);
                    r.drawCircleV(m.contactPoints[i], 4);
                }
                mid = mid.divS(i);
                r.drawVectorP(mid, mid.addV(m.contactNormal.mulS(20)), 1.5)
            });
        }

        if (this.grabBody && (Settings.mode == MouseMode.Force))
        {
            let bindInGlobal = this.targetBody.localToGlobal.mulVector2(this.bindPosition, 1);
            r.drawCircleV(bindInGlobal, 3);
            r.drawVectorP(bindInGlobal, this.cursorPos);
        }

        this.world.bodies.forEach(b =>
        {
            r.drawBody(b, Settings.indicateCoM);

            if (Settings.showBoundingBox)
            {
                let aabb = createAABB(b);
                r.drawAABB(aabb);
            }
        });

        this.world.joints.forEach(j =>
        {
            if (j instanceof RevoluteJoint)
            {
                let anchorA = j.bodyA.localToGlobal.mulVector2(j.localAnchorA, 1);
                let anchorB = j.bodyB.localToGlobal.mulVector2(j.localAnchorB, 1);

                if (j.drawConnectionLine)
                {
                    r.drawLineV(anchorA, j.bodyA.position);
                    r.drawLineV(anchorB, j.bodyB.position);
                }
                if (j.drawAnchor)
                {
                    r.drawCircleV(anchorA, 3);
                }
            }
            else if (j instanceof DistanceJoint)
            {
                let anchorA = j.bodyA.localToGlobal.mulVector2(j.localAnchorA, 1);
                let anchorB = j.bodyB.localToGlobal.mulVector2(j.localAnchorB, 1);

                if (j.drawConnectionLine)
                {
                    r.drawLineV(anchorA, anchorB);
                }
                if (j.drawAnchor)
                {
                    r.drawCircleV(anchorA, 3);
                    r.drawCircleV(anchorB, 3);
                }
            }
            else if (j instanceof GrabJoint)
            {
                let anchor = j.bodyA.localToGlobal.mulVector2(j.localAnchor, 1);

                if (j.drawConnectionLine)
                {
                    r.drawLineV(anchor, j.target);
                }
                if (j.drawAnchor)
                {
                    r.drawCircleV(anchor, 3);
                    r.drawCircleV(j.target, 3);
                }
            }
            else if(j instanceof WeldJoint)
            {
                let anchor = j.bodyA.localToGlobal.mulVector2(j.localAnchorA, 1);

                if (j.drawConnectionLine)
                {
                    r.drawLineV(j.bodyA.position, j.bodyB.position);
                }
                if (j.drawAnchor)
                {
                    r.drawCircleV(anchor, 3);
                }
            }
        });
    }
}