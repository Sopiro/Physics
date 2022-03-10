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

function fix(aabb: AABB): void
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

export function createAABB(b: RigidBody): AABB
{
    if (b instanceof Circle)
    {
        return new AABB(
            new Vector2(b.position.x - b.radius, b.position.y - b.radius),
            new Vector2(b.position.x + b.radius, b.position.y + b.radius)
        );
    }
    else if (b instanceof Polygon) 
    {
        let localToGlobal = b.localToGlobal;

        let res = new AABB(localToGlobal.mulVector2(b.vertices[0], 1), localToGlobal.mulVector2(b.vertices[0], 1));

        for (let i = 1; i < b.count; i++)
        {
            let gv = localToGlobal.mulVector2(b.vertices[i], 1);
            if (gv.x < res.min.x)
                res.min.x = gv.x;
            else if (gv.x > res.max.x)
                res.max.x = gv.x;
            if (gv.y < res.min.y)
                res.min.y = gv.y;
            else if (gv.y > res.max.y)
                res.max.y = gv.y;
        }
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