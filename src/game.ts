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
import { LineJoint } from "./line.js";
import { MaxDistanceJoint } from "./maxdistance.js";
import { PrismaticJoint } from "./prismatic.js";
import { MotorJoint } from "./motor.js";
import { Polygon } from "./polygon.js";

export class Game
{
    private renderer: Renderer;
    public camera: Camera;
    private world: World;
    public cursorPos: Vector2 = new Vector2(0, 0);
    public deltaTime: number = 0.0;
    public time: number = 0.0;
    public frame: number = 0;

    private cameraPosStart!: Vector2;
    private cursorStart!: Vector2;
    private cameraMove = false;
    private grabBody = false;
    private bindPosition!: Vector2;
    private targetBody!: RigidBody;
    private grabJoint!: GrabJoint;

    private currentDemo = 0;
    public callback = () => { };

    constructor(renderer: Renderer)
    {
        this.renderer = renderer;
        this.camera = new Camera();
        this.camera.position = new Vector2(0, Settings.clipHeight / 2.0);

        let projectionTransform = Util.orth(-Settings.clipWidth / 2.0, Settings.clipWidth / 2.0, -Settings.clipHeight / 2.0, Settings.clipHeight / 2.0);
        let viewportTransform = Util.viewport(Settings.width, Settings.height);

        this.renderer.init(viewportTransform, projectionTransform, this.camera.cameraTransform);

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
        this.frame = 0;
        this.time = 0.0;
        this.world.reset();
        this.callback = () => { };
        demos[this.currentDemo](this, this.world);
    }

    update(delta: number): void
    {
        this.deltaTime = delta;
        this.frame++;
        this.time += delta;
        this.handleInput(delta);
        this.callback();
        this.world.update();
    }

