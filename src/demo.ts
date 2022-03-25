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
import { AngleJoint } from "./angle.js";
import { WeldJoint } from "./weld.js";
import { LineJoint } from "./line.js";
import { MaxDistanceJoint } from "./maxdistance.js";
import { PrismaticJoint } from "./prismatic.js";
import { MotorJoint } from "./motor.js";
import { Engine } from "./engine.js";
import { Polygon } from "./polygon.js";
import { ContactInfo } from "./contact.js";


Reflect.set(demo1, "SimulationName", "Single box");
function demo1(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
    world.register(ground);

    let b = new Box(0.4);
    b.mass = 2.0;
    b.position = new Vector2(0, 5);
    b.restitution = 0.7;
    b.angularVelocity = Util.random(-8, 8);
    world.register(b);
}

Reflect.set(demo2, "SimulationName", "Box stacking");
function demo2(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;

    world.register(ground);

    let start = 0.5;
    let size = 0.3;
    let gap = 0.25;

    // let error = 0.015;
    let error = 0.0;

    for (let i = 0; i < 20; i++)
    {
        let b = new Box(size);
        // let b = Util.createRegularPolygon(size / 2, 6);
        b.position = new Vector2(Util.random(-error, error), start + i * (size + gap));
        b.restitution = 0.0;
        world.register(b);
    }
}

Reflect.set(demo3, "SimulationName", "Pyramid");
function demo3(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
    world.register(ground);

    const rows = 15;
    const boxSize = 0.35;
    const xGap = 0.05;
    const yGap = 0.15;
    const xStart = - (rows - 1) * (boxSize + xGap) / 2.0;
    const yStart = 0.55;

    for (let y = 0; y < rows; y++)
    {
        for (let x = 0; x < rows - y; x++)
        {
            let b = new Box(boxSize);
            b.position = new Vector2(xStart + y * (boxSize + xGap) / 2 + x * (boxSize + xGap), yStart + y * (boxSize + yGap));
            b.restitution = 0.0;
            world.register(b);
        }
    }
}

Reflect.set(demo4, "SimulationName", "Random convex shapes");
function demo4(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
    world.register(ground);

    const rows = 12;
    const size = 0.3;
    const xGap = 0.2;
    const yGap = 0.15;
    const xStart = - (rows - 1) * (size + xGap) / 2.0;
    const yStart = 1.0;

    for (let y = 0; y < rows; y++)
    {
        for (let x = 0; x < rows - y; x++)
        {
            let b = Util.createRandomConvexBody(size, 4, 10.0);
            b.position = new Vector2(xStart + y * (size + xGap) / 2 + x * (size + xGap), yStart + y * (size + yGap));
            b.linearVelocity = b.position.mul(Util.random(0.5, 0.7));
            b.friction = Util.random(0.2, 1.0);
            world.register(b);
        }
    }

    let pillar = new Box(0.25, 4, Type.Static);
    pillar.position = new Vector2(xStart - 0.2, 3);
    world.register(pillar);

    pillar = new Box(0.25, 4, Type.Static);
    pillar.position = new Vector2(-(xStart - 0.2), 3);
    world.register(pillar);
}

Reflect.set(demo5, "SimulationName", "Seesaw");
function demo5(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
    world.register(ground);

    let seesaw = new Box(6, 0.1);
    seesaw.position = new Vector2(0, 0.45);
    seesaw.mass = 10;
    world.register(seesaw);

    let j = new RevoluteJoint(ground, seesaw, seesaw.position, 60, 1.0);
    world.register(j);

    let b: RigidBody = new Circle(0.2);
    b.position = new Vector2(-2.5, 1);
    world.register(b);
    b = new Box(0.2);
    b.position = new Vector2(-2.8, 1);
    b.mass = 1;
    world.register(b);
    b = new Box(0.5);
    b.position = new Vector2(2.5, 5);
    b.mass = 30;
    world.register(b);
}

Reflect.set(demo6, "SimulationName", "Billiards");
function demo6(game: Game, world: World): void
{
    updateSetting("g", false);

    let lstart = -4;
    let rstart = 2.5;

    let c = new Circle(0.2);
    c.position = new Vector2(lstart, Settings.clipHeight / 2.0);
    c.linearVelocity.x = 3;
    c.restitution = 1;
    world.register(c);

    c = new Circle(0.2);
    c.position = new Vector2(rstart, Settings.clipHeight / 2.0);
    c.angularVelocity = 5;
    c.restitution = 1;
    world.register(c);

    c = new Circle(0.2);
    c.position = new Vector2(rstart + 0.6, Settings.clipHeight / 2.0 + 0.3);
    c.restitution = 1;
    world.register(c);

    c = new Circle(0.2);
    c.position = new Vector2(rstart + 0.5, Settings.clipHeight / 2.0 - 0.5);
    c.restitution = 1;
    world.register(c);

    c = new Circle(0.2);
    c.position = new Vector2(rstart + 1.6, Settings.clipHeight / 2.0 + 0.9);
    c.restitution = 1;
    world.register(c);

    c = new Circle(0.2);
    c.position = new Vector2(rstart + 1.3, Settings.clipHeight / 2.0 + 0.1);
    c.restitution = 1;
    world.register(c);

    c = new Circle(0.2);
    c.position = new Vector2(rstart + 1.5, Settings.clipHeight / 2.0 - 0.8);
    c.restitution = 1;
    world.register(c);
}

