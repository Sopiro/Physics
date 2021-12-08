import { Game } from "./game.js";
import { Renderer } from "./renderer.js";
import * as Input from "./input.js";
import { Settings } from "./settings.js";
export class Engine {
    constructor() {
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
        let delta = (t - this.time) / 1000.0;
        this.time = t;
        let fps = Math.round(1.0 / delta);
        this.frameCounter.innerHTML = fps + "fps";
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
        this.gfx.globalCompositeOperation;
        this.gfx.clearRect(0, 0, Settings.width, Settings.height);
        this.game.render(this.renderer);
    }
}