    private handleInput(delta: number)
    {
        const mx = Input.isKeyDown("ArrowLeft") ? -1 : Input.isKeyDown("ArrowRight") ? 1 : 0;
        const my = Input.isKeyDown("ArrowDown") ? -1 : Input.isKeyDown("ArrowUp") ? 1 : 0;

        this.camera.translate(new Vector2(mx, my).mul(delta * 10 * this.camera.scale.x));

        let tmpCursorPos = this.renderer.pick(Input.mousePosition);

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

        if (!this.cameraMove && Input.isMousePressed(2))
        {
            this.cameraMove = true;
            this.cursorStart = Input.mousePosition.copy();
            this.cameraPosStart = this.camera.position.copy();
        }
        else if (Input.isMouseReleased(2))
        {
            this.cameraMove = false;
        }

        if (this.cameraMove)
        {
            let dist = Input.mousePosition.sub(this.cursorStart);
            dist.x *= -(Settings.clipWidth / Settings.width) * this.camera.scale.x;
            dist.y *= -(Settings.clipHeight / Settings.height) * this.camera.scale.y;
            this.camera.position = this.cameraPosStart.add(dist);
        }

        if (this.grabBody && !this.cameraMove)
        {
            if (Input.isMouseReleased())
            {
                if (Settings.mode == MouseMode.Force)
                {
                    let bindInGlobal = this.targetBody.localToGlobal.mulVector2(this.bindPosition, 1);
                    let force = this.cursorPos.sub(bindInGlobal).mul(this.targetBody.mass).mul(Settings.frequency * (0.8 + Settings.mouseStrength / 3.0));
                    let torque = bindInGlobal.sub(this.targetBody.localToGlobal.mulVector2(new Vector2(0, 0), 1)).cross(force);

                    this.targetBody.force.x += force.x;
                    this.targetBody.force.y += force.y;
                    this.targetBody.torque += torque;
                }
                else if (Settings.mode == MouseMode.Grab)
                {
                    this.world.unregister(this.grabJoint.id, true);
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
                if (b.type != Type.Static && Util.checkInside(b, this.cursorPos))
                {
                    this.grabBody = true;
                    if (Settings.grabCenter)
                        this.bindPosition = new Vector2(0, 0);
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
                this.grabJoint = new GrabJoint(this.targetBody, bind, this.cursorPos, Settings.mouseStrength, undefined);
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
                            (nb as Box).mass = nbs.mass;
                            break;
                        }
                    case GenerationShape.Circle:
                        {
                            nb = new Circle(nbs.size / 2.0);
                            (nb as Circle).mass = nbs.mass;
                            break;
                        }
                    case GenerationShape.Regular:
                        {
                            nb = Util.createRegularPolygon(nbs.size / 2, nbs.numVertices);
                            (nb as Polygon).mass = nbs.mass;
                            break;
                        }
                    case GenerationShape.Random:
                        {
                            nb = Util.createRandomConvexBody(Math.random() * nbs.size / 3 + nbs.size / 2);
                            (nb as Polygon).mass = nbs.mass;
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
                    this.world.unregister(b.id);
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
        r.setCameraTransform(this.camera.cameraTransform);

        // Body, Bounding box, Center of Mass rendering
        for (let i = 0; i < this.world.bodies.length; i++)
        {
            let b = this.world.bodies[i];

            if (Settings.colorize || Settings.indicateIsland)
            {
                let id = Settings.indicateIsland ? b.islandID : b.id;

                let hStride = 17;
                let sStride = 3;
                let lStride = 2;
                let period = Math.trunc(360 / hStride);
                let cycle = Math.trunc(id / period);
                // let dir = (cycle & 1) == 1 ? -1 : 1;

                let h = (id - 1) * hStride;
                let s = 100 - (cycle * sStride) % 17;
                let l = 70 - (cycle * lStride) % 11;

                let color = b.type == Type.Static ? "#f0f0f0" : `hsl(${h}, ${s}%, ${l}%)`;
                r.drawBody(b, Settings.indicateCoM, 1.0, true, true, "#000000", color);
            }
            else
            {
                r.drawBody(b, Settings.indicateCoM);
            }

            if (Settings.showBoundingBox)
            {
                let aabb = createAABB(b);
                r.drawAABB(aabb);
            }

            if (Settings.showContactLink)
            {
                b.manifoldIDs.forEach(id =>
                {
                    let manifold = this.world.manifoldMap.get(id)!;

                    if (manifold.bodyA.type == Type.Static || manifold.bodyB.type == Type.Static)
                        return;

                    if (manifold.bodyA.id == b.id)
                        r.drawLineV(manifold.bodyB.position, manifold.bodyA.position, 1.0);
                });
            }
        }

        // Rendering for mouse forcing 
        if (this.grabBody && (Settings.mode == MouseMode.Force))
        {
            let bindInGlobal = this.targetBody.localToGlobal.mulVector2(this.bindPosition, 1);
            r.drawCircleV(bindInGlobal, 0.03);
            r.drawVectorP(bindInGlobal, this.cursorPos);
        }

        // Rendering contact manifold
        if (Settings.indicateCP)
        {
            for (let i = 0; i < this.world.manifolds.length; i++)
            {
                let m = this.world.manifolds[i];

                let j = 0;
                let mid = new Vector2();
                for (; j < m.numContacts; j++)
                {
                    mid = mid.add(m.contactPoints[j]);
                    r.drawCircleV(m.contactPoints[j], 0.04);
                }
                mid = mid.div(j);
                r.drawVectorP(mid, mid.add(m.contactNormal.mul(0.2)), 0.015)
            }
        }

        // Joint rendering
        for (let i = 0; i < this.world.joints.length; i++)
        {
            let j = this.world.joints[i];

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
                    r.drawCircleV(anchorA, 0.03);
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
                    r.drawCircleV(anchorA, 0.03);
                    r.drawCircleV(anchorB, 0.03);
                }
            } else if (j instanceof MaxDistanceJoint)
            {
                let anchorA = j.bodyA.localToGlobal.mulVector2(j.localAnchorA, 1);
                let anchorB = j.bodyB.localToGlobal.mulVector2(j.localAnchorB, 1);

                if (j.drawConnectionLine)
                {
                    let dir = anchorB.sub(anchorA).normalized().mul(j.maxDistance);

                    r.drawLineV(anchorA, anchorA.add(dir));
                    r.drawLineV(anchorB, anchorB.add(dir.inverted()));
                }
                if (j.drawAnchor)
                {
                    r.drawCircleV(anchorA, 0.03);
                    r.drawCircleV(anchorB, 0.03);
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
                    r.drawCircleV(anchor, 0.03);
                    r.drawCircleV(j.target, 0.03);
                }
            }
            else if (j instanceof WeldJoint)
            {
                let anchor = j.bodyA.localToGlobal.mulVector2(j.localAnchorA, 1);

                if (j.drawConnectionLine)
                {
                    r.drawLineV(j.bodyA.position, j.bodyB.position);
                }
                if (j.drawAnchor)
                {
                    r.drawCircleV(anchor, 0.03);
                }
            } else if (j instanceof LineJoint)
            {
                let anchorA = j.bodyA.localToGlobal.mulVector2(j.localAnchorA, 1);
                let anchorB = j.bodyB.localToGlobal.mulVector2(j.localAnchorB, 1);

                if (j.drawConnectionLine)
                {
                    r.drawLineV(anchorA, anchorB);
                }
                if (j.drawAnchor)
                {
                    r.drawCircleV(anchorA, 0.03);
                    r.drawCircleV(anchorB, 0.03);
                }
            }
            else if (j instanceof PrismaticJoint)
            {
                let anchorA = j.bodyA.localToGlobal.mulVector2(j.localAnchorA, 1);
                let anchorB = j.bodyB.localToGlobal.mulVector2(j.localAnchorB, 1);

                if (j.drawConnectionLine)
                {
                    r.drawLineV(anchorA, anchorB);
                }
                if (j.drawAnchor)
                {
                    r.drawCircleV(anchorA, 0.03);
                    r.drawCircleV(anchorB, 0.03);
                }
            }
            else if (j instanceof MotorJoint)
            {
                let anchorA = j.bodyA.localToGlobal.mulVector2(j.localAnchorA, 1);
                let anchorB = j.bodyB.localToGlobal.mulVector2(j.localAnchorB, 1);

                if (j.drawConnectionLine)
                {
                    r.drawLineV(anchorA, anchorB);
                }
                if (j.drawAnchor)
                {
                    r.drawCircleV(anchorA.add(j.linearOffset), 0.03);
                    r.drawCircleV(anchorB, 0.03);
                }
            }

            // if (Settings.showContactLink)
            //     r.drawLineV(j.bodyA.position, j.bodyB.position);
        }

        // Log rigid body information
        if (Settings.showInfo)
        {
            let target!: RigidBody;
            let i = 0;
            for (; i < this.world.bodies.length; i++)
            {
                target = this.world.bodies[i];

                if (Util.checkInside(target, this.cursorPos)) break;
            }

            if (this.world.bodies.length > 0 && i != this.world.bodies.length)
            {
                let line = 0;
                r.log("Type: " + String(Type[target.type]), line++);
                r.log("Mass: " + String(target.mass) + "kg", line++);
                r.log("Moment of inertia: " + String((target.inertia).toFixed(4)) + "kg⋅m²", line++);

                if (target instanceof Polygon)
                {
                    if (target instanceof Box)
                    {
                        r.log("Density: " + String((target as Box).density.toFixed(4)) + "kg/m²", line++);
                        r.log("Area: " + String((target as Box).area.toFixed(4)) + "m²", line++);
                    }
                    else
                    {
                        r.log("Density: " + String((target as Polygon).density.toFixed(4)) + "kg/m²", line++);
                        r.log("Area: " + String((target as Polygon).area.toFixed(4)) + "m²", line++);
                    }
                } else if (target instanceof Circle)
                {
                    r.log("Density: " + String((target as Circle).density.toFixed(4)) + "kg/m²", line++);
                    r.log("Area: " + String((target as Circle).area.toFixed(4)) + "m²", line++);
                }

                r.log("Friction: " + String(target.friction), line++);
                r.log("Restitution: " + String(target.restitution), line++);
                r.log("Position: [" + String(target.position.x.toFixed(4)) + ", " + String(target.position.y.toFixed(4)) + "]", line++);
                r.log("Rotation: " + String(target.rotation.toFixed(4)) + "rad", line++);
                r.log("Linear velocity: [" + String((target.linearVelocity.x / 100).toFixed(4)) + ", " + String((target.linearVelocity.y / 100).toFixed(4)) + "]m/s", line++);
                r.log("Angular velocity: " + String(target.angularVelocity.toFixed(4)) + "rad/s", line++);
                r.log("Surface velocity: " + String(target.surfaceSpeed.toFixed(4)) + "m/s", line++);
                r.log("Contacts: " + target.manifoldIDs.length, line++);
                r.log("Joints: " + target.jointIDs.length, line++);
                r.log("Island: " + target.islandID, line++);
            }
        }
    }
}