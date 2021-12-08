import { Box } from "./box.js";
import { RigidBody, Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import { Settings, updateSetting } from "./settings.js";
import { World } from "./world.js";
import * as Util from "./util.js";
import { Circle } from "./circle.js";
import { RevoluteJoint } from "./revolute.js";
import { DistanceJoint } from "./distance.js";
import { Joint } from "./joint.js";
import { Game } from "./game.js";
import * as Input from "./input.js";
import { Polygon } from "./polygon.js";
import { AngleJoint } from "./angle.js";
import { WeldJoint } from "./weld.js";
import { LineJoint } from "./line.js";
import { MaxDistanceJoint } from "./maxdistance.js";
import { PrismaticJoint } from "./prismatic.js";
import { MotorJoint } from "./motor.js";

const ground = new Box(Settings.width * 5, 0.4, Type.Static);
ground.restitution = 0.45;

Reflect.set(demo1, "SimulationName", "Single box");
function demo1(game: Game, world: World): void
{
    updateSetting("g", true);
    world.register(ground);
    let b = new Box(0.4);
    b.position = new Vector2(0, 5);
    b.restitution = 0.7;
    b.angularVelocity = Util.random(-8, 8);
    world.register(b);
}

Reflect.set(demo2, "SimulationName", "Box stacking");
function demo2(game: Game, world: World): void
{
    updateSetting("g", true);
    world.register(ground);

    let start = 0.5;
    let size = 0.3;
    let gap = 0.05;

    for (let i = 0; i < 12; i++)
    {
        let b = new Box(size);
        b.position = new Vector2(Util.random(-0.015, 0.015), start + i * (size + gap));
        world.register(b);
    }
}

Reflect.set(demo3, "SimulationName", "Pyramid");
function demo3(game: Game, world: World): void
{
    updateSetting("g", true);
    world.register(ground);

    const rows = 12;
    const boxSize = 0.35;
    const xGap = 0.05;
    const yGap = 0.3;
    const xStart = - rows * boxSize / 2.0;
    const yStart = 0.6;

    for (let y = 0; y < rows; y++)
    {
        for (let x = 0; x < rows - y; x++)
        {
            let b = new Box(boxSize);
            b.position = new Vector2(xStart + y * (boxSize + xGap) / 2 + x * (boxSize + xGap), yStart + y * (boxSize + yGap));
            world.register(b);
        }
    }
}

Reflect.set(demo4, "SimulationName", "Seesaw");
function demo4(game: Game, world: World): void
{
    updateSetting("g", true);
    world.register(ground);

    let seesaw = new Box(6, 0.1);
    seesaw.position = new Vector2(0, 0.45);
    seesaw.mass = 10;
    seesaw.inertia = Util.calculateBoxInertia(6, 0.1, 10);
    world.register(seesaw);

    let j = new RevoluteJoint(ground, seesaw, seesaw.position, 45, 1.0);
    world.register(j);

    let b: RigidBody = new Circle(0.2);
    b.position = new Vector2(-2.5, 1);
    world.register(b);
    b = new Box(0.2);
    b.position = new Vector2(-2.8, 1);
    b.mass = 1;
    b.inertia = Util.calculateBoxInertia(0.2, 0.2, 1);
    world.register(b);
    b = new Box(0.5);
    b.position = new Vector2(2.6, 5);
    b.mass = 30;
    b.inertia = Util.calculateBoxInertia(0.5, 0.5, 30);
    world.register(b);
}

Reflect.set(demo5, "SimulationName", "Billiard");
function demo5(game: Game, world: World): void
{
    updateSetting("g", false);

    let lstart = -4;
    let rstart = 2.5;

    let c = new Circle(0.2);
    c.position = new Vector2(lstart, Settings.stageHeight / 2.0);
    c.linearVelocity.x = 3;
    c.restitution = 1;
    world.register(c);

    c = new Circle(0.2);
    c.position = new Vector2(rstart, Settings.stageHeight / 2.0);
    c.angularVelocity = 5;
    c.restitution = 1;
    world.register(c);

    c = new Circle(0.2);
    c.position = new Vector2(rstart + 0.6, Settings.stageHeight / 2.0 + 0.3);
    c.restitution = 1;
    world.register(c);

    c = new Circle(0.2);
    c.position = new Vector2(rstart + 0.5, Settings.stageHeight / 2.0 - 0.5);
    c.restitution = 1;
    world.register(c);

    c = new Circle(0.2);
    c.position = new Vector2(rstart + 1.6, Settings.stageHeight / 2.0 + 0.9);
    c.restitution = 1;
    world.register(c);

    c = new Circle(0.2);
    c.position = new Vector2(rstart + 1.3, Settings.stageHeight / 2.0 + 0.1);
    c.restitution = 1;
    world.register(c);

    c = new Circle(0.2);
    c.position = new Vector2(rstart + 1.5, Settings.stageHeight / 2.0 - 0.8);
    c.restitution = 1;
    world.register(c);
}

Reflect.set(demo6, "SimulationName", "Throwing spinning stick");
function demo6(game: Game, world: World): void
{
    updateSetting("g", false);
    world.register(ground);

    const center = new Vector2(3, Settings.stageHeight / 2.0);

    for (let i = 0; i < 70; i++)
    {
        let r = Util.random(0.3, 2.8);
        let a = Util.random(0, Math.PI * 2);
        let p = new Vector2(Math.cos(a), Math.sin(a)).mul(r);
        let c = Util.createRandomConvexBody(0.09);
        c.position = center.add(p);
        c.mass = 1;
        c.inertia = Util.calculateCircleInertia(0.09, 1);
        world.register(c);
    }

    let b = new Box(0.1, 2);
    b.position = new Vector2(-5, Settings.stageHeight / 2.0);
    b.mass = 30;
    b.inertia = Util.calculateBoxInertia(0.1, 2, 30);

    b.linearVelocity.x = 3;
    b.angularVelocity = 10;

    world.register(b);
}

Reflect.set(demo7, "SimulationName", "Friction test");
function demo7(game: Game, world: World): void
{
    updateSetting("g", true);
    world.register(ground);

    let b = new Box(6, 0.1, Type.Static);
    b.position = new Vector2(-0.6, 5);
    b.rotation = -0.15;
    b.friction = 1.0;
    world.register(b);
    b = new Box(6, 0.1, Type.Static);
    b.position = new Vector2(0, 3);
    b.rotation = 0.15;
    b.friction = 1.0;
    world.register(b);
    b = new Box(6, 0.1, Type.Static);
    b.position = new Vector2(-0.6, 1);
    b.rotation = -0.15;
    b.friction = 1.0;
    world.register(b);

    b = new Box(0.1, 1.1, Type.Static);
    b.position = new Vector2(3.1, 4.3);
    world.register(b);
    b = new Box(0.1, 1.1, Type.Static);
    b.position = new Vector2(-3.7, 2.3);
    world.register(b);

    let xStart = -4.5;
    let yStart = 7.0;
    let gap = 0.30;
    let size = 0.30;

    let frictions = [0.5, 0.3, 0.2, 0.12, 0.0];

    for (let i = 0; i < frictions.length; i++)
    {
        b = new Box(size, size);
        b.position = new Vector2(xStart + (size + gap) * i, yStart);
        b.friction = frictions[i];
        b.linearVelocity.x = 1.2;
        world.register(b);
    }
}

Reflect.set(demo8, "SimulationName", "Restitution test");
function demo8(game: Game, world: World): void
{
    updateSetting("g", true);
    let g = new Box(Settings.stageWidth * 2, 0.4, Type.Static);
    g.restitution = 0.7;
    world.register(g);

    let count = 7;
    let gap = 1.0;
    let xStart = -(count - 1) / 2 * gap;

    let yStart = 6.2;
    let size = 0.3;

    for (let i = 0; i < count; i++)
    {
        let b = new Box(size);
        b.position = new Vector2(xStart + gap * i, yStart);
        let attenuation = (count - i) / count;
        b.restitution = 1.0 - attenuation * attenuation;
        world.register(b);
    }
}

Reflect.set(demo9, "SimulationName", "Single pendulum");
function demo9(game: Game, world: World): void
{
    updateSetting("g", true);
    world.register(ground);

    let b = new Box(0.3);
    b.position = new Vector2(-3, 5);
    world.register(b);

    let j = new RevoluteJoint(ground, b, new Vector2(0, 5));
    world.register(j);
}

Reflect.set(demo10, "SimulationName", "Multi pendulum");
function demo10(game: Game, world: World): void
{
    updateSetting("g", true);
    world.register(ground);

    let xStart = 0;
    let yStart = 5;
    let sizeW = 0.3;
    let sizeH = 0.15;
    let gap = 0.1;

    let b1: RigidBody = new Box(sizeW, sizeH);
    b1.position = new Vector2(xStart - (gap + sizeW), yStart);
    world.register(b1);

    let j: Joint = new RevoluteJoint(ground, b1, new Vector2(xStart, yStart));
    world.register(j);

    for (let i = 1; i < 12; i++)
    {
        let b2 = new Box(sizeW, sizeH);
        b2.position = new Vector2(xStart - (gap + sizeW) * (i + 1), yStart);
        world.register(b2);
        j = new RevoluteJoint(b1, b2, new Vector2(xStart - (sizeW + gap) / 2 - (gap + sizeW) * i, yStart), 8, 0.5);
        // j = new DistanceJoint(b1, b2, b1.position.subV(new Vector2(sizeW / 2, 0)), b2.position.addV(new Vector2(sizeW / 2, 0)));
        world.register(j);
        j.drawAnchor = false;
        b1 = b2;
    }
}

Reflect.set(demo11, "SimulationName", "Suspension bridge");
function demo11(game: Game, world: World): void
{
    updateSetting("g", true);
    world.register(ground);

    let revoluteBridge = true;
    let groundStart = 0.2;

    let xStart = -5;
    let yStart = 4;
    let gap = 0.1;

    let pillarWidth = 0.3;
    let sizeX = 0.5;
    let sizeY = sizeX * 0.25;

    let pillar = new Box(pillarWidth, yStart, Type.Static);
    pillar.position = new Vector2(xStart, yStart / 2 + 0.2);
    world.register(pillar);

    let b1 = new Box(sizeX, sizeY);
    b1.mass = 10;
    b1.position = new Vector2(xStart + sizeX / 2 + pillarWidth / 2 + gap, yStart + groundStart);
    world.register(b1);

    let j!: Joint;

    if (revoluteBridge)
    {
        j = new RevoluteJoint(pillar, b1, pillar.position.add(new Vector2(pillarWidth, yStart).div(2)), 7, 1.0);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j);
    } else
    {
        j = new DistanceJoint(pillar, b1, pillar.position.add(new Vector2(pillarWidth / 2, yStart / 2)), b1.position.add(new Vector2(-sizeX / 2, 0.03)), -1, 3, 1.0);
        j.drawAnchor = false;
        world.register(j);
        j = new DistanceJoint(pillar, b1, pillar.position.add(new Vector2(pillarWidth / 2, yStart / 2)), b1.position.add(new Vector2(-sizeX / 2, -0.03)), -1, 3, 1.0);
        j.drawAnchor = false;
        world.register(j);
    }

    for (let i = 1; i + 1 < xStart * -2 / (sizeX + gap); i++)
    {
        let b2 = new Box(sizeX, sizeY);
        b2.mass = 10;
        b2.position = new Vector2(xStart + sizeX / 2 + pillarWidth / 2 + gap + (gap + sizeX) * i, yStart + groundStart);
        world.register(b2);

        if (revoluteBridge)
        {
            j = new RevoluteJoint(b1, b2, b1.position.add(b2.position).div(2), 7, 1.0);
            j.drawAnchor = false;
            world.register(j);
        }
        else
        {
            j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(sizeX / 2, 0.03)), b2.position.add(new Vector2(-sizeX / 2, 0.03)), -1, 3, 1.0);
            j.drawAnchor = false;
            world.register(j);
            j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(sizeX / 2, -0.03)), b2.position.add(new Vector2(-sizeX / 2, -0.03)), -1, 3, 1.0);
            j.drawAnchor = false;
            world.register(j);
        }

        b1 = b2;
    }

    pillar = new Box(pillarWidth, yStart, Type.Static);
    pillar.position = new Vector2(-xStart, yStart / 2 + 0.2);
    world.register(pillar);

    if (revoluteBridge)
    {
        j = new RevoluteJoint(pillar, b1, pillar.position.add(new Vector2(-pillarWidth, yStart).div(2)), 7, 1.0);
        j.drawConnectionLine = false;
        j.drawAnchor = false;
        world.register(j);
    }
    else
    {
        j = new DistanceJoint(pillar, b1, pillar.position.add(new Vector2(-pillarWidth / 2, yStart / 2)), b1.position.add(new Vector2(sizeX / 2, 0.03)), -1, 3, 1.0);
        j.drawAnchor = false;
        world.register(j);
        j = new DistanceJoint(pillar, b1, pillar.position.add(new Vector2(-pillarWidth / 2, yStart / 2)), b1.position.add(new Vector2(sizeX / 2, -0.03)), -1, 3, 1.0);
        j.drawAnchor = false;
        world.register(j);
    }
}

