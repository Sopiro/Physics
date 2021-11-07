import { Vector2 } from "./math.js";
import * as Input from "./input.js";
import * as Util from "./util.js";
import { Renderer } from "./renderer.js";
import { Camera } from "./camera.js";
import { createRandomConvexCollider, Pair } from "./util.js";
import { Collider, Type } from "./collider.js";
import { Circle } from "./circle.js";
import { World } from "./world.js";
import { Box } from "./box.js";
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

        const mx = Input.curr_keys.ArrowLeft ? -1 : Input.curr_keys.ArrowRight ? 1 : 0;
        const my = Input.curr_keys.ArrowDown ? -1 : Input.curr_keys.ArrowUp ? 1 : 0;
        let mr = Input.curr_keys.e ? -1 : Input.curr_keys.q ? 1 : 0;

        this.camera.translate(new Vector2(mx * speed, my * speed));
        // this.camera.translate(new Vector2(-this.width / 2.0, -this.height / 2.0));

        this.cursorPos = new Vector2(Input.mouses.currX, this.height - Input.mouses.currY - 1);
        this.cursorPos = this.camera.getTransform().mulVector(this.cursorPos, 1);

        if (Input.isMouseDown())
        {
            let nc = createRandomConvexCollider(Math.random() * 60 + 40);
            // let nc = new Box(this.cursorPos, new Vector2(100, 100));
            nc.position = this.cursorPos;
            // nc.angularVelocity = Util.random(-10, 10);

            this.world.register(nc);
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

        if (Input.isKeyPressed("w"))
        {
            this.p.addForce(new Vector2(0, 50000));
            console.log(this.p.force);
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

        this.world.colliders.forEach((collider) =>
        {
            this.r.drawCollider(collider, this.indicateCM);
        });
    }
}