Reflect.set(demo7, "SimulationName", "Throwing spinning stick");
function demo7(game: Game, world: World): void
{
    updateSetting("g", false);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
    world.register(ground);

    const center = new Vector2(3, Settings.clipHeight / 2.0);

    for (let i = 0; i < 70; i++)
    {
        let r = Util.random(0.3, 2.8);
        let a = Util.random(0, Math.PI * 2);
        let p = new Vector2(Math.cos(a), Math.sin(a)).mul(r);
        let c = Util.createRandomConvexBody(0.09);
        c.position = center.add(p);
        c.mass = 1;
        world.register(c);
    }

    let b = new Box(0.1, 2);
    b.position = new Vector2(-5, Settings.clipHeight / 2.0);
    b.mass = 30;

    b.linearVelocity.x = 3;
    b.angularVelocity = 10;

    world.register(b);
}

Reflect.set(demo8, "SimulationName", "Friction test");
function demo8(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
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

    let frictions = [0.51, 0.31, 0.21, 0.11, 0.0];

    for (let i = 0; i < frictions.length; i++)
    {
        b = new Box(size, size);
        b.position = new Vector2(xStart + (size + gap) * i, yStart);
        b.friction = frictions[i];
        b.linearVelocity.x = 1.2;
        world.register(b);
    }
}

Reflect.set(demo9, "SimulationName", "Restitution test");
function demo9(game: Game, world: World): void
{
    updateSetting("g", true);
    let g = new Box(Settings.clipWidth * 2, 0.4, Type.Static);
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

Reflect.set(demo10, "SimulationName", "Single pendulum");
function demo10(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
    world.register(ground);

    let b = new Box(0.3);
    b.mass = 2.0;
    b.position = new Vector2(-3, 5);
    world.register(b);

    let j = new RevoluteJoint(ground, b, new Vector2(0, 5), -1);
    world.register(j);
}

Reflect.set(demo11, "SimulationName", "Multi pendulum");
function demo11(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
    world.register(ground);

    let xStart = 0;
    let yStart = 5;
    let sizeW = 0.3;
    let sizeH = 0.15;
    let gap = 0.1;

    let b1: RigidBody = new Box(sizeW, sizeH);
    b1.mass = 1.0;
    b1.position = new Vector2(xStart - (gap + sizeW), yStart);
    world.register(b1);

    let j: Joint = new RevoluteJoint(ground, b1, new Vector2(xStart, yStart));
    world.register(j);

    for (let i = 1; i < 12; i++)
    {
        let b2 = new Box(sizeW, sizeH);
        b2.mass = 1.0;
        b2.position = new Vector2(xStart - (gap + sizeW) * (i + 1), yStart);
        world.register(b2);
        j = new RevoluteJoint(b1, b2, new Vector2(xStart - (sizeW + gap) / 2 - (gap + sizeW) * i, yStart), 10, 0.5);
        // j = new DistanceJoint(b1, b2, b1.position.subV(new Vector2(sizeW / 2, 0)), b2.position.addV(new Vector2(sizeW / 2, 0)));
        world.register(j);
        j.drawAnchor = false;
        b1 = b2;
    }
}

Reflect.set(demo12, "SimulationName", "Suspension bridge");
function demo12(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
    world.register(ground);

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

    let revoluteBridge = Util.random(0, 1) > 0.5;
    let frequecy = 7;

    if (revoluteBridge)
    {
        j = new RevoluteJoint(pillar, b1, pillar.position.add(new Vector2(pillarWidth, yStart).div(2)), frequecy, 1.0);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j);
    } else
    {
        j = new DistanceJoint(pillar, b1, pillar.position.add(new Vector2(pillarWidth / 2, yStart / 2)), b1.position.add(new Vector2(-sizeX / 2, 0.03)), -1, frequecy, 1.0);
        j.drawAnchor = false;
        world.register(j);
        j = new DistanceJoint(pillar, b1, pillar.position.add(new Vector2(pillarWidth / 2, yStart / 2)), b1.position.add(new Vector2(-sizeX / 2, -0.03)), -1, frequecy, 1.0);
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
            j = new RevoluteJoint(b1, b2, b1.position.add(b2.position).div(2), frequecy, 1.0);
            j.drawAnchor = false;
            world.register(j);
        }
        else
        {
            j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(sizeX / 2, 0.03)), b2.position.add(new Vector2(-sizeX / 2, 0.03)), -1, frequecy, 1.0);
            j.drawAnchor = false;
            world.register(j);
            j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(sizeX / 2, -0.03)), b2.position.add(new Vector2(-sizeX / 2, -0.03)), -1, frequecy, 1.0);
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
        j = new RevoluteJoint(pillar, b1, pillar.position.add(new Vector2(-pillarWidth, yStart).div(2)), frequecy, 1.0);
        j.drawConnectionLine = false;
        j.drawAnchor = false;
        world.register(j);
    }
    else
    {
        j = new DistanceJoint(pillar, b1, pillar.position.add(new Vector2(-pillarWidth / 2, yStart / 2)), b1.position.add(new Vector2(sizeX / 2, 0.03)), -1, frequecy, 1.0);
        j.drawAnchor = false;
        world.register(j);
        j = new DistanceJoint(pillar, b1, pillar.position.add(new Vector2(-pillarWidth / 2, yStart / 2)), b1.position.add(new Vector2(sizeX / 2, -0.03)), -1, frequecy, 1.0);
        j.drawAnchor = false;
        world.register(j);
    }
}

