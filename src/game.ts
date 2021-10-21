import { support, subPolygon, csoSupport, gjk } from "./pyhsics.js";
import { Vector2, Vector3, Matrix4, Matrix3 } from "./math.js";
import * as Input from "./input.js";
import { Simplex } from "./simplex.js";
import { Renderer } from "./renderer.js";
import { Polygon } from "./polygon.js";
import { Camera } from "./camera.js";

export class Game
{
    private r: Renderer;
    private width: number;
    private height: number;
    private time: number;
    private sp: Simplex;
    private cursorPos: Vector2;
    private closest: Vector2 | undefined;
    private p: Polygon;
    private p2: Polygon;
    private p3: Polygon;

    private camera: Camera;

    constructor(renderer: Renderer, width: number, height: number)
    {
        this.r = renderer;
        this.width = width;
        this.height = height;

        this.camera = new Camera();
        this.time = 0;

        this.sp = new Simplex([new Vector2(200, 200), new Vector2(400, 400), new Vector2(500, 300)]);
        this.cursorPos = new Vector2(0, 0);
        this.closest = new Vector2(0, 0);

        this.p = new Polygon([new Vector2(100, 100), new Vector2(100, 200), new Vector2(200, 200), new Vector2(200, 100)], true);
        this.p2 = new Polygon([new Vector2(-50, -50), new Vector2(-50, 50), new Vector2(50, 50), new Vector2(50, -50)], true);
        // this.p2 = new Polygon([new Vector2(-50, -50), new Vector2(0, 50), new Vector2(50, -50)], true);
        // this.p2 = new Polygon([new Vector2(-30, -30), new Vector2(-50, 0), new Vector2(0, 100), new Vector2(100, 100), new Vector2(80, 0)], true);
        this.p3 = subPolygon(this.p, this.p2);

        this.camera.translate(new Vector2(-width / 2.0, -height / 2.0));
    }

    update(delta: number): void
    {
        // Game Logic Here
        this.time += delta;
        const speed = delta * 500;

        const mx = Input.keys.ArrowLeft ? -1 : Input.keys.ArrowRight ? 1 : 0;
        const my = Input.keys.ArrowDown ? -1 : Input.keys.ArrowUp ? 1 : 0;
        const mr = Input.keys.r ? 1 : 0;

        this.camera.translate(new Vector2(mx * speed, my * speed));

        this.cursorPos = new Vector2(Input.mouses.currX, this.height - Input.mouses.currY - 1);
        this.cursorPos = this.camera.getTransform().mulVector(this.cursorPos, 1);

        this.p.translate(new Vector2(mx * speed, my * speed));
        this.p.rotate(mr * delta);
        // this.p2.rotate(delta);
        this.p2.setPosition(new Vector2(100, -100));
        this.p3 = subPolygon(this.p, this.p2);
    }

    render(): void
    {
        this.r.setCameraTransform(this.camera.getCameraTransform());

        this.r.drawLine(-1000, 0, 1000, 0);
        this.r.drawLine(0, -1000, 0, 1000);

        // this.r.drawVectorP(this.camera._translation, this.cursorPos.addV(this.camera._translation));
        // this.r.log(this.cursorPos.x + ", " + this.cursorPos.y);

        this.r.drawPolygon(this.p);
        this.r.drawPolygon(this.p2);
        this.r.drawPolygon(this.p3, true);

        let res = gjk(this.p, this.p2);
        // this.r.drawCircleV(res, 7);

        if (res.collide)
        {
            this.r.log("Collide");
            this.r.drawSimplex(res.simplex);
        }


        // if (res.getClosest(new Vector2()).result.fixed().equals(new Vector2()))
        // {
        //     this.r.log("Collide!");
        // }
    }
}