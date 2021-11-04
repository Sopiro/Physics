import { Contact, detectCollision } from "./pyhsics.js";
import { Vector2 } from "./math.js";
import * as Input from "./input.js";
import * as Util from "./util.js";
import { Renderer } from "./renderer.js";
import { Polygon } from "./polygon.js";
import { Camera } from "./camera.js";
import { createRandomConvexCollider, Pair } from "./util.js";
import { Collider } from "./collider.js";
export class Game
{
    private r: Renderer;
    private width: number;
    private height: number;
    private time: number;
    private cursorPos: Vector2;
    private p: Collider;

    private ground: Collider;

    private colliders: Collider[];
    private static_resolution = false;

    private camera: Camera;

    constructor(renderer: Renderer, width: number, height: number)
    {
        this.r = renderer;
        this.width = width;
        this.height = height;

        this.camera = new Camera();
        this.time = 0;

        this.cursorPos = new Vector2(0, 0);

        this.colliders = [];
        this.p = new Polygon([new Vector2(100, 100), new Vector2(100, 200), new Vector2(200, 200), new Vector2(200, 100)], true);
        this.p.setPosition(new Vector2(0, 400));
        this.p.angularVelocity = 2;
        // this.p.setRotation(1);
        this.colliders.push(this.p);

        this.ground = new Polygon([new Vector2(0, 0), new Vector2(0, 50), new Vector2(600, 50), new Vector2(600, 0)], true, "ground");

        // this.colliders.push(this.ground);
    }

    update(delta: number): void
    {
        // Game Logic Here
        this.time += delta;
        const speed = delta * 500;

        const mx = Input.curr_keys.ArrowLeft ? -1 : Input.curr_keys.ArrowRight ? 1 : 0;
        const my = Input.curr_keys.ArrowDown ? -1 : Input.curr_keys.ArrowUp ? 1 : 0;
        let mr = Input.curr_keys.e ? -1 : Input.curr_keys.q ? 1 : 0;

        // this.camera.translate(new Vector2(mx * speed, my * speed));
        // this.camera.setPosition(this.p.translation);
        // this.camera.translate(new Vector2(-this.width / 2.0, -this.height / 2.0));

        this.camera.setPosition(new Vector2(-this.width / 2.0, -100));

        this.cursorPos = new Vector2(Input.mouses.currX, this.height - Input.mouses.currY - 1);
        this.cursorPos = this.camera.getTransform().mulVector(this.cursorPos, 1);

        this.p.translate(new Vector2(mx * speed, my * speed));
        this.p.rotate(mr * delta * 2.5);

        if (Input.mouses.curr_down && !Input.mouses.last_down)
        {
            let nc = createRandomConvexCollider(Math.random() * 60 + 40);
            nc.setPosition(this.cursorPos);

            nc.linearVelocity = new Vector2(0, 200).subV(this.cursorPos).normalized().mulS(Util.random(50, 150));
            nc.angularVelocity = Util.random(-10, 10);
            nc.mass = 10;
            nc.inertia = Util.random(1, 100);

            this.colliders.push(nc);
        }

        if (Input.curr_keys.r && !Input.last_keys.r)
        {
            this.static_resolution = !this.static_resolution;
        }

        if (Input.curr_keys.n && !Input.last_keys.n)
        {
            this.p = createRandomConvexCollider(Math.random() * 60 + 40);
            this.camera.resetTransform();
            this.camera.translate(new Vector2(-this.width / 2.0, -this.height / 2.0));
        }

        // console.log(this.colliders[this.colliders.length - 1]);

        // Apply externel forces, yield tentative velocities
        this.colliders.forEach((collider, index) =>
        {
            // collider.addVelocity(new Vector2(0, -9.8 * delta * 50));
            collider.update(delta);

            if (collider.translation.y < -100)
            {
                this.colliders.splice(index, 1);
            }
        });

        let pairs: Pair<Pair<Collider, Collider>, Contact>[] = [];

        this.colliders.forEach(a =>
        {
            this.colliders.forEach(b =>
            {
                if (a === b)
                    return;

                let res = detectCollision(a, b);

                if (res.collide)
                    pairs.push({ p1: { p1: a, p2: b }, p2: res });
            });
        });

        for (let i = 0; i < 5; i++)
        {
            // Resolve violated velocity constraint
            pairs.forEach(pair =>
            {
                let a: Collider = pair.p1.p1;
                let b: Collider = pair.p1.p2;
                let contact: Contact = pair.p2;

                let ra = contact.contactPointAGlobal!.subV(a.localToGlobal().mulVector(a.centerOfMass, 1));
                let rb = contact.contactPointBGlobal!.subV(b.localToGlobal().mulVector(b.centerOfMass, 1));

                let j_va = contact.contactNormal!.inverted();
                let j_wa = -ra.cross(contact.contactNormal!);
                let j_vb = contact.contactNormal!;
                let j_wb = rb.cross(contact.contactNormal!);

                let beta = 0.5;
                let restitution = 0.7;

                let relativeVelocity = b.linearVelocity.addV(new Vector2(-b.angularVelocity * rb.y, b.angularVelocity * rb.x))
                    .subV(a.linearVelocity.addV(new Vector2(-a.angularVelocity * ra.y, a.angularVelocity * ra.x)));
                let approachingVelocity = relativeVelocity.dot(contact.contactNormal!);
                let slop = 0.0;
                let bias = -(beta / delta) * Math.max(contact.penetrationDepth! - slop, 0) + restitution * approachingVelocity;

                let k =
                    a.inverseMass +
                    j_wa * a.inverseInertia * j_wa +
                    b.inverseMass +
                    j_wb * b.inverseInertia * j_wb;

                let effectiveMass = 1 / k;

                let jv = j_va.dot(a.linearVelocity) + j_wa * a.angularVelocity + j_vb.dot(b.linearVelocity) + j_wb * b.angularVelocity;

                let lambda = effectiveMass * -(jv + bias);
                let previousLambda = contact.normalImpulseSum!;
                contact.normalImpulseSum = Math.max(0, contact.normalImpulseSum! + lambda);
                lambda = contact.normalImpulseSum - previousLambda;

                a.linearVelocity = a.linearVelocity.addV(j_va.mulS(a.inverseMass * lambda));
                a.angularVelocity = a.angularVelocity + a.inverseInertia * j_wa * lambda;
                b.linearVelocity = b.linearVelocity.addV(j_vb.mulS(b.inverseMass * lambda));
                b.angularVelocity = b.angularVelocity + b.inverseInertia * j_wb * lambda;
            });
        }
    }