Reflect.set(demo12, "SimulationName", "Circle stacking");
function demo12(game: Game, world: World): void
{
    updateSetting("g", true);

    world.register(ground);

    let xStart = -4.0;
    let yStart = 1.0;
    let size = 0.3;
    let gap = 0.3;

    let rows = 10;

    for (let i = 0; i < rows; i++)
    {
        for (let j = i; j < rows; j++)
        {
            let c = new Circle(size);
            c.mass = (1 + i) + (1 + i) * j;
            c.position.x = xStart + (gap + size * 2) * i;
            c.position.y = yStart + (gap + size * 2) * j;
            world.register(c);
        }
    }
}

Reflect.set(demo13, "SimulationName", "Spring test");
function demo13(game: Game, world: World): void
{
    updateSetting("g", false);

    let b1 = new Box(0.3, 6, Type.Static);
    b1.position.y = Settings.stageHeight / 2;
    world.register(b1);

    let b2 = new Box(0.3);
    b2.position.x = 3;
    b2.position.y = Settings.stageHeight / 2 + 2;
    world.register(b2);

    let j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(0, 2)), b2.position, 2, 1, 0.05);
    world.register(j);

    b2 = new Box(0.3);
    b2.position.x = 3;
    b2.position.y = Settings.stageHeight / 2;
    world.register(b2);

    j = new DistanceJoint(b1, b2, b1.position, b2.position, 2, 1, 0.2);
    world.register(j);

    b2 = new Box(0.3);
    b2.position.x = 3;
    b2.position.y = Settings.stageHeight / 2 - 2;
    world.register(b2);

    j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(0, -2)), b2.position, 2, 1, 0.7);
    world.register(j);

    b2 = new Box(0.3);
    b2.position.x = -3;
    b2.position.y = Settings.stageHeight / 2 + 2;
    world.register(b2);

    j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(0, 2)), b2.position, 2, 0.5, 0.2);
    world.register(j);

    b2 = new Box(0.3);
    b2.position.x = -3;
    b2.position.y = Settings.stageHeight / 2;
    world.register(b2);

    let halfLife = 1;
    let frequency = -Math.log(0.5) / (halfLife * Math.PI * 2);

    j = new DistanceJoint(b1, b2, b1.position, b2.position, 2, frequency, 1);
    world.register(j);

    b2 = new Box(0.3);
    b2.position.x = -3;
    b2.position.y = Settings.stageHeight / 2 - 2;
    world.register(b2);

    j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(0, -2)), b2.position, 2, 2, 0.01);
    world.register(j);
}

