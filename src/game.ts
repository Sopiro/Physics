import { Vector2, Vector3, Matrix4, Matrix3 } from "./math.js";
import * as Input from "./input.js";
import { Simplex } from "./simplex.js";
import { Renderer } from "./renderer.js";

export class Game
{
    private r: Renderer;
    private width: number;
    private height: number;
    private time: number;
    private sp: Simplex;
    private cursorPos: Vector2;
    private closest: Vector2 | undefined;

    constructor(renderer: Renderer, width: number, height: number)
    {
        this.r = renderer;
        this.width = width;
        this.height = height;

        this.time = 0;

        this.sp = new Simplex([new Vector2(200, 200), new Vector2(400, 400), new Vector2(500, 300)]);
        this.cursorPos = new Vector2(0, 0);
        this.closest = new Vector2(0, 0);
    }

    update(delta: number)
    {
        // Game Logic Here
        this.time += delta;
        const speed = delta * 100;

        this.cursorPos = new Vector2(Input.mouses.currX, this.height - Input.mouses.currY);
        this.closest = this.sp.getClosest(this.cursorPos);
    }

    render()
    {
        this.r.drawSimplex(this.sp);
        if (this.closest != undefined)
            this.r.drawVectorP(this.closest, this.cursorPos);

        if (this.closest == this.cursorPos)
            this.r.drawText(100, 100, "Inside");
    }
}