Reflect.set(demo13, "SimulationName", "Circle stacking");
function demo13(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
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
            c.mass = (1 + i) + (1 + i) * j + 2;
            c.position.x = xStart + (gap + size * 2) * i;
            c.position.y = yStart + (gap + size * 2) * j;
            world.register(c);
        }
    }
}

Reflect.set(demo14, "SimulationName", "Springs");
function demo14(game: Game, world: World): void
{
    updateSetting("g", false);

    let b1 = new Box(0.3, 6, Type.Static);
    b1.position.y = Settings.clipHeight / 2;
    world.register(b1);

    let b2 = new Box(0.3);
    b2.position.x = 3;
    b2.position.y = Settings.clipHeight / 2 + 2;
    world.register(b2);

    let j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(0, 2)), b2.position, 2, 1, 0.05);
    world.register(j);

    b2 = new Box(0.3);
    b2.position.x = 3;
    b2.position.y = Settings.clipHeight / 2;
    world.register(b2);

    j = new DistanceJoint(b1, b2, b1.position, b2.position, 2, 1, 0.2);
    world.register(j);

    b2 = new Box(0.3);
    b2.position.x = 3;
    b2.position.y = Settings.clipHeight / 2 - 2;
    world.register(b2);

    j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(0, -2)), b2.position, 2, 1, 0.7);
    world.register(j);

    b2 = new Box(0.3);
    b2.position.x = -3;
    b2.position.y = Settings.clipHeight / 2 + 2;
    world.register(b2);

    j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(0, 2)), b2.position, 2, 0.5, 0.2);
    world.register(j);

    b2 = new Box(0.3);
    b2.position.x = -3;
    b2.position.y = Settings.clipHeight / 2;
    world.register(b2);

    // Reduce the amplitude by half every second
    let halfLife = 1;
    let frequency = -Math.log(0.5) / (halfLife * Math.PI * 2);

    j = new DistanceJoint(b1, b2, b1.position, b2.position, 2, frequency, 1);
    world.register(j);

    b2 = new Box(0.3);
    b2.position.x = -3;
    b2.position.y = Settings.clipHeight / 2 - 2;
    world.register(b2);

    j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(0, -2)), b2.position, 2, 2, 0.01);
    world.register(j);
}

Reflect.set(demo15, "SimulationName", "Weld joint: Dumbbells");
function demo15(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
    world.register(ground);

    for (let i = 0; i < 33; i++)
    {
        let start = new Vector2(Util.random(-8, 8), Util.random(0.5, 15));

        let rr = Util.random(-0.05, 0.05);
        let cos = Math.cos(rr);
        let sin = Math.sin(rr);

        let b2 = new Box(0.8, 0.03);
        b2.mass = 2.0;
        b2.restitution = 0.0;
        b2.position = start;
        b2.rotation = rr;
        world.register(b2);

        let b1 = Util.createRegularPolygon(0.15);
        b1.mass = 2.0;
        b1.position = start.add(new Vector2(cos, sin).mul(-0.4));
        b1.restitution = 0.0;
        world.register(b1);

        let b3 = Util.createRegularPolygon(0.15);
        b3.mass = 2.0;
        b3.restitution = 0.0;
        b3.position = start.add(new Vector2(cos, sin).mul(0.4));
        world.register(b3);

        let j = new WeldJoint(b1, b2);
        world.register(j, true);
        j = new WeldJoint(b2, b3);
        world.register(j, true);

        b2.linearVelocity.x += -b2.position.x;
    }
}

Reflect.set(demo16, "SimulationName", "Max distance joint");
function demo16(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
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

    j = new MaxDistanceJoint(c, b, 1.5, undefined, undefined, 0.7, 0.1);
    world.register(j);
}