    render(): void
    {
        this.r.setCameraTransform(this.camera.getCameraTransform());

        // Draw axis
        // this.r.drawLine(-10000, 0, 10000, 0);
        // this.r.drawLine(0, -10000, 0, 10000);

        // this.r.drawVectorP(new Vector2(), this.cursorPos);
        // this.r.log(this.cursorPos.x + ", " + this.cursorPos.y);

        this.colliders.forEach((collider) =>
        {
            let res = detectCollision(this.ground, collider);

            if (res.collide)
            {
                // this.r.log("collide!");
                this.r.resetCameraTransform();
                // this.r.drawText(630, 150, "collision vector");
                // this.r.drawVector(new Vector2(700, 500), res.contactNormal!.mulS(res.penetrationDepth!), 2);
                this.r.setCameraTransform(this.camera.getCameraTransform());
                // this.r.drawVector(res.contactPointAGlobal!, res.contactNormal!.mulS(-res.penetrationDepth!), 2);

                // Draw contact point
                // this.r.drawCircleV(res.contactPointAGlobal!);
                // this.r.drawCircleV(res.contactPointBGlobal!);

                if (this.static_resolution)
                {
                    this.p.translate(res.contactNormal!.mulS(-(res.penetrationDepth! + 0.01)));
                    this.camera.translate(res.contactNormal!.mulS(-(res.penetrationDepth! + 0.01)));
                }
            }
            this.r.drawCollider(collider);
        })

        // this.r.drawCollider(this.p);

        if (this.static_resolution)
            this.r.log("static collision resolution enabled", 25);
    }
}