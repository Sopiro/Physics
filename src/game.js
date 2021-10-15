import { Vector2, Vector3, Matrix4, Matrix3 } from "./math.js";
import * as Input from "./input.js";
import { Simplex } from "./simplex.js";

export class Game
{
    constructor(renderer, width, height)
    {
        this.r = renderer;
        this.width = width;
        this.height = height;

        this.time = 0;

        this.sp = new Simplex([new Vector2(100, 100), new Vector2(200, 200)]);
    }

    update(delta)
    {
        // Game Logic Here
        this.time += delta;
        const speed = delta * 100;

        this.cursorPos = new Vector2(Input.mouses.currX, this.height - Input.mouses.currY);
        this.closest = this.sp.getClosest(this.cursorPos, this.r);
    }

    render()
    {
        this.r.drawLineV(this.sp.vertices[0], this.sp.vertices[1]);
        this.r.drawVectorP(this.closest, this.cursorPos);
    }
}