Reflect.set(demo17, "SimulationName", "Prismatic joint");
function demo17(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
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
    b3.mass = 2.0;
    b3.position = new Vector2(3, 6);
    world.register(b3);
    j = new PrismaticJoint(b1, b3, undefined, undefined, new Vector2(1, 0));
    world.register(j);

    j = new MaxDistanceJoint(b1, b3, 6.3, undefined, undefined, 1, 0.2);
    j.drawConnectionLine = false;
    world.register(j);

    b = Util.createRegularPolygon(0.15);
    b.mass = 2.0;
    b.position = new Vector2(2.5, 5.0);
    world.register(b);

    j = new DistanceJoint(b3, b);
    world.register(j);

    b = Util.createRegularPolygon(0.15);
    b.mass = 2.0;
    b.position = new Vector2(2.5, 3.5);
    world.register(b);

    j = new DistanceJoint(b, j.bodyB);
    world.register(j);

    b = new Box(1.2, 0.2);
    b.mass = 2.0;
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

Reflect.set(demo18, "SimulationName", "Motor joint: Windmill");
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

        if ((game.frame - last_spawn) / Engine.fps > 0.2 * 144 * game.deltaTime)
        {
            let c = Util.createRegularPolygon(0.15, undefined, undefined, 18.0);

            c.position.x = Util.random(-1.8, 1.8);
            c.position.y = 6.0;
            world.register(c);
            last_spawn = game.frame;
        }
    }
}

Reflect.set(demo19, "SimulationName", "Conveyor belt");
function demo19(game: Game, world: World): void
{
    updateSetting("g", true);

    let b1 = new Box(3, 0.2, Type.Static);
    b1.restitution = 0.5;
    b1.surfaceSpeed = 1.0;
    b1.position.x = -4.0;
    b1.position.y = 5.0;
    world.register(b1);

    let b2 = new Box(5.5, 0.2, Type.Static);
    b2.restitution = 0.5;
    b2.surfaceSpeed = 1.0;
    b2.rotation = 0.2;
    b2.position.x = 0.5;
    b2.position.y = 4.0;
    world.register(b2);

    let b3 = new Box(3.5, 0.2, Type.Static);
    b3.restitution = 0.5;
    b3.surfaceSpeed = -1.0;
    b3.position.x = 4.55;
    b3.position.y = 2.0;
    world.register(b3);

    let b4 = new Box(2.0, 0.2, Type.Static);
    b4.restitution = 0.5;
    b4.surfaceSpeed = -1.0;
    b4.position.x = -4.55;
    b4.position.y = 2.0;
    world.register(b4);

    let xStart = -3.3;
    let yStart = 2.05;
    let sizeX = 0.4;
    let gap = 0.05;

    let b0 = new Box(sizeX, 0.1);
    b0.mass = 2.0;
    b0.surfaceSpeed = -1.5;
    b0.position.x = xStart;
    b0.position.y = yStart;
    world.register(b0);

    let j: Joint = new RevoluteJoint(b4, b0, b4.position.add(new Vector2(1.0, 0.0)));
    j.drawConnectionLine = false;
    j.drawAnchor = false;
    world.register(j);

    for (let i = 1; i < 14; i++)
    {
        let b1 = new Box(sizeX, 0.1);
        b1.mass = 2.0;
        b1.surfaceSpeed = -1.5;
        b1.position.x = xStart + (sizeX + gap) * i;
        b1.position.y = yStart;
        world.register(b1);

        j = new RevoluteJoint(b0, b1, b0.position.add(b1.position).div(2.0));
        j.drawAnchor = false;
        world.register(j);
        b0 = b1;
    }

    j = new RevoluteJoint(b3, b0, b0.position.add(new Vector2(0.2, 0.0)));
    j.drawConnectionLine = false;
    j.drawAnchor = false;
    world.register(j);

    let last_spawn = 0;

    game.callback = () =>
    {
        if ((game.frame - last_spawn) / Engine.fps > 0.3 * 144 * game.deltaTime)
        {
            let c = Util.createRegularPolygon(Util.random(0.1, 0.25), undefined, undefined, 20.0);
            c.restitution = 0.3;
            c.position.x = Util.random(-5.5, -3.0);
            c.position.y = 7.0;
            world.register(c);
            last_spawn = game.frame;
        }
    }
}

