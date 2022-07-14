import { Box } from "./box.js";
import { Circle } from "./circle.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import { RigidBody } from "./rigidbody.js";

export class AABB
{
    public min: Vector2;
    public max: Vector2;

    constructor(min: Vector2 = new Vector2(), max: Vector2 = new Vector2())
    {
        this.min = min;
        this.max = max;
    }

    get area(): number
    {
        return (this.max.x - this.min.x) * (this.max.y - this.min.y);
    }
}

export function fix(aabb: AABB): void
{
    let minX = Math.min(aabb.min.x, aabb.max.x);
    let maxX = Math.max(aabb.min.x, aabb.max.x);
    let minY = Math.min(aabb.min.y, aabb.max.y);
    let maxY = Math.max(aabb.min.y, aabb.max.y);

    aabb.min.x = minX;
    aabb.min.y = minY;
    aabb.max.x = maxX;
    aabb.max.y = maxY;
}

export function toRigidBody(aabb: AABB): RigidBody
{
    let width = aabb.max.x - aabb.min.x;
    let height = aabb.max.y - aabb.min.y;

    let box = new Box(width, height);
    box.position.x += aabb.min.x + width / 2.0;
    box.position.y += aabb.min.y + height / 2.0;

    return box;
}

export function createAABB(body: RigidBody, margin: number = 0.0): AABB
{
    if (body instanceof Circle)
    {
        return new AABB(
            new Vector2(body.position.x - body.radius - margin, body.position.y - body.radius - margin),
            new Vector2(body.position.x + body.radius + margin, body.position.y + body.radius + margin)
        );
    }
    else if (body instanceof Polygon) 
    {
        let localToGlobal = body.localToGlobal;

        let res = new AABB(localToGlobal.mulVector2(body.vertices[0], 1), localToGlobal.mulVector2(body.vertices[0], 1));
        fix(res);

        for (let i = 1; i < body.count; i++)
        {
            let gv = localToGlobal.mulVector2(body.vertices[i], 1);
            if (gv.x < res.min.x)
                res.min.x = gv.x;
            else if (gv.x > res.max.x)
                res.max.x = gv.x;
            if (gv.y < res.min.y)
                res.min.y = gv.y;
            else if (gv.y > res.max.y)
                res.max.y = gv.y;
        }

        res.min.x -= margin;
        res.min.y -= margin;
        res.max.x += margin;
        res.max.y += margin;

        return res;
    }
    else
    {
        throw "Not a supported shape";
    }
}

export function union(b1: AABB, b2: AABB): AABB
{
    let minX = Math.min(b1.min.x, b2.min.x);
    let minY = Math.min(b1.min.y, b2.min.y);
    let maxX = Math.max(b1.max.x, b2.max.x);
    let maxY = Math.max(b1.max.y, b2.max.y);

    let res = new AABB(new Vector2(minX, minY), new Vector2(maxX, maxY));

    return res;
}

export function testPointInside(aabb: AABB, point: Vector2): boolean
{
    if (aabb.min.x > point.x || aabb.max.x < point.x) return false;
    if (aabb.min.y > point.y || aabb.max.y < point.y) return false;

    return true;
}

export function detectCollisionAABB(a: AABB, b: AABB): boolean
{
    if (a.min.x > b.max.x || a.max.x < b.min.x) return false;
    if (a.min.y > b.max.y || a.max.y < b.min.y) return false;

    return true;
}

export function containsAABB(container: AABB, target: AABB): boolean
{
    return container.min.x <= target.min.x
        && container.min.y <= target.min.y
        && container.max.x >= target.max.x
        && container.max.y >= target.max.y
}