Reflect.set(demo14, "SimulationName", "Weld joint test");
function demo14(game: Game, world: World): void
{
    updateSetting("g", true);

    world.register(ground);

    for (let i = 0; i < 30; i++)
    {
        let start = new Vector2(Util.random(-8, 8), Util.random(0.5, 15));

        let rr = Util.random(-0.05, 0.05);
        let cos = Math.cos(rr);
        let sin = Math.sin(rr);

        let b1 = Util.createRegularPolygon(0.15);
        b1.position = start.add(new Vector2(cos, sin).mul(-0.4));
        world.register(b1);

        let b2 = new Box(0.8, 0.03);
        b2.position = start;
        b2.rotation = rr;
        world.register(b2);

        let b3 = Util.createRegularPolygon(0.15);
        b3.position = start.add(new Vector2(cos, sin).mul(0.4));
        world.register(b3);

        let j = new WeldJoint(b1, b2);
        world.register(j, true);
        j = new WeldJoint(b2, b3);
        world.register(j, true);

        b2.addVelocity(new Vector2(-b2.position.x, 0));
    }
}

Reflect.set(demo15, "SimulationName", "Line joint test");
function demo15(game: Game, world: World): void
{
    updateSetting("g", true);

    world.register(ground);

    let b1 = new Box(0.3);
    b1.position.y = 5;
    b1.angularVelocity = 10;
    world.register(b1);

    let j: Joint = new LineJoint(ground, b1);
    world.register(j);

    let b2 = new Box(1, 0.2, Type.Static);
    b2.position.x = -3;
    b2.position.y = 3;
    world.register(b2);

    let c: RigidBody = Util.createRegularPolygon(0.25, 3);
    c.position.x = -1;
    c.position.y = 3;
    c.angularVelocity = 3;
    world.register(c);

    j = new MaxDistanceJoint(b2, c, 5, undefined, undefined, 1, 0.1);
    j.drawConnectionLine = false;
    world.register(j);

    j = new LineJoint(b2, c);
    world.register(j);

    c = new Circle(0.15);
    c.position = b2.position.add(new Vector2(-1, 1));
    world.register(c);

    j = new LineJoint(b2, c);
    world.register(j);

    let b3 = new Box(0.3);
    b3.position = b2.position.add(new Vector2(0, -1));
    world.register(b3);

    j = new LineJoint(b2, b3, b2.position.add(new Vector2(0.15, 0)), b3.position.add(new Vector2(0.15, 0)));
    world.register(j);
    j = new AngleJoint(b2, b3, 240);
    world.register(j);
}