Reflect.set(demo20, "SimulationName", "Crankshaft");
function demo20(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
    world.register(ground);

    let m1: MotorJoint;
    let c1: RigidBody;

    {
        let xStart = -3.0;

        let b0 = new Box(0.5)
        b0.mass = 2.0;
        b0.position.x = xStart;
        b0.position.y = 4.0;
        world.register(b0);

        let sizeX = 1.0;
        let sizeY = 0.2;

        c1 = new Box(sizeX, sizeY);
        c1.mass = 2.0;
        (c1 as Polygon).repositionCenterOfMass(new Vector2(-sizeX / 2.0, 0.0));
        c1.position.x = xStart;
        c1.position.y = 1.5;
        world.register(c1);

        let j: Joint = new RevoluteJoint(ground, c1, c1.position);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j);

        let b1 = new Box(1.2, sizeY);
        b1.mass = 2.0;
        b1.position.x = xStart;
        b1.position.y = 3.3;
        world.register(b1);

        let b2 = new Box(0.2, 2.0);
        b2.mass = 2.0;
        b2.rotation = Math.atan2(sizeX, b1.position.y - c1.position.y);
        b2.position.x = xStart + sizeX / 2.0;
        b2.position.y = (c1.position.y + b1.position.y) / 2.0;
        world.register(b2);

        j = new RevoluteJoint(c1, b2, c1.position.add(new Vector2(sizeX, 0)));
        j.drawConnectionLine = false;
        world.register(j, true);
        world.addPassTestPair(b1, b2);

        j = new RevoluteJoint(b1, b2, b1.position);
        j.drawConnectionLine = false;
        world.register(j, true);

        j = new PrismaticJoint(ground, b1, ground.position.add(new Vector2(xStart, 0)));
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j);

        m1 = new MotorJoint(ground, c1, c1.position, 1000, 30.0);
        world.register(m1, true);
    }

    let m2: MotorJoint;
    let c2: RigidBody;

    {
        let xStart = 1.0;
        let yStart = 2.0;

        c2 = new Circle(0.7);
        c2.mass = 2.0;
        c2.position.x = xStart;
        c2.position.y = yStart;
        world.register(c2);

        let j: Joint = new RevoluteJoint(ground, c2, c2.position);
        j.drawConnectionLine = false;
        world.register(j);

        let b = new Box(1.5, 0.2);
        b.mass = 2.0;
        b.position.x = xStart + 1.5 / 2.0 + 0.7;
        b.position.y = yStart;
        world.register(b);

        j = new RevoluteJoint(c2, b, c2.position.add(new Vector2(0.7, 0)));
        j.drawConnectionLine = false;
        world.register(j, true);

        let b1 = new Box(2.0, 0.2);
        b1.mass = 2.0;
        b1.position.x = xStart + 0.7 + 1.5 + 1.0;
        b1.position.y = yStart;
        world.register(b1);

        j = new RevoluteJoint(b, b1, b.position.add(new Vector2(1.5 / 2.0, 0)));
        j.drawConnectionLine = false;
        world.register(j, true);

        j = new PrismaticJoint(ground, b1, c2.position, b1.position);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j);

        m2 = new MotorJoint(ground, c2, c2.position, 1000, 30);
        world.register(m2);

        b = new Box(0.4);
        b.mass = 2.0;
        b.position = new Vector2(3.0, 5.0);
        b.friction = 0.8;
        world.register(b);
    }

    game.callback = () =>
    {
        m1.angularOffset = c1.rotation + 0.04;
        m2.angularOffset = c2.rotation - 0.03;
    }
}

