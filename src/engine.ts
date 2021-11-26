import { Game } from "./game.js";
import { Renderer } from "./renderer.js"
import * as Input from "./input.js";
import { Settings } from "./settings.js";

export class Engine
{
    public cvs: HTMLCanvasElement;
    public gfx: CanvasRenderingContext2D;
    public frameCounterElement: any;
    public renderer: Renderer;
    public game: Game;
    public time: number = 0;

    constructor()
    {
        this.cvs = document.querySelector("#canvas") as HTMLCanvasElement;
        this.cvs.setAttribute("width", Settings.width.toString());
        this.cvs.setAttribute("height", Settings.height.toString());

        this.gfx = this.cvs.getContext("2d") as CanvasRenderingContext2D;
        this.frameCounterElement = document.querySelector(".frame_counter");

        this.renderer = new Renderer(this.gfx);
        this.game = new Game();

        Input.init(this);
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
        
        if (!Settings.paused)
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
        Input.update();
    }

    render(): void
    {
        this.gfx.clearRect(0, 0, Settings.width, Settings.height);
        this.game.render(this.renderer);
    }
}