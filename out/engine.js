import { Game } from "./game.js";
import { Renderer } from "./renderer.js";
import * as Input from "./input.js";
import { Settings } from "./settings.js";
export class Engine {
    constructor() {
        this.lastTime = 0.0;
        this.frames = 0;
        // Block drag event
        let body = document.querySelector("body");
        body.addEventListener("contextmenu", e => e.stopPropagation(), false);
        body.ondragstart = () => { return false; };
        body.onselectstart = () => { return false; };
        // Disable spacebar scrolling
        window.addEventListener('keydown', e => {
            if (e.key == " " && e.target == document.body)
                e.preventDefault();
        });
        this.cvs = document.querySelector("#canvas");
        this.cvs.setAttribute("width", Settings.width.toString());
        this.cvs.setAttribute("height", Settings.height.toString());
        this.gfx = this.cvs.getContext("2d");
        this.frameCounter = document.querySelector(".frame_counter");
        this.renderer = new Renderer(this.gfx);
        this.game = new Game(this.renderer);
        this.time = 0;
        Input.init(this);
    }
    start() {
        window.requestAnimationFrame(this.run.bind(this));
    }
    run(t) {
        let elapsedTime = t - this.time;
        // Time feedback for focus losing
        if (elapsedTime > 500.0)
            this.lastTime += elapsedTime;
        let delta = elapsedTime / 1000.0;
        this.time += elapsedTime;
        if (this.time - this.lastTime >= 1000.0) {
            Engine.fps = this.frames;
            this.frameCounter.innerHTML = this.frames + "fps";
            this.lastTime += 1000.0;
            this.frames = 0;
        }
        this.frames++;
        if (!Settings.paused) {
            this.update(delta);
            this.render();
        }
        else {
            this.gfx.font = "48px system-ui";
            this.gfx.fillText("PAUSE", 4, 40);
        }
        window.requestAnimationFrame(this.run.bind(this));
    }
    update(delta) {
        this.game.update(delta);
        Input.update();
    }
    render() {
        this.gfx.clearRect(0, 0, Settings.width, Settings.height);
        this.game.render(this.renderer);
    }
}
Engine.fps = 0;