Reflect.set(demo21, "SimulationName", "Ragdoll");
function demo21(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
    world.register(ground);

    let density = 15;
    let body_start_y = 3.0;

    let head = new Box(0.4, 0.4)
    head.density = density;
    head.position.y = body_start_y + 1.25;
    world.register(head);

    let body_width = 0.65;
    let body_height = 0.4;

    let body1 = new Box(body_width, body_height);
    body1.density = density;
    body1.position.y = body_start_y;
    world.register(body1);
    let body2 = new Box(body_width - 0.1, body_height);
    body2.density = density;
    body2.position.y = body_start_y + body_height;
    world.register(body2);
    let body3 = new Box(body_width, body_height);
    body3.density = density;
    body3.position.y = body_start_y + body_height * 2;
    world.register(body3);
    let body0 = new Box(body_width, 0.2);
    body0.density = density;
    body0.position.y = body1.position.y - (body_height + 0.2) / 2.0;
    world.register(body0);

    // body2.angularVelocity = Util.random(-200, 200);
    body2.linearVelocity = new Vector2(0, 0);

    let arm_start_x = 0.7;
    let arm_start_y = body_start_y + 0.85;
    let arm_gap = 0.2;

    let arm_width = 0.65;
    let arm_height = 0.25;

    let upper_arm_r = new Box(arm_width, arm_height);
    upper_arm_r.density = density;
    upper_arm_r.position.x = arm_start_x;
    upper_arm_r.position.y = arm_start_y;
    world.register(upper_arm_r);

    let lower_arm_r = new Box(arm_width, arm_height);
    lower_arm_r.density = density;
    lower_arm_r.position.x = arm_start_x + arm_width + arm_gap;
    lower_arm_r.position.y = arm_start_y;
    world.register(lower_arm_r);

    let upper_arm_l = new Box(arm_width, arm_height);
    upper_arm_l.density = density;
    upper_arm_l.position.x = -arm_start_x;
    upper_arm_l.position.y = arm_start_y;
    world.register(upper_arm_l);

    let lower_arm_l = new Box(arm_width, arm_height);
    lower_arm_l.density = density;
    lower_arm_l.position.x = -(arm_start_x + arm_width + arm_gap);
    lower_arm_l.position.y = arm_start_y;
    world.register(lower_arm_l);

    let leg_start_x = 0.19;
    let leg_start_y = body_start_y - 0.8;

    let leg_width = 0.28;
    let leg_height = 0.75;
    let leg_gap = 0.3;

    let upper_leg_r = new Box(leg_width, leg_height);
    upper_leg_r.density = density;
    upper_leg_r.position.x = leg_start_x;
    upper_leg_r.position.y = leg_start_y;
    world.register(upper_leg_r);

    let lower_leg_r = new Box(leg_width, leg_height);
    lower_leg_r.density = density;
    lower_leg_r.position.x = leg_start_x;
    lower_leg_r.position.y = leg_start_y - leg_height - leg_gap;
    world.register(lower_leg_r);

    let upper_leg_l = new Box(leg_width, leg_height);
    upper_leg_l.density = density;
    upper_leg_l.position.x = -leg_start_x;
    upper_leg_l.position.y = leg_start_y;
    world.register(upper_leg_l);

    let lower_leg_l = new Box(leg_width, leg_height);
    lower_leg_l.density = density;
    lower_leg_l.position.x = -leg_start_x;
    lower_leg_l.position.y = leg_start_y - leg_height - leg_gap;
    world.register(lower_leg_l);

    let force = 10000;
    let torque_upper_arm = 1.25;
    let torque_lower_arm = 1.0;
    let torque_upper_leg = 1.75;
    let torque_lower_leg = 1.5;
    let frequency = 5;

    let j: Joint;
    // Body
    {
        j = new WeldJoint(body1, body2, undefined, 10, 1.0);
        world.register(j, true);

        j = new WeldJoint(body2, body3, undefined, 10, 1.0);
        world.register(j, true);

        j = new WeldJoint(body1, body0, undefined, 10, 1.0);
        world.register(j, true);
    }

    // Right arm
    {
        j = new MotorJoint(body3, upper_arm_r, new Vector2(arm_start_x - 0.2, arm_start_y), force, torque_upper_arm, frequency, 1);
        (j as MotorJoint).initialAngleOffset = -Math.PI / 2.0 + 0.3;
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j, false);

        let b1 = Util.createRegularPolygon(0.08, 5);
        b1.density = density;
        b1.position = Util.mid(upper_arm_r.position, lower_arm_r.position);
        world.register(b1);

        j = new WeldJoint(upper_arm_r, b1, b1.position, 10, 1, upper_arm_r.mass);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j, true);

        j = new MotorJoint(lower_arm_r, b1, b1.position, force, torque_lower_arm, frequency, 1, lower_arm_r.mass);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j, true);
    }

    // Left arm
    {
        j = new MotorJoint(body3, upper_arm_l, new Vector2(-(arm_start_x - 0.2), arm_start_y), force, torque_upper_arm, frequency, 1);
        (j as MotorJoint).initialAngleOffset = Math.PI / 2.0 - 0.3;
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j, false);

        let b2 = Util.createRegularPolygon(0.08, 5);
        b2.density = density;
        b2.position = Util.mid(upper_arm_l.position, lower_arm_l.position);
        world.register(b2);

        j = new WeldJoint(upper_arm_l, b2, b2.position, 10, 1, upper_arm_l.mass);
        j.drawConnectionLine = false;
        j.drawAnchor = false;
        world.register(j, true);

        j = new MotorJoint(lower_arm_l, b2, b2.position, force, torque_lower_arm, frequency, 1, lower_arm_l.mass);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j, true);
    }

    // Right leg
    {
        j = new MotorJoint(body0, upper_leg_r, body0.position.add(new Vector2(0.2, 0)), force, torque_upper_leg, frequency, 1);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j, true);

        let b3 = Util.createRegularPolygon(0.125, 5);
        b3.density = density;
        b3.position = Util.mid(upper_leg_r.position, lower_leg_r.position);
        world.register(b3);

        j = new WeldJoint(upper_leg_r, b3, b3.position, 10, 1, upper_leg_r.mass);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        j.drawAnchor = false;
        world.register(j, true);

        j = new MotorJoint(lower_leg_r, b3, b3.position, force, torque_lower_leg, frequency, 1, lower_leg_r.mass);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j, true);
    }

    // Left leg
    {
        j = new MotorJoint(body0, upper_leg_l, body0.position.add(new Vector2(-0.2, 0)), force, torque_upper_leg, frequency, 1);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j, true);

        let b4 = Util.createRegularPolygon(0.125, 5);
        b4.density = density;
        b4.position = Util.mid(upper_leg_l.position, lower_leg_l.position);
        world.register(b4);

        j = new WeldJoint(upper_leg_l, b4, b4.position, 10, 1, upper_leg_l.mass);
        j.drawConnectionLine = false;
        j.drawAnchor = false;
        world.register(j, true);

        j = new MotorJoint(lower_leg_l, b4, b4.position, force, torque_lower_leg, frequency, 1, lower_leg_l.mass);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j, true);
    }

    // Head
    {
        j = new WeldJoint(body3, head, Util.mid(body3.position, head.position), 5, 1.0);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j, false);
    }

    let c = new Circle(0.5);
    c.mass = 10;
    let angle = Util.random(0, Math.PI);
    c.position = new Vector2(Math.cos(angle), Math.sin(angle)).mul(5);
    c.linearVelocity = c.position.inverted().mul(Util.random(1.5, 3.5));
    c.position.y += 2.5;
    world.register(c);
}

