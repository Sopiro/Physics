import { Box } from "./box.js";
import { Type } from "./rigidbody.js";
import { Vector2 } from "./math.js";
import { Settings, updateSetting } from "./settings.js";
import * as Util from "./util.js";
import { Circle } from "./circle.js";
import { RevoluteJoint } from "./revolute.js";
import { DistanceJoint } from "./distance.js";
import { Polygon } from "./polygon.js";
import { AngleJoint } from "./angle.js";
import { WeldJoint } from "./weld.js";
import { LineJoint } from "./line.js";
import { MaxDistanceJoint } from "./maxdistance.js";
import { PrismaticJoint } from "./prismatic.js";
const ground = new Box(Settings.width * 5, 40, Type.Static);
ground.restitution = 0.45;
Reflect.set(demo1, "SimulationName", "Single box");
function demo1(game, world) {
    updateSetting("g", true);
    world.register(ground);
    let b = new Box(40);
    b.position = new Vector2(0, 500);
    b.restitution = 0.7;
    b.angularVelocity = Util.random(-8, 8);
    world.register(b);
}
Reflect.set(demo2, "SimulationName", "Box stacking");
function demo2(game, world) {
    updateSetting("g", true);
    world.register(ground);
    let start = 50;
    let size = 30;
    let gap = 5;
    for (let i = 0; i < 12; i++) {
        let b = new Box(size);
        b.position = new Vector2(Util.random(-1.5, 1.5), start + i * (size + gap));
        world.register(b);
    }
}
Reflect.set(demo3, "SimulationName", "Pyramid");
function demo3(game, world) {
    updateSetting("g", true);
    world.register(ground);
    const rows = 12;
    const boxSize = 30;
    const xGap = 5;
    const yGap = 30;
    const xStart = -rows * boxSize / 2.0;
    const yStart = 60;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < rows - y; x++) {
            let b = new Box(boxSize);
            b.position = new Vector2(xStart + y * (boxSize + xGap) / 2 + x * (boxSize + xGap), yStart + y * (boxSize + yGap));
            world.register(b);
        }
    }
}
Reflect.set(demo4, "SimulationName", "Seesaw");
function demo4(game, world) {
    updateSetting("g", true);
    world.register(ground);
    let seesaw = new Box(600, 10);
    seesaw.position = new Vector2(0, 45);
    seesaw.mass = 10;
    seesaw.inertia = Util.calculateBoxInertia(600, 10, 10);
    world.register(seesaw);
    let j = new RevoluteJoint(ground, seesaw, seesaw.position, 45, 1.0);
    world.register(j);
    let b = new Circle(20);
    b.position = new Vector2(-250, 100);
    world.register(b);
    b = new Box(20);
    b.position = new Vector2(-280, 100);
    b.mass = 1;
    b.inertia = Util.calculateBoxInertia(20, 20, 1);
    world.register(b);
    b = new Box(50);
    b.position = new Vector2(260, 500);
    b.mass = 30;
    b.inertia = Util.calculateBoxInertia(30, 30, 30);
    world.register(b);
}
Reflect.set(demo5, "SimulationName", "Billiard");
function demo5(game, world) {
    updateSetting("g", false);
    let lstart = -400;
    let rstart = 250;
    let c = new Circle(20);
    c.position = new Vector2(lstart, Settings.height / 2.0);
    c.linearVelocity.x = 300;
    c.restitution = 1;
    world.register(c);
    c = new Circle(20);
    c.position = new Vector2(rstart, Settings.height / 2.0);
    c.angularVelocity = 5;
    c.restitution = 1;
    world.register(c);
    c = new Circle(20);
    c.position = new Vector2(rstart + 60, Settings.height / 2.0 + 30);
    c.restitution = 1;
    world.register(c);
    c = new Circle(20);
    c.position = new Vector2(rstart + 50, Settings.height / 2.0 - 50);
    c.restitution = 1;
    world.register(c);
    c = new Circle(20);
    c.position = new Vector2(rstart + 160, Settings.height / 2.0 + 90);
    c.restitution = 1;
    world.register(c);
    c = new Circle(20);
    c.position = new Vector2(rstart + 130, Settings.height / 2.0 + 10);
    c.restitution = 1;
    world.register(c);
    c = new Circle(20);
    c.position = new Vector2(rstart + 150, Settings.height / 2.0 - 80);
    c.restitution = 1;
    world.register(c);
}
Reflect.set(demo6, "SimulationName", "Throwing spinning stick");
function demo6(game, world) {
    updateSetting("g", false);
    world.register(ground);
    const center = new Vector2(300, Settings.height / 2.0);
    for (let i = 0; i < 70; i++) {
        let r = Util.random(30, 280);
        let a = Util.random(0, Math.PI * 2);
        let p = new Vector2(Math.cos(a), Math.sin(a)).mul(r);
        let c = Util.createRandomConvexBody(9);
        c.position = center.add(p);
        c.mass = 1;
        c.inertia = Util.calculateCircleInertia(9, 1);
        world.register(c);
    }
    let b = new Box(10, 200);
    b.position = new Vector2(-500, Settings.height / 2.0);
    b.mass = 30;
    b.inertia = Util.calculateBoxInertia(10, 200, 30);
    b.linearVelocity.x = 300;
    b.angularVelocity = 10;
    world.register(b);
}
Reflect.set(demo7, "SimulationName", "Friction test");
function demo7(game, world) {
    updateSetting("g", true);
    world.register(ground);
    let b = new Box(600, 10, Type.Static);
    b.position = new Vector2(-60, 500);
    b.rotation = -0.15;
    b.friction = 1.0;
    world.register(b);
    b = new Box(600, 10, Type.Static);
    b.position = new Vector2(0, 300);
    b.rotation = 0.15;
    b.friction = 1.0;
    world.register(b);
    b = new Box(600, 10, Type.Static);
    b.position = new Vector2(-60, 100);
    b.rotation = -0.15;
    b.friction = 1.0;
    world.register(b);
    b = new Box(10, 110, Type.Static);
    b.position = new Vector2(310, 430);
    world.register(b);
    b = new Box(10, 110, Type.Static);
    b.position = new Vector2(-370, 230);
    world.register(b);
    let xStart = -450;
    let yStart = 700;
    let gap = 30;
    let size = 30;
    let frictions = [0.5, 0.3, 0.2, 0.12, 0.0];
    for (let i = 0; i < frictions.length; i++) {
        b = new Box(size, size);
        b.position = new Vector2(xStart + (size + gap) * i, yStart);
        b.friction = frictions[i];
        b.linearVelocity.x = 120;
        world.register(b);
    }
}
Reflect.set(demo8, "SimulationName", "Restitution test");
function demo8(game, world) {
    updateSetting("g", true);
    let g = new Box(Settings.width * 2, 20, Type.Static);
    g.restitution = 0.7;
    world.register(g);
    let count = 7;
    let gap = 100;
    let xStart = -(count - 1) / 2 * gap;
    let yStart = 620;
    let size = 30;
    for (let i = 0; i < count; i++) {
        let b = new Box(size);
        b.position = new Vector2(xStart + gap * i, yStart);
        let attenuation = (count - i) / count;
        b.restitution = 1.0 - attenuation * attenuation;
        world.register(b);
    }
}
Reflect.set(demo9, "SimulationName", "Single pendulum");
function demo9(game, world) {
    updateSetting("g", true);
    world.register(ground);
    let b = new Box(30);
    b.position = new Vector2(-300, 500);
    world.register(b);
    let j = new RevoluteJoint(ground, b, new Vector2(0, 500));
    world.register(j);
}
Reflect.set(demo10, "SimulationName", "Multi pendulum");
function demo10(game, world) {
    updateSetting("g", true);
    world.register(ground);
    let xStart = 0;
    let yStart = 500;
    let sizeW = 30;
    let sizeH = 15;
    let gap = 10;
    let b1 = new Box(sizeW, sizeH);
    b1.position = new Vector2(xStart - (gap + sizeW), yStart);
    world.register(b1);
    let j = new RevoluteJoint(ground, b1, new Vector2(xStart, yStart));
    world.register(j);
    for (let i = 1; i < 12; i++) {
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
function demo11(game, world) {
    updateSetting("g", true);
    world.register(ground);
    let revoluteBridge = true;
    let groundStart = 20;
    let xStart = -500;
    let yStart = 400;
    let gap = 10;
    let pillarWidth = 30;
    let sizeX = 50;
    let sizeY = sizeX * 0.25;
    let pillar = new Box(pillarWidth, yStart, Type.Static);
    pillar.position = new Vector2(xStart, yStart / 2 + 20);
    world.register(pillar);
    let b1 = new Box(sizeX, sizeY);
    b1.mass = 10;
    b1.position = new Vector2(xStart + sizeX / 2 + pillarWidth / 2 + gap, yStart + groundStart);
    world.register(b1);
    let j;
    if (revoluteBridge) {
        j = new RevoluteJoint(pillar, b1, pillar.position.add(new Vector2(pillarWidth, yStart).div(2)), 7, 1.0);
        j.drawAnchor = false;
        j.drawConnectionLine = false;
        world.register(j);
    }
    else {
        j = new DistanceJoint(pillar, b1, pillar.position.add(new Vector2(pillarWidth / 2, yStart / 2)), b1.position.add(new Vector2(-sizeX / 2, 3)), -1, 3, 1.0);
        j.drawAnchor = false;
        world.register(j);
        j = new DistanceJoint(pillar, b1, pillar.position.add(new Vector2(pillarWidth / 2, yStart / 2)), b1.position.add(new Vector2(-sizeX / 2, -3)), -1, 3, 1.0);
        j.drawAnchor = false;
        world.register(j);
    }
    for (let i = 1; i + 1 < xStart * -2 / (sizeX + gap); i++) {
        let b2 = new Box(sizeX, sizeY);
        b2.mass = 10;
        b2.position = new Vector2(xStart + sizeX / 2 + pillarWidth / 2 + gap + (gap + sizeX) * i, yStart + groundStart);
        world.register(b2);
        if (revoluteBridge) {
            j = new RevoluteJoint(b1, b2, b1.position.add(b2.position).div(2), 7, 1.0);
            j.drawAnchor = false;
            world.register(j);
        }
        else {
            j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(sizeX / 2, 3)), b2.position.add(new Vector2(-sizeX / 2, 3)), -1, 3, 1.0);
            j.drawAnchor = false;
            world.register(j);
            j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(sizeX / 2, -3)), b2.position.add(new Vector2(-sizeX / 2, -3)), -1, 3, 1.0);
            j.drawAnchor = false;
            world.register(j);
        }
        b1 = b2;
    }
    pillar = new Box(pillarWidth, yStart, Type.Static);
    pillar.position = new Vector2(-xStart, yStart / 2 + 20);
    world.register(pillar);
    if (revoluteBridge) {
        j = new RevoluteJoint(pillar, b1, pillar.position.add(new Vector2(-pillarWidth, yStart).div(2)), 7, 1.0);
        j.drawConnectionLine = false;
        j.drawAnchor = false;
        world.register(j);
    }
    else {
        j = new DistanceJoint(pillar, b1, pillar.position.add(new Vector2(-pillarWidth / 2, yStart / 2)), b1.position.add(new Vector2(sizeX / 2, 3)), -1, 3, 1.0);
        j.drawAnchor = false;
        world.register(j);
        j = new DistanceJoint(pillar, b1, pillar.position.add(new Vector2(-pillarWidth / 2, yStart / 2)), b1.position.add(new Vector2(sizeX / 2, -3)), -1, 3, 1.0);
        j.drawAnchor = false;
        world.register(j);
    }
}
Reflect.set(demo12, "SimulationName", "Circle stacking");
function demo12(game, world) {
    updateSetting("g", true);
    world.register(ground);
    let yStart = 100;
    let xStart = -401;
    let size = 30;
    let gap = 30;
    let rows = 10;
    for (let i = 0; i < rows; i++) {
        for (let j = i; j < rows; j++) {
            let c = new Circle(size);
            c.mass = (1 + i) + (1 + i) * j;
            c.position.x = xStart + (gap + size * 2) * i;
            c.position.y = yStart + (gap + size * 2) * j;
            world.register(c);
        }
    }
}
Reflect.set(demo13, "SimulationName", "Spring test");
function demo13(game, world) {
    updateSetting("g", false);
    let b1 = new Box(30, 600, Type.Static);
    b1.position.y = Settings.height / 2;
    world.register(b1);
    let b2 = new Box(30);
    b2.position.x = 300;
    b2.position.y = Settings.height / 2 + 200;
    world.register(b2);
    let j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(0, 200)), b2.position, 200, 1, 0.05);
    world.register(j);
    b2 = new Box(30);
    b2.position.x = 300;
    b2.position.y = Settings.height / 2;
    world.register(b2);
    j = new DistanceJoint(b1, b2, b1.position, b2.position, 200, 1, 0.2);
    world.register(j);
    b2 = new Box(30);
    b2.position.x = 300;
    b2.position.y = Settings.height / 2 - 200;
    world.register(b2);
    j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(0, -200)), b2.position, 200, 1, 0.7);
    world.register(j);
    b2 = new Box(30);
    b2.position.x = -300;
    b2.position.y = Settings.height / 2 + 200;
    world.register(b2);
    j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(0, 200)), b2.position, 200, 0.5, 0.2);
    world.register(j);
    b2 = new Box(30);
    b2.position.x = -300;
    b2.position.y = Settings.height / 2;
    world.register(b2);
    let halfLife = 1;
    let frequency = -Math.log(0.5) / (halfLife * Math.PI * 2);
    j = new DistanceJoint(b1, b2, b1.position, b2.position, 200, frequency, 1);
    world.register(j);
    b2 = new Box(30);
    b2.position.x = -300;
    b2.position.y = Settings.height / 2 - 200;
    world.register(b2);
    j = new DistanceJoint(b1, b2, b1.position.add(new Vector2(0, -200)), b2.position, 200, 2, 0.01);
    world.register(j);
}
Reflect.set(demo14, "SimulationName", "Angle joint test");
function demo14(game, world) {
    updateSetting("g", true);
    world.register(ground);
    let b1 = Util.createRegularPolygon(25, 7);
    b1.rotation = Math.PI;
    b1.position = new Vector2(-100, 400);
    world.register(b1);
    let c = new Circle(25);
    c.position = new Vector2(100, 400);
    world.register(c);
    c.addAngularVelocity(10);
    let j = new AngleJoint(b1, c);
    world.register(j);
    j = new DistanceJoint(b1, c);
    world.register(j);
    let b2 = new Box(15, 15, Type.Static);
    b2.position = new Vector2(400, 600);
    world.register(b2);
    c = Util.createRegularPolygon(50, 5);
    c.position = new Vector2(400, 400);
    world.register(c);
    j = new LineJoint(b2, c);
    world.register(j);
    j = new MaxDistanceJoint(b2, c);
    j.drawAnchor = false;
    j.drawConnectionLine = false;
    world.register(j);
    j = new AngleJoint(b1, c);
    world.register(j);
    let b = new Polygon([new Vector2(0, 0), new Vector2(0, 50), new Vector2(400, 0)]);
    b.position = new Vector2(-400, 40);
    world.register(b);
}
Reflect.set(demo15, "SimulationName", "Weld joint test");
function demo15(game, world) {
    updateSetting("g", true);
    world.register(ground);
    for (let i = 0; i < 30; i++) {
        let start = new Vector2(Util.random(-800, 800), Util.random(50, 1500));
        let rr = Util.random(-0.05, 0.05);
        let cos = Math.cos(rr);
        let sin = Math.sin(rr);
        let b1 = Util.createRegularPolygon(15);
        b1.position = start.add(new Vector2(cos, sin).mul(-40));
        world.register(b1);
        let b2 = new Box(80, 3);
        b2.position = start;
        b2.rotation = rr;
        world.register(b2);
        let b3 = Util.createRegularPolygon(15);
        b3.position = start.add(new Vector2(cos, sin).mul(40));
        world.register(b3);
        let j = new WeldJoint(b1, b2);
        world.register(j, true);
        j = new WeldJoint(b2, b3);
        world.register(j, true);
        b2.addVelocity(new Vector2(-b2.position.x, 0));
    }
}
Reflect.set(demo16, "SimulationName", "Line joint test");
function demo16(game, world) {
    updateSetting("g", true);
    world.register(ground);
    let b1 = new Box(30);
    b1.position.y = 500;
    b1.angularVelocity = 100;
    world.register(b1);
    let j = new LineJoint(ground, b1);
    world.register(j);
    let b2 = new Box(100, 20, Type.Static);
    b2.position.x = -300;
    b2.position.y = 300;
    world.register(b2);
    let c = Util.createRegularPolygon(25, 3);
    c.position.x = -100;
    c.position.y = 300;
    world.register(c);
    j = new MaxDistanceJoint(b2, c, 500, undefined, undefined, 1, 0.1);
    j.drawConnectionLine = false;
    world.register(j);
    j = new LineJoint(b2, c);
    world.register(j);
    j = new AngleJoint(b1, c);
    world.register(j);
    c = new Circle(15);
    c.position = b2.position.add(new Vector2(-100, 100));
    world.register(c);
    j = new LineJoint(b2, c);
    world.register(j);
    c = Util.createRegularPolygon(20);
    c.position = b2.position.add(new Vector2(100, 100));
    world.register(c);
    j = new LineJoint(b2, c);
    world.register(j);
    let b3 = new Box(30);
    b3.position = b2.position.add(new Vector2(0, -100));
    world.register(b3);
    j = new LineJoint(b2, b3, b2.position.add(new Vector2(15, 0)), b3.position.add(new Vector2(15, 0)));
    world.register(j);
    j = new AngleJoint(b2, b3, 240);
    world.register(j);
}
Reflect.set(demo17, "SimulationName", "Max distance joint test");
function demo17(game, world) {
    updateSetting("g", true);
    world.register(ground);
    let c = new Box(30, 30, Type.Static);
    c.position.y = 500;
    world.register(c);
    let b = Util.createRegularPolygon(25);
    b.position.y = 150;
    b.position.x = Util.random(-100, 100);
    world.register(b);
    let j = new MaxDistanceJoint(c, b, 200, undefined, undefined, 0.7, 0.1);
    world.register(j, true);
    // j = new MaxDistanceJoint(ground, b, 300, undefined, undefined, 1, 0.1);
    // world.register(j)
    c = new Box(30, 30);
    c.position.x = -200;
    c.position.y = 600;
    world.register(c);
    b = Util.createRegularPolygon(15);
    b.position.x = 200;
    b.position.y = 600;
    world.register(b);
    j = new MaxDistanceJoint(c, b, 120, undefined, undefined, 0.7, 0.1);
    world.register(j);
}
Reflect.set(demo18, "SimulationName", "Prismatic joint test");
function demo18(game, world) {
    updateSetting("g", true);
    world.register(ground);
    let b0 = new Box(30);
    b0.position.y = 100;
    world.register(b0);
    let j = new PrismaticJoint(ground, b0);
    world.register(j);
    let b1 = new Box(200, 30, Type.Static);
    b1.position = new Vector2(-400, 600);
    world.register(b1);
    let b2 = new Box(80, 20);
    b2.restitution = 0.7;
    b2.position = new Vector2(-400, 100);
    world.register(b2);
    j = new PrismaticJoint(b1, b2, undefined, undefined);
    world.register(j);
    j = new MaxDistanceJoint(b1, b2, 390, undefined, undefined, 1, 0.1);
    j.drawAnchor = false;
    j.drawConnectionLine = false;
    world.register(j);
    let b = new Box(40);
    b.restitution = 0.7;
    b.position = new Vector2(-400, 250);
    world.register(b);
    let b3 = new Box(120, 20);
    b3.position = new Vector2(300, 600);
    world.register(b3);
    j = new PrismaticJoint(b1, b3, undefined, undefined, new Vector2(1, 0));
    world.register(j);
    j = new MaxDistanceJoint(b1, b3, 630, undefined, undefined, 1, 0.2);
    j.drawConnectionLine = false;
    world.register(j);
    b = Util.createRegularPolygon(15);
    b.position = new Vector2(250, 500);
    world.register(b);
    j = new DistanceJoint(b3, b);
    world.register(j);
    b = Util.createRegularPolygon(15);
    b.position = new Vector2(250, 350);
    world.register(b);
    j = new DistanceJoint(b, j.bodyB);
    world.register(j);
    b = new Box(120, 20);
    b.position = new Vector2(350, 250);
    world.register(b);
    j = new DistanceJoint(b, j.bodyA);
    world.register(j);
    b = new Box(20, 80, Type.Static);
    b.position = new Vector2(600, 250);
    world.register(b);
    let j1 = new PrismaticJoint(b, j.bodyA, new Vector2(600, 250), undefined, new Vector2(-1, 0));
    world.register(j);
    b = new Box(80, 15);
    b.position = new Vector2(450, 500);
    world.register(b);
    j = new LineJoint(j1.bodyA, b);
    world.register(j);
    j = new AngleJoint(ground, j1.bodyB);
    world.register(j);
}
export const demos = [demo1, demo2, demo3, demo4, demo5, demo6, demo7, demo8, demo9, demo10, demo11, demo12, demo13, demo14, demo15, demo16, demo17, demo18];