Reflect.set(demo16, "SimulationName", "Max distance joint test");
function demo16(game: Game, world: World): void
{
    updateSetting("g", true);

    world.register(ground);

    let c = new Box(0.3, 0.3, Type.Static);
    c.position.y = 5.0;
    world.register(c);

    let b = Util.createRegularPolygon(0.25);
    b.position.y = 1.5;
    b.position.x = Util.random(-1, 1);
    world.register(b);

    let j: Joint = new MaxDistanceJoint(c, b, 2, undefined, undefined, 0.7, 0.1);
    world.register(j, true);

    // j = new MaxDistanceJoint(ground, b, 300, undefined, undefined, 1, 0.1);
    // world.register(j)

    c = new Box(0.3);
    c.position.x = -2;
    c.position.y = 6;
    world.register(c);

    b = Util.createRegularPolygon(0.15);
    b.position.x = 2;
    b.position.y = 6;
    world.register(b);

    j = new MaxDistanceJoint(c, b, 1.2, undefined, undefined, 0.7, 0.1);
    world.register(j);
}

Reflect.set(demo17, "SimulationName", "Prismatic joint test");
function demo17(game: Game, world: World): void
{
    updateSetting("g", true);

    world.register(ground);

    let b0: RigidBody = new Box(0.3);
    b0.position.y = 0.1;
    world.register(b0);

    let j: Joint = new PrismaticJoint(ground, b0);
    world.register(j);

    let b1 = new Box(2, 0.3, Type.Static);
    b1.position = new Vector2(-4, 6);
    world.register(b1);

    let b2 = new Box(0.8, 0.2);
    b2.restitution = 0.7;
    b2.position = new Vector2(-4, 1);
    world.register(b2);

    j = new PrismaticJoint(b1, b2, undefined, undefined);
    world.register(j);
    j = new MaxDistanceJoint(b1, b2, 3.9, undefined, undefined, 1, 0.1);
    j.drawAnchor = false;
    j.drawConnectionLine = false;
    world.register(j);

    let b: RigidBody = new Box(0.4);
    b.restitution = 0.7;
    b.position = new Vector2(-4, 2.5);
    world.register(b);

    let b3 = new Box(1.2, 0.2);
    b3.position = new Vector2(3, 6);
    world.register(b3);
    j = new PrismaticJoint(b1, b3, undefined, undefined, new Vector2(1, 0));
    world.register(j);

    j = new MaxDistanceJoint(b1, b3, 6.3, undefined, undefined, 1, 0.2);
    j.drawConnectionLine = false;
    world.register(j);

    b = Util.createRegularPolygon(0.15);
    b.position = new Vector2(2.5, 5.0);
    world.register(b);

    j = new DistanceJoint(b3, b);
    world.register(j);

    b = Util.createRegularPolygon(0.15);
    b.position = new Vector2(2.5, 3.5);
    world.register(b);

    j = new DistanceJoint(b, j.bodyB);
    world.register(j);

    b = new Box(1.2, 0.2);
    b.position = new Vector2(3.5, 2.5);
    world.register(b);

    j = new DistanceJoint(b, j.bodyA);
    world.register(j);

    b = new Box(0.2, 0.8, Type.Static);
    b.position = new Vector2(6, 2.5);
    world.register(b);

    let j1 = new PrismaticJoint(b, j.bodyA, new Vector2(6, 2.5), undefined, new Vector2(-1, 0));
    world.register(j);

    b = new Box(0.8, 0.15);
    b.position = new Vector2(4.5, 5.0);
    world.register(b);

    j = new LineJoint(j1.bodyA, b);
    world.register(j);

    j = new AngleJoint(ground, j1.bodyB);
    world.register(j);
}

Reflect.set(demo18, "SimulationName", "Motor joint test");
function demo18(game: Game, world: World): void
{
    updateSetting("g", true);

    let b1 = new Box(0.2, 3.2, Type.Static);
    b1.position.y = 1.5;
    world.register(b1);

    let b2 = new Box(2.0, 0.2);
    b2.position.y = 3.0;
    world.register(b2);

    let j = new MotorJoint(b1, b2, b2.position, 1000, 10.0);
    world.register(j, true);

    let last_spawn = 0;

    game.callback = () =>
    {
        j.angularOffset = b2.rotation + 0.05;

        if (game.time - last_spawn > 0.2)
        {
            let c = Util.createRegularPolygon(0.15);
            c.position.x = Util.random(-2.0, 2.0);
            c.position.y = 6.0;
            world.register(c);
            last_spawn = game.time;
        }
    }
}
export const demos: ((game: Game, world: World) => void)[] =
    [demo1, demo2, demo3, demo4, demo5, demo6, demo7, demo8, demo9, demo10,
        demo11, demo12, demo13, demo14, demo15, demo16, demo17, demo18];