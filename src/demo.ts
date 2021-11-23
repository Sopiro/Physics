import { Box } from "./box.js";
import { Collider, Type } from "./collider.js";
import { Vector2 } from "./math.js";
import { Settings, updateSetting } from "./settings.js";
import { World } from "./world.js";
import * as Util from "./util.js";
import { Circle } from "./circle.js";

const ground = new Box(new Vector2(0, 0), new Vector2(Settings.width * 5, 40), Type.Ground);
ground.restitution = 0.45;

function demo1(world: World): void
{
    updateSetting("g", true);
    world.register(ground);
    let b = new Box(new Vector2(0, 500), new Vector2(40, 40));
    b.restitution = 0.7;
    b.angularVelocity = Util.random(-10, 10);
    world.register(b);
}
Reflect.set(demo1, "SimulationName", "Single box");

function demo2(world: World): void
{
    updateSetting("g", true);
    world.register(ground);

    let start = 50;
    let size = 30;
    let gap = 5;

    for (let i = 0; i < 12; i++)
        world.register(new Box(new Vector2(0, start + i * (size + gap)), new Vector2(size, size)));
}
Reflect.set(demo2, "SimulationName", "Box stacking");

function demo3(world: World): void
{
    updateSetting("g", true);
    world.register(ground);

    const rows = 12;
    const boxSize = 30;
    const xGap = 5;
    const yGap = 10;
    const xStart = - rows * boxSize / 2.0;
    const yStart = 60;

    for (let y = 0; y < rows; y++)
    {
        for (let x = 0; x < rows - y; x++)
        {
            let b = new Box(new Vector2(xStart + y * (boxSize + xGap) / 2 + x * (boxSize + xGap), yStart + y * (boxSize + yGap)),
                new Vector2(boxSize, boxSize));
            world.register(b);
        }
    }
}
Reflect.set(demo3, "SimulationName", "Pyramid");

function demo4(world: World): void
{
    updateSetting("g", true);
    world.register(ground);

    let seesaw = new Box(new Vector2(0, 45), new Vector2(600, 10), Type.Ground);
    seesaw.inertia = Util.calculateBoxInertia(600, 10, 10);
    world.register(seesaw);

    let b: Collider = new Circle(new Vector2(-250, 100), 20);
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

function demo5(world: World): void
{
    updateSetting("g", false);

    let lstart = -400;
    let rstart = 250;

    let c = new Circle(new Vector2(lstart, Settings.height / 2.0), 20);
    c.linearVelocity.x = 300;
    c.restitution = 1;
    world.register(c);

    c = new Circle(new Vector2(rstart, Settings.height / 2.0), 20);
    c.angularVelocity = 5;
    c.restitution = 1;
    world.register(c);

    c = new Circle(new Vector2(rstart + 60, Settings.height / 2.0 + 30), 20);
    c.restitution = 1;
    world.register(c);

    c = new Circle(new Vector2(rstart + 50, Settings.height / 2.0 - 50), 20);
    c.restitution = 1;
    world.register(c);

    c = new Circle(new Vector2(rstart + 160, Settings.height / 2.0 + 90), 20);
    c.restitution = 1;
    world.register(c);

    c = new Circle(new Vector2(rstart + 130, Settings.height / 2.0 + 10), 20);
    c.restitution = 1;
    world.register(c);

    c = new Circle(new Vector2(rstart + 150, Settings.height / 2.0 - 80), 20);
    c.restitution = 1;
    world.register(c);
}
Reflect.set(demo5, "SimulationName", "Billiard");

function demo6(world: World): void
{
    updateSetting("g", false);
    world.register(ground);

    const center = new Vector2(300, Settings.height / 2.0);

    for (let i = 0; i < 70; i++)
    {
        let r = Util.random(30, 280);
        let a = Util.random(0, Math.PI * 2);
        let p = new Vector2(Math.cos(a), Math.sin(a)).mulS(r);
        let c = Util.createRandomConvexCollider(9);
        c.position = center.addV(p);
        c.mass = 1;
        c.inertia = Util.calculateCircleInertia(9, 1);
        world.register(c);
    }

    let b = new Box(new Vector2(-500, Settings.height / 2.0), new Vector2(10, 200));
    b.mass = 30;
    b.inertia = Util.calculateBoxInertia(10, 200, 30);

    b.linearVelocity.x = 300;
    b.angularVelocity = 15;

    world.register(b);
}
Reflect.set(demo6, "SimulationName", "Throwing spinning stick");

function demo7(world: World): void
{
    updateSetting("g", true);
    world.register(ground);

    let b = new Box(new Vector2(-60, 500), new Vector2(600, 10), Type.Ground);
    b.rotation = -0.15;
    b.friction = 1.0;
    world.register(b);
    b = new Box(new Vector2(0, 300), new Vector2(600, 10), Type.Ground);
    b.rotation = 0.15;
    b.friction = 1.0;
    world.register(b);
    b = new Box(new Vector2(-60, 100), new Vector2(600, 10), Type.Ground);
    b.rotation = -0.15;
    b.friction = 1.0;
    world.register(b);

    b = new Box(new Vector2(310, 430), new Vector2(10, 110), Type.Ground);
    world.register(b);
    b = new Box(new Vector2(-370, 230), new Vector2(10, 110), Type.Ground);
    world.register(b);

    let xStart = -450;
    let yStart = 700;
    let gap = 10;
    let size = 30;

    let frictions = [0.5, 0.2, 0.12, 0.0];

    for (let i = 0; i < frictions.length; i++)
    {
        b = new Box(new Vector2(xStart + (size + gap) * i, yStart), new Vector2(size, size));
        b.friction = frictions[i];
        b.linearVelocity.x = 120;
        world.register(b);
    }
}
Reflect.set(demo7, "SimulationName", "Friction test");

function demo8(world: World): void
{
    updateSetting("g", true);
    let g = new Box(new Vector2(), new Vector2(Settings.width * 2, 20), Type.Ground);
    g.restitution = 0.8;
    world.register(g);

    let count = 7;
    let gap = 100;
    let xStart = -(count - 1) / 2 * gap;

    let yStart = 600;
    let size = 30;

    for (let i = 0; i < count; i++)
    {
        let b = new Box(new Vector2(xStart + gap * i, yStart), new Vector2(size, size));
        let attenuation = (count - i) / count;
        b.restitution = 1.0 - attenuation * attenuation;
        world.register(b);
    }
}
Reflect.set(demo8, "SimulationName", "Restitution test");

export const demos: ((world: World) => void)[] = [demo1, demo2, demo3, demo4, demo5, demo6, demo7, demo8];