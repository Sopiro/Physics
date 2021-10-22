'use strict'

import { Game } from "./game.js";
import { Renderer } from "./renderer.js"
import * as Input from "./input.js";

export class Engine
{
    private width: number;
    private height: number;
    private cvs: HTMLCanvasElement;
    private gfx: CanvasRenderingContext2D;
    private frameCounterElement: any;
    private paused: boolean;
    private time: number;
    private renderer: Renderer;
    private game: Game;

    constructor(width: number, height: number)
    {
        this.width = width;
        this.height = height;

        this.cvs = document.getElementById("canvas") as HTMLCanvasElement;
        this.cvs.setAttribute("width", this.width.toString());
        this.cvs.setAttribute("height", this.height.toString());

        this.gfx = this.cvs.getContext("2d") as CanvasRenderingContext2D;
        this.frameCounterElement = document.getElementById("frame_counter");

        this.paused = false;
        // Registers event listeners
        this.cvs.addEventListener("mousedown", (e) =>
        {
            if (e.button != 0) return;

            Input.mouses.curr_down = true;
        }, false);
        window.addEventListener("mouseup", (e) =>
        {
            if (e.button != 0) return;

            Input.mouses.curr_down = false;
        }, false);
        window.addEventListener("keydown", (e) =>
        {
            if (e.key == "Escape") this.paused = !this.paused;

            Input.curr_keys[e.key] = true;
        });
        window.addEventListener("keyup", (e) =>
        {
            Input.curr_keys[e.key] = false;
        });
        window.addEventListener("mousemove", (e) =>
        {
            let rect = this.cvs.getBoundingClientRect();

            Input.mouses.currX = e.clientX - rect.left;
            Input.mouses.currY = e.clientY - rect.top;
        });

        this.time = 0;
        this.renderer = new Renderer(this.gfx, this.width, this.height);
        this.game = new Game(this.renderer, this.width, this.height);
    }

    start(): void
    {
        window.requestAnimationFrame(this.run.bind(this));
    }

    run(t: number): void // Gameloop
    {
        let delta = t - this.time;
        if (isNaN(delta)) delta = 1;

        this.time = t;
        const fps = Math.round(1000 / delta);

        this.frameCounterElement.innerHTML = fps + "fps";

        if (!this.paused)
        {
            this.update(delta / 1000.0);
            this.render();
        }
        else
        {
            this.gfx.font = "48px verdana";
            this.gfx.fillText("PAUSE", 4, 40);
        }

        window.requestAnimationFrame(this.run.bind(this));
    }

    update(delta: number): void 
    {
        this.game.update(delta);

        // Update inputs
        Input.mouses.dx = Input.mouses.currX - Input.mouses.lastX;
        Input.mouses.dy = Input.mouses.currY - Input.mouses.lastY;
        Input.mouses.lastX = Input.mouses.currX;
        Input.mouses.lastY = Input.mouses.currY;
        Input.mouses.last_down = Input.mouses.curr_down;

        Object.assign(Input.last_keys, Input.curr_keys);
    }

    render(): void
    {
        this.gfx.clearRect(0, 0, this.width, this.height);
        this.game.render();
    }
}