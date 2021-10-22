import { detectCollision } from "./pyhsics.js";
import { Vector2 } from "./math.js";
import * as Input from "./input.js";
import { Renderer } from "./renderer.js";
import { Polygon } from "./polygon.js";
import { Camera } from "./camera.js";
import { createRandomConvexCollider } from "./util.js";
import { Collider } from "./collider.js";
export class Game
{
    private r: Renderer;
    private width: number;
    private height: number;
    private time: number;
    private cursorPos: Vector2;
    private p: Collider;
    private p2: Polygon;

    private colliders: Collider[];
    private static_response = false;

    private camera: Camera;

    constructor(renderer: Renderer, width: number, height: number)
    {
        this.r = renderer;
        this.width = width;
        this.height = height;

        this.camera = new Camera();
        this.time = 0;

        this.cursorPos = new Vector2(0, 0);

        this.colliders = [];

        this.p = new Polygon([new Vector2(100, 100), new Vector2(100, 200), new Vector2(200, 200), new Vector2(200, 100)], true);
        this.p2 = new Polygon([new Vector2(-30, -30), new Vector2(-50, 0), new Vector2(0, 100), new Vector2(100, 100), new Vector2(80, 0)], true);

        this.camera.translate(new Vector2(-this.width / 2.0, -this.height / 2.0));
    }

    update(delta: number): void
    {
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
        // this.p2.rotate(delta);
        this.p2.setPosition(new Vector2(100, 100));

        if (Input.mouses.curr_down && !Input.mouses.last_down)
        {
            let nc = createRandomConvexCollider(Math.random() * 60 + 40);
            nc.setPosition(this.cursorPos);

            this.colliders.push(nc);
        }

        if (Input.curr_keys.r && !Input.last_keys.r)
        {
            this.static_response = !this.static_response;
        }

        if (Input.curr_keys.n && !Input.last_keys.n)
        {
            this.p = createRandomConvexCollider(Math.random() * 60 + 40);
            this.camera.reset();
            this.camera.translate(new Vector2(-this.width / 2.0, -this.height / 2.0));
        }
    }

    render(): void
    {
        this.r.setCameraTransform(this.camera.getCameraTransform());

        this.r.drawLine(-1000, 0, 1000, 0);
        this.r.drawLine(0, -1000, 0, 1000);

        // this.r.drawVectorP(new Vector2(), this.cursorPos);
        // this.r.log(this.cursorPos.x + ", " + this.cursorPos.y);

        this.colliders.forEach((collider) =>
        {
            let res = detectCollision(this.p, collider);

            if (res.collide)
            {
                this.r.log("collide!");
                this.r.resetCameraTransform();
                this.r.drawText(630, 150, "collision vector");
                this.r.drawVector(new Vector2(700, 500), res.collisionNormal!.mulS(res.penetrationDepth!));
                this.r.setCameraTransform(this.camera.getCameraTransform());

                if (this.static_response)
                {
                    this.p.translate(res.collisionNormal!.mulS(-(res.penetrationDepth! + 0.01)));
                    this.camera.translate(res.collisionNormal!.mulS(-(res.penetrationDepth! + 0.01)));
                }
            }
            this.r.drawCollider(collider);
        })

        this.r.drawCollider(this.p);

        if (this.static_response)
        {
            this.r.log("static collision response enabled", 25);
        }
    }
}