Reflect.set(demo22, "SimulationName", "Contact callbacks: Breakable body");
function demo22(game: Game, world: World): void
{
    updateSetting("g", true);
    let ground = new Box(Settings.clipWidth * 5, 0.4, Type.Static);
    ground.restitution = 0.45;
    world.register(ground);

    let count = 5;
    let xGap = 2.3;
    let xStart = -xGap / 2 * Math.trunc(count - 1 / 2);
    let yStart = 1.0;

    for (let i = 0; i < count; i++)
    {
        let b1 = new Polygon([new Vector2(0, 0), new Vector2(0, 0.6), new Vector2(0.5, 1.0)], undefined, false);
        b1.translate(new Vector2(xStart + xGap * i, yStart + i * 1.2));
        world.register(b1);
        let b2 = new Polygon([new Vector2(0, 0), new Vector2(-0.5, 1.0), new Vector2(0, 0.6)], undefined, false);
        b2.translate(new Vector2(xStart + xGap * i, yStart + i * 1.2));
        world.register(b2);

        let j = new WeldJoint(b1, b2);
        world.register(j, true);

        b1.angularVelocity = Util.random(4.0, 8.0) * (Util.random(0, 1) > 0.5 ? -1 : 1);

        b1.onContact = (contactInfo: ContactInfo) =>
        {
            if (contactInfo.impulse > 12)
            {
                world.unregister(j.id, true);
                b2.onContact = undefined;
                return true;
            }
            else
            {
                return false;
            }
        };
        b2.onContact = (contactInfo: ContactInfo) =>
        {
            if (contactInfo.impulse > 12)
            {
                world.unregister(j.id, true);
                b1.onContact = undefined;
                return true;
            }
            else
            {
                return false;
            }
        };
    }
}

