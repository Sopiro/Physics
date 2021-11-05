import { Contact, detectCollision } from "./pyhsics.js";
import { Vector2 } from "./math.js";
import * as Input from "./input.js";
import * as Util from "./util.js";
import { Renderer } from "./renderer.js";
import { Polygon } from "./polygon.js";
import { Camera } from "./camera.js";
import { createRandomConvexCollider, Pair } from "./util.js";
import { Collider } from "./collider.js";
import { Circle } from "./circle.js";
export class Game
{
    private r: Renderer;
    private width: number;
    private height: number;
    private time: number;
    private cursorPos: Vector2;
    private p: Collider;

    private ground: Collider;
    private wallL: Collider;
    private wallR: Collider;

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
        this.p = new Circle(new Vector2(0, 0), 50);
        this.p.position = new Vector2(0, 400);
        this.p.angularVelocity = 10;
        // this.p.setRotation(1);
        this.colliders.push(this.p);

        this.ground = new Polygon([new Vector2(0, 0), new Vector2(0, 50), new Vector2(700, 50), new Vector2(700, 0)], true, "ground");
        this.ground.mass = Number.MAX_VALUE;
        this.ground.inertia = Number.MAX_VALUE;
        this.wallL = new Polygon([new Vector2(0, 0), new Vector2(0, 300), new Vector2(50, 300), new Vector2(50, 0)], true, "ground");
        this.wallL.position = new Vector2(-400, 100);
        this.wallL.mass = Number.MAX_VALUE;
        this.wallL.inertia = Number.MAX_VALUE;
        this.wallR = new Polygon([new Vector2(0, 0), new Vector2(0, 300), new Vector2(50, 300), new Vector2(50, 0)], true, "ground");
        this.wallR.position = new Vector2(400, 100);
        this.wallR.mass = Number.MAX_VALUE;
        this.wallR.inertia = Number.MAX_VALUE;

        this.colliders.push(this.ground);
        this.colliders.push(this.wallL);
        this.colliders.push(this.wallR);

