import { Vector2 } from "./math.js";
import * as Input from "./input.js";
import * as Util from "./util.js";
import { Renderer } from "./renderer.js";
import { Camera } from "./camera.js";
import { Collider, Type } from "./collider.js";
import { World } from "./world.js";
import { Box } from "./box.js";
import { detectCollision } from "./detection.js";
import { Circle } from "./circle.js";

export class Game
{
    private r: Renderer;
    private width: number;
    private height: number;
    private time: number = 0;
    private cursorPos: Vector2 = new Vector2(0, 0);

    private world: World;

    private p: Collider;
    private ground: Collider;
    private wallL: Collider;
    private wallR: Collider;
    private spinner: Collider;

    private camera: Camera;

    private indicateCM: boolean = true;

    private mouseBound = false;
    private bindPosition!: Vector2;
    private targetCollider!: Collider;

    constructor(renderer: Renderer, width: number, height: number)
    {
        this.r = renderer;
        this.width = width;
        this.height = height;
        this.camera = new Camera();
        this.camera.position = new Vector2(-this.width / 2.0, -50);

        this.world = new World(false);

        // Register colliders to the physics world
        {
            this.p = new Box(new Vector2(), new Vector2(100, 100));
            // this.p = new Circle(new Vector2(0, 0), 50);
            this.p.position = new Vector2(0, height * 0.8);
            this.p.angularVelocity = 5;
            this.world.register(this.p);

            this.ground = new Box(new Vector2(0, 0), new Vector2(width * 0.8, 20), Type.Ground);

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
        }
    }

    update(delta: number): void
    {
        this.time += delta;

        this.handleInput(delta);
        this.world.update(delta);
    }

    private handleInput(delta: number)
    {
        const speed = delta * 500;

        const mx = Input.isKeyPressed("ArrowLeft") ? -1 : Input.isKeyPressed("ArrowRight") ? 1 : 0;
        const my = Input.isKeyPressed("ArrowDown") ? -1 : Input.isKeyPressed("ArrowUp") ? 1 : 0;
        let mr = Input.isKeyPressed("e") ? -1 : Input.isKeyPressed("q") ? 1 : 0;

        this.camera.translate(new Vector2(mx * speed, my * speed));
        // this.camera.translate(new Vector2(-this.width / 2.0, -this.height / 2.0));

        this.cursorPos = new Vector2(Input.mousePosition.x, this.height - Input.mousePosition.y - 1);
        this.cursorPos = this.camera.getTransform().mulVector(this.cursorPos, 1);

        if (this.mouseBound)
        {
            if (Input.isMouseUp())
            {
                let bindInGlobal = this.targetCollider.localToGlobal().mulVector(this.bindPosition, 1);
                let force = this.cursorPos.subV(bindInGlobal).mulS(5000);
                let torque = bindInGlobal.subV(this.targetCollider.localToGlobal().
                    mulVector(this.targetCollider.centerOfMass, 1)).cross(force);
                this.targetCollider.addForce(force);
                this.targetCollider.addTorque(torque)
                this.mouseBound = false;
            }
        }

        if (Input.isMouseDown())
        {
            let skipGeneration = false;

            for (let i = 0; i < this.world.colliders.length; i++)
            {
                let c = this.world.colliders[i];
                if (c.type != Type.Ground && Util.checkInside(c, this.cursorPos))
                {
                    this.mouseBound = true;
                    this.bindPosition = c.globalToLocal().mulVector(this.cursorPos, 1);
                    this.targetCollider = c;
                    skipGeneration = true;
                    break;
                }
            }

            if (!skipGeneration)
            {
                let nc = Util.createRandomConvexCollider(Math.random() * 60 + 40);
                // let nc = new Box(new Vector2(), new Vector2(100, 100));
                nc.position = this.cursorPos;
                // nc.angularVelocity = Util.random(-10, 10);

                this.world.register(nc);
            }
        }

        if (Input.isMouseDown(1))
        {
            for (let i = 0; i < this.world.colliders.length; i++)
            {
                let c = this.world.colliders[i];
                if (c.type != Type.Ground && Util.checkInside(c, this.cursorPos))
                {
                    this.world.unregister(i);
                    break;
                }
            }
        }

        if (Input.isKeyDown("c"))
        {
            this.world.clear();
            this.world.register(this.ground);
            this.world.register(this.wallL);
            this.world.register(this.wallR);
            this.world.register(this.spinner);
        }

        if (Input.isKeyDown("m"))
        {
            this.indicateCM = !this.indicateCM;
        }
    }

    render(): void
    {
        this.r.setCameraTransform(this.camera.getCameraTransform());

        // Draw axis
        // this.r.drawLine(-10000, 0, 10000, 0);
        // this.r.drawLine(0, -10000, 0, 10000);

        // this.r.drawVectorP(new Vector2(), this.cursorPos);
        // this.r.log(this.cursorPos.x + ", " + this.cursorPos.y);

        // this.world.colliders.forEach(c =>
        // {
        //     let res = detectCollision(this.ground, c);
        //     if (res != null)
        //     {
        //         let i = 0;
        //         let mid = new Vector2();
        //         for (; i < res.contactPoints!.length; i++)
        //         {
        //             mid = mid.addV(res.contactPoints[i]);
        //             this.r.drawCircleV(res.contactPoints[i]);
        //         }
        //         mid = mid.divS(i);
        //         this.r.drawVectorP(mid, mid.addV(res.contactNormal.mulS(20)))
        //     }
        // });

        if (this.mouseBound)
            this.r.drawVectorP(this.targetCollider.localToGlobal().mulVector(this.bindPosition, 1), this.cursorPos);

        this.world.colliders.forEach((collider) =>
        {
            this.r.drawCollider(collider, this.indicateCM);
        });
    }
}