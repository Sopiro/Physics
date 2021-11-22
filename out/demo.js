import { Box } from "./box.js";
import { Type } from "./collider.js";
import { Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
import { Circle } from "./circle.js";
const ground = new Box(new Vector2(0, 0), new Vector2(Settings.width * 5, 40), Type.Ground);
function demo1(world) {
    world.register(ground);
    let b = new Box(new Vector2(0, 500), new Vector2(40, 40));
    b.angularVelocity = Util.random(-10, 10);
    world.register(b);
}
Reflect.set(demo1, "SimulationName", "Single box");
function demo2(world) {
    world.register(ground);
    for (let i = 0; i < 10; i++)
        world.register(new Box(new Vector2(0, 50 + i * 35), new Vector2(30, 30)));
}
Reflect.set(demo2, "SimulationName", "Box stacking");
function demo3(world) {
    world.register(ground);
    const rows = 12;
    const boxSize = 30;
    const xGap = 5;
    const yGap = 10;
    const xStart = -rows * boxSize / 2.0;
    const yStart = 60;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < rows - y; x++) {
            let b = new Box(new Vector2(xStart + y * (boxSize + xGap) / 2 + x * (boxSize + xGap), yStart + y * (boxSize + yGap)), new Vector2(boxSize, boxSize));
            world.register(b);
        }
    }
}
Reflect.set(demo3, "SimulationName", "Pyramid");
function demo4(world) {
    world.register(ground);
    let seesaw = new Box(new Vector2(0, 45), new Vector2(600, 10), Type.Ground);
    seesaw.inertia = Util.calculateBoxInertia(600, 10, 10);
    world.register(seesaw);
    let b = new Circle(new Vector2(-250, 100), 20);
    world.register(b);
    b = new Box(new Vector2(-280, 100), new Vector2(20, 20));
    b.mass = 1;
    b.inertia = Util.calculateBoxInertia(20, 20, 1);
    world.register(b);
    b = new Box(new Vector2(260, 500), new Vector2(50, 50));
    b.mass = 30;
    b.inertia = Util.calculateBoxInertia(30, 30, 30);
    world.register(b);
}
Reflect.set(demo4, "SimulationName", "Seesaw");
export const demos = [demo1, demo2, demo3, demo4];