        this.camera.position = new Vector2(-this.width / 2.0, -50);
    }

    update(delta: number): void
    {
        // Game Logic Here
        this.time += delta;
        const speed = delta * 500;

        const mx = Input.curr_keys.ArrowLeft ? -1 : Input.curr_keys.ArrowRight ? 1 : 0;
        const my = Input.curr_keys.ArrowDown ? -1 : Input.curr_keys.ArrowUp ? 1 : 0;
        let mr = Input.curr_keys.e ? -1 : Input.curr_keys.q ? 1 : 0;


        this.camera.translate(new Vector2(mx * speed, my * speed));
        // this.camera.position = this.p.position;
        // this.camera.translate(new Vector2(-this.width / 2.0, -this.height / 2.0));

        this.cursorPos = new Vector2(Input.mouses.currX, this.height - Input.mouses.currY - 1);
        this.cursorPos = this.camera.getTransform().mulVector(this.cursorPos, 1);

        // this.p.translate(new Vector2(mx * speed, my * speed));
        // this.p.rotate(mr * delta * 2.5);

        if (Input.mouses.curr_down && !Input.mouses.last_down)
        {
            let nc = createRandomConvexCollider(Math.random() * 60 + 40);
            // let nc = Util.createBox(this.cursorPos, new Vector2(100, 100));
            nc.position = this.cursorPos;

            nc.linearVelocity = new Vector2(0, 300).subV(this.cursorPos).normalized().mulS(Util.random(50, 150));
            // nc.angularVelocity = Util.random(-5, 5);

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

        // Apply externel forces, yield tentative velocities
        this.colliders.forEach((collider, index) =>
        {
            if (collider.name != "ground")
                collider.addVelocity(new Vector2(0, -9.8 * delta * 100));
        });

        let pairs: Pair<Pair<Collider, Collider>, Contact>[] = [];

        for (let i = 0; i < this.colliders.length; i++)
        {
            let a = this.colliders[i];

            for (let j = i + 1; j < this.colliders.length; j++)
            {
                let b = this.colliders[j];

                let res = detectCollision(a, b);

                if (res.collide)
                    pairs.push({ p1: { p1: a, p2: b }, p2: res });
            }
        }

        // Resolve violated velocity constraint
        for (let i = 0; i < 1; i++)
        {
            pairs.forEach(pair =>
            {
                let a: Collider = pair.p1.p1;
                let b: Collider = pair.p1.p2;
                let contact: Contact = pair.p2;

                let ra = contact.contactPointAGlobal!.subV(a.localToGlobal().mulVector(a.centerOfMass, 1));
                let rb = contact.contactPointBGlobal!.subV(b.localToGlobal().mulVector(b.centerOfMass, 1));

                // Jacobian for non-penetration constraint
                let j_va = contact.contactNormal!.inverted();
                let j_wa = -ra.cross(contact.contactNormal!);
                let j_vb = contact.contactNormal!;
                let j_wb = rb.cross(contact.contactNormal!);

                let beta = 0.5;
                let restitution = 0.7;

                // Relative velocity at contact point
                let relativeVelocity = b.linearVelocity.addV(new Vector2(-b.angularVelocity * rb.y, b.angularVelocity * rb.x))
                    .subV(a.linearVelocity.addV(new Vector2(-a.angularVelocity * ra.y, a.angularVelocity * ra.x)));
                let approachingVelocity = relativeVelocity.dot(contact.contactNormal!);
                let penetration_slop = 0.5;
                let restitution_slop = 0.2;

                let bias = -(beta / delta) * Math.max(contact.penetrationDepth! - penetration_slop, 0) +
                    restitution * Math.max(approachingVelocity - restitution_slop, 0);

                let k =
                    + a.inverseMass
                    + j_wa * a.inverseInertia * j_wa
                    + b.inverseMass
                    + j_wb * b.inverseInertia * j_wb;

                let effectiveMass = 1.0 / k;

                // Jacobian * velocity vector
                let jv =
                    + j_va.dot(a.linearVelocity)
                    + j_wa * a.angularVelocity
                    + j_vb.dot(b.linearVelocity)
                    + j_wb * b.angularVelocity;

                let lambda = effectiveMass * -(jv + bias);
                let previousTotalLambda = contact.normalImpulseSum!;
                contact.normalImpulseSum = Math.max(0.0, contact.normalImpulseSum! + lambda);
                lambda = contact.normalImpulseSum - previousTotalLambda;

                a.linearVelocity = a.linearVelocity.addV(j_va.mulS(a.inverseMass * lambda));
                a.angularVelocity = a.angularVelocity + a.inverseInertia * j_wa * lambda;
                b.linearVelocity = b.linearVelocity.addV(j_vb.mulS(b.inverseMass * lambda));
                b.angularVelocity = b.angularVelocity + b.inverseInertia * j_wb * lambda;

                j_va = contact.contactTangent!.inverted();
                j_wa = -ra.cross(contact.contactTangent!);
                j_vb = contact.contactTangent!;
                j_wb = rb.cross(contact.contactTangent!);

                jv =
                    + j_va.dot(a.linearVelocity)
                    + j_wa * a.angularVelocity
                    + j_vb.dot(b.linearVelocity)
                    + j_wb * b.angularVelocity;

                lambda = effectiveMass * -jv;
                previousTotalLambda = contact.tangentImpulseSum!;
                let friction = 0.4;
                let maxFriction = friction * contact.normalImpulseSum!;
                contact.tangentImpulseSum = Util.clamp(contact.tangentImpulseSum! + lambda, -maxFriction, maxFriction);
                lambda = contact.tangentImpulseSum - previousTotalLambda;

                a.linearVelocity = a.linearVelocity.addV(j_va.mulS(a.inverseMass * lambda));
                a.angularVelocity = a.angularVelocity + a.inverseInertia * j_wa * lambda;
                b.linearVelocity = b.linearVelocity.addV(j_vb.mulS(b.inverseMass * lambda));
                b.angularVelocity = b.angularVelocity + b.inverseInertia * j_wb * lambda;
            });
        }

        // Update the positions using the new velocities
        this.colliders.forEach((collider, index) =>
        {
            collider.update(delta);

            if (collider.position.y < -500)
                this.colliders.splice(index, 1);
        });
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