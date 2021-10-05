import { Vector2, Vector3, Matrix4 } from "./math.js";
import * as Input from "./input.js";

export class Game
{
    constructor(renderer, width, height)
    {
        this.r = renderer;
        this.width = width;
        this.height = height;

        this.time = 0;

        this.v = new Vector2(0, 0);

        let a = new Vector2(1, 0.5);
        let b = new Vector2(1, 1);

        console.log(a.cross(b));
    }

    update(delta)
    {
        // Game Logic Here
        this.time += delta;

    }

    render()
    {
        // Render Code Here

    }
}