Reflect.set(demo23, "SimulationName", "Car driving");
function demo23(game: Game, world: World): void
{
    updateSetting("g", true);

    //Car
    {
        let body = new Polygon([new Vector2(-1.2, 0), new Vector2(-1.2, 0.5), new Vector2(-1.0, 1.0), new Vector2(0.2, 1.0), new Vector2(1.0, 0.5), new Vector2(1.0, 0.0)]);
        body.translate(new Vector2(-25, 5));
        body.mass = 100;

        body.translate(new Vector2(0, 3));
        world.register(body);

        let wheel1 = new Circle(0.3);
        wheel1.mass = 30.0;
        wheel1.friction = 1.0;
        wheel1.translate(new Vector2(-0.6, 2.5));
        wheel1.translate(new Vector2(-25, 5));
        world.register(wheel1);

        let j: Joint = new RevoluteJoint(body, wheel1, wheel1.position, 2, 0.5);
        j.drawConnectionLine = false;
        world.register(j, true);

        let wheel2 = new Circle(0.3);
        wheel2.mass = 30.0;
        wheel2.friction = 1.0;
        wheel2.translate(new Vector2(0.8, 2.5));
        wheel2.translate(new Vector2(-25, 5));
        world.register(wheel2);

        j = new RevoluteJoint(body, wheel2, wheel2.position, 2, 0.5);
        j.drawConnectionLine = false;
        world.register(j, true);

        let motor = new MotorJoint(body, wheel1, wheel1.position, 100, 100);
        motor.drawAnchor = false;
        world.register(motor);

        game.callback = () =>
        {
            game.camera.scale = new Vector2(2, 2);
            let uv = { u: 1 - game.deltaTime * 3, v: game.deltaTime * 3 };
            game.camera.position = Util.lerpVector(game.camera.position, body.position.add(new Vector2(0, 2.0)), uv);

            if (Input.isKeyDown("w") || Input.isKeyDown("d"))
            {
                body.awake();
                motor.maxTorque = 60.0;
                motor.angularOffset = wheel1.rotation - body.rotation - 0.3;
            }
            else if (Input.isKeyDown("s") || Input.isKeyDown("a"))
            {
                body.awake();
                motor.maxTorque = 60.0;
                motor.angularOffset = wheel1.rotation - body.rotation + 0.3;

            }
            else
            {
                motor.angularOffset = wheel1.rotation;
                motor.maxTorque = 0.0;
            }

            if (Input.isKeyDown(" "))
            {
                body.awake();
                motor.maxTorque = 100.0;
                motor.angularOffset = wheel1.rotation - body.rotation;
            }
        }
    }

    // Ground
    {
        let g_1 = new Polygon([new Vector2(-30, 5), new Vector2(-20, 5), new Vector2(-20, 5 - 0.4), new Vector2(-30, 5 - 0.4)], Type.Static, false);
        g_1.restitution = 0.45;
        g_1.friction = 1.0;
        world.register(g_1);

        let g0 = new Polygon([new Vector2(-20, 5), new Vector2(-Settings.clipWidth / 2.0, 0.2), new Vector2(-Settings.clipWidth / 2.0, -0.2), new Vector2(-20, 5 - 0.4)], Type.Static, false);
        g0.restitution = 0.45;
        g0.friction = 1.0;
        world.register(g0);

        let g1 = new Box(Settings.clipWidth, 0.4, Type.Static);
        g1.restitution = 0.45;
        g1.friction = 1.0;
        world.register(g1);

        let g2 = new Polygon([new Vector2(Settings.clipWidth / 2.0, 0.2), new Vector2(20, 1.0), new Vector2(20, 0.6), new Vector2(Settings.clipWidth / 2.0, -0.2)], Type.Static, false);
        g2.restitution = 0.45;
        g2.friction = 1.0;
        world.register(g2);

        let g3 = new Polygon([new Vector2(20.0, -1), new Vector2(50, -1), new Vector2(50, -1.4), new Vector2(20.0, -1.4)], Type.Static, false);
        g3.restitution = 0.45;
        g3.friction = 1.0;
        world.register(g3);

        let ss = new Box(12, 0.2);
        ss.mass = 10.0;
        ss.position = new Vector2(29, -0.4);
        world.register(ss);

        let j = new RevoluteJoint(g3, ss, ss.position);
        j.drawConnectionLine = false;
        world.register(j);

        let b = new Box(0.5);
        b.mass = 0.5;
        b.position = new Vector2(34, 0);
        world.register(b);

        let h = Util.createRegularPolygon(0.25, 6);
        h.mass = 0.3;
        h.position = new Vector2(34.8, 0);
        world.register(h);

        let xStart = 50.0;
        let yStart = -1;
        let sizeX = 1.0;
        let sizeY = 0.3;
        let gap = 0.1;

        b = new Box(sizeX, sizeY, Type.Dynamic, 7.0);
        b.position = new Vector2(xStart + sizeX / 2.0 + gap, yStart - sizeY / 2.0);
        world.register(b);

        j = new RevoluteJoint(g3, b, b.position.sub(new Vector2(sizeX / 2.0, 0)));
        j.drawConnectionLine = false;
        j.drawAnchor = false;
        world.register(j);

        let count = 15;

        for (let i = 1; i < count; i++)
        {
            let b2 = new Box(sizeX, sizeY, Type.Dynamic, 7.0);
            b2.position = new Vector2(xStart + (sizeX / 2.0 + gap) + (sizeX + gap) * i, yStart - sizeY / 2.0);
            world.register(b2);

            let j = new RevoluteJoint(b, b2, b2.position.sub(new Vector2((sizeX + gap) / 2.0, 0)), 32, 1.0);
            j.drawAnchor = false;
            world.register(j);
            b = b2;
        }

        let g4 = new Box(50, 0.4, Type.Static);
        g4.position = new Vector2(xStart + (gap + sizeX) * count + g4.width / 2 + gap, yStart - sizeY / 2.0);
        g4.friction = 1.0;
        g4.restitution = 0.45;
        world.register(g4);

        j = new RevoluteJoint(g4, b, b.position.add(new Vector2(b.width / 2.0, 0)));
        j.drawConnectionLine = false;
        j.drawAnchor = false;
        world.register(j);

        xStart = 80.0;
        yStart = 0.5;
        let size = 0.5;
        gap = 0.1;

        for (let i = 0; i < 15; i++)
        {
            let b = new Circle(size / 2.0);
            b.position = new Vector2(xStart, yStart + i * (size + gap));
            world.register(b);
        }

        xStart = 90.0;

        for (let i = 0; i < 15; i++)
        {
            let b = new Box(size);
            b.position = new Vector2(xStart, yStart + i * (size + gap));
            world.register(b);
        }

        xStart = 100.0;

        for (let i = 0; i < 15; i++)
        {
            let b = Util.createRegularPolygon(size / 2, 6);
            b.position = new Vector2(xStart, yStart + i * (size + gap));
            world.register(b);
        }

        let g5 = new Box(0.4, 3, Type.Static);
        g5.position = g4.position.add(new Vector2(g4.width / 2.0, g4.height / 2.0)).add(new Vector2(g5.width / 2.0, g5.height / 2.0 - 0.4));
        world.register(g5);
    }
}

export const demos: ((game: Game, world: World) => void)[] =
    [
        demo1, demo2, demo3, demo4, demo5, demo6, demo7, demo8, demo9, demo10,
        demo11, demo12, demo13, demo14, demo15, demo16, demo17, demo18, demo19,
        demo20, demo21, demo22, demo23
    ];