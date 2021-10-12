import { Vector2, Vector3, Matrix4, Matrix3 } from "./math.js";
import * as Input from "./input.js";

export class Game
{
    constructor(renderer, width, height)
    {
        this.r = renderer;
        this.width = width;
        this.height = height;

        this.time = 0;

        this.p = new Vector2(100, 100);
        this.v = new Vector2(100, 0);
        this.vv = new Vector2(0, 0);
        this.cursorPos = new Vector2(100, 0);
    }

    update(delta)
    {
        // Game Logic Here
        this.time += delta;
        const speed = delta * 100;

        this.cursorPos = new Vector2(Input.mouses.currX, this.height - Input.mouses.currY);

        let m = new Matrix3();
        m = m.translate(this.cursorPos.x, this.cursorPos.y).rotate(this.time);

        this.vv = m.mulVector(this.v);
        
    }

    render()
    {
        // Render Code Here

        // this.r.drawText(100, 100, this.cursorPos.x + ", " + this.cursorPos.y);
        this.r.drawText(100, 100, Math.trunc(this.vv.x) + ", " + Math.trunc(this.vv.y));

        // let toCursor = new Vector2(cursorPos.x, cursorPos.y).subV(this.p);
        // this.r.drawVector(this.p, toCursor);

        // this.r.drawCircle(this.v.x, this.v.y, 10);
        // this.r.drawCircle(this.vv.x, this.vv.y, 10);
        this.r.drawVectorP(this.cursorPos, this.vv);
    }
}