import { Circle } from "./circle.js";
import { RigidBody } from "./rigidbody.js";
import { ContactManifold } from "./contact.js";
import { Edge } from "./edge.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import { ClosestEdgeInfo, Polytope } from "./polytope.js";
import { Simplex } from "./simplex.js";
import * as Util from "./util.js";
import { Settings } from "./settings.js";

export interface AABB
{
    min: Vector2;
    max: Vector2;
}

export function createAABB(b: RigidBody): AABB
{
    if (b instanceof Circle)
    {
        let cmInGlobal = b.localToGlobal.mulVector2(b.centerOfMass, 1);
        return {
            min: new Vector2(cmInGlobal.x - b.radius, cmInGlobal.y - b.radius),
            max: new Vector2(cmInGlobal.x + b.radius, cmInGlobal.y + b.radius)
        };
    }
    else if (b instanceof Polygon) 
    {
        const lTg = b.localToGlobal;

        let res = { min: lTg.mulVector2(b.vertices[0], 1), max: lTg.mulVector2(b.vertices[0], 1) };

        for (let i = 1; i < b.count; i++)
        {
            let gv = lTg.mulVector2(b.vertices[i], 1);
            if (gv.x < res.min.x) res.min.x = gv.x;
            else if (gv.x > res.max.x) res.max.x = gv.x;
            if (gv.y < res.min.y) res.min.y = gv.y;
            else if (gv.y > res.max.y) res.max.y = gv.y;
        }
        return res;
    }
    else
    {
        throw "Not supported shape";
    }
}

export function testCollideAABB(a: AABB, b: AABB): boolean
{
    if (a.min.x > b.max.x || a.max.x < b.min.x) return false;
    if (a.min.y > b.max.y || a.max.y < b.min.y) return false;

    return true;
}

interface SupportResult
{
    vertex: Vector2;
    index: number;
}

// Returns the fardest vertex in the 'dir' direction
function support(b: RigidBody, dir: Vector2): SupportResult
{
    if (b instanceof Polygon)
    {
        let idx = 0;
        let maxValue = dir.dot(b.vertices[idx]);

        for (let i = 1; i < b.vertices.length; i++)
        {
            let value = dir.dot(b.vertices[i]);
            if (value > maxValue)
            {
                idx = i;
                maxValue = value;
            }
        }

        return { vertex: b.vertices[idx], index: idx };
    }
    else if (b instanceof Circle)
    {
        return { vertex: dir.normalized().mul(b.radius), index: -1 };
    }
    else
    {
        throw "Not supported shape";
    }
}

interface CSOSupportResult
{
    support: Vector2;
    supportA: Vector2;
    supportB: Vector2;
}

function csoSupport(c1: RigidBody, c2: RigidBody, dir: Vector2): CSOSupportResult
{
    const localDirP1 = c1.globalToLocal.mulVector2(dir, 0);
    const localDirP2 = c2.globalToLocal.mulVector2(dir.mul(-1), 0);

    let supportP1 = support(c1, localDirP1).vertex;
    let supportP2 = support(c2, localDirP2).vertex;

    supportP1 = c1.localToGlobal.mulVector2(supportP1, 1);
    supportP2 = c2.localToGlobal.mulVector2(supportP2, 1);

    return {
        support: supportP1.sub(supportP2),
        supportA: supportP1,
        supportB: supportP2
    };
}

interface GJKResult
{
    collide: boolean;
    simplex: Simplex;
}

function gjk(c1: RigidBody, c2: RigidBody): GJKResult
{
    const origin = new Vector2(0, 0);
    let simplex: Simplex = new Simplex();
    let dir = new Vector2(1, 0); // Random initial direction

    let result: GJKResult = { collide: false, simplex: simplex };

    let supportPoint = csoSupport(c1, c2, dir);
    simplex.addVertex(supportPoint.support, { p1: supportPoint.supportA, p2: supportPoint.supportB });

    for (let k = 0; k < Settings.GJK_MAX_ITERATION; k++)
    {
        let closest = simplex.getClosest(origin);

        if (closest.result.fixed().equals(origin))
        {
            result.collide = true;
            break;
        }

        if (simplex.count != 1)
        {
            // Rebuild the simplex with vertices that are used(involved) to calculate closest distance
            let newSimplex = new Simplex();

            for (let i = 0; i < closest.info.length; i++)
                newSimplex.addVertex(simplex.vertices[closest.info[i]]);
            simplex = newSimplex;
        }

        dir = origin.sub(closest.result);
        supportPoint = csoSupport(c1, c2, dir);

        // If the new support point is not further along the search direction than the closest point,
        // the two objects are not colliding so you can early return here.
        if (Util.toFixed(dir.length - dir.normalized().dot(supportPoint.support.sub(closest.result))) > 0)
        {
            result.collide = false;
            break;
        }

        if (simplex.containsVertex(supportPoint.support))
        {
            result.collide = false;
            break;
        }
        else
        {
            simplex.addVertex(supportPoint.support, { p1: supportPoint.supportA, p2: supportPoint.supportB });
        }
    }

    result.simplex = simplex;

    return result;
}

interface EPAResult
{
    penetrationDepth: number;
    contactNormal: Vector2;
}

function epa(c1: RigidBody, c2: RigidBody, gjkResult: Simplex): EPAResult
{
    let polytope: Polytope = new Polytope(gjkResult);

    let closestEdge: ClosestEdgeInfo = { index: 0, distance: Infinity, normal: new Vector2(0, 0) };

    for (let i = 0; i < Settings.EPA_MAX_ITERATION; i++)
    {
        closestEdge = polytope.getClosestEdge();
        let supportPoint = csoSupport(c1, c2, closestEdge.normal);
        let newDistance = closestEdge.normal.dot(supportPoint.support);

        if (Math.abs(closestEdge.distance - newDistance) > Settings.EPA_TOLERANCE)
        {
            // Insert the support vertex so that it expands our polytope
            polytope.vertices.splice(closestEdge.index + 1, 0, supportPoint.support);
        }
        else
        {
            // If you didn't expand edge, it means you reached the closest outer edge
            break;
        }
    }

    return {
        penetrationDepth: closestEdge.distance,
        contactNormal: closestEdge.normal,
    };
}

function findFarthestEdge(b: RigidBody, dir: Vector2): Edge
{
    let localDir = b.globalToLocal.mulVector2(dir, 0)
    let farthest = support(b, localDir);
    let curr = farthest.vertex;
    let idx = farthest.index;

    let localToGlobal = b.localToGlobal;

    if (b instanceof Circle)
    {
        curr = localToGlobal.mulVector2(curr, 1);
        let tangent = Util.cross(1, dir);

        return new Edge(curr, curr.add(tangent));
    }
    else if (b instanceof Polygon)
    {
        let p = b as Polygon;

        let prev = p.vertices[(idx - 1 + p.count) % p.count];
        let next = p.vertices[(idx + 1) % p.count];

        let e1 = curr.sub(prev).normalized();
        let e2 = curr.sub(next).normalized();

        let w = Math.abs(e1.dot(localDir)) <= Math.abs(e2.dot(localDir));

        curr = localToGlobal.mulVector2(curr, 1);

        return w ? new Edge(localToGlobal.mulVector2(prev, 1), curr) : new Edge(curr, localToGlobal.mulVector2(next, 1));
    }
    else
    {
        throw "Not supported shape";
    }
}

function clipEdge(edge: Edge, p: Vector2, dir: Vector2, remove: boolean = false)
{
    let d1 = edge.p1.sub(p).dot(dir);
    let d2 = edge.p2.sub(p).dot(dir);

    if (d1 >= 0 && d2 >= 0) return;

    let per = Math.abs(d1) + Math.abs(d2);

    if (d1 < 0)
    {
        if (remove)
            edge.p1 = edge.p2;
        else
            edge.p1 = edge.p1.add(edge.p2.sub(edge.p1).mul(-d1 / per));
    }
    else if (d2 < 0)
    {
        if (remove)
            edge.p2 = edge.p1;
        else
            edge.p2 = edge.p2.add(edge.p1.sub(edge.p2).mul(-d2 / per));
    }
}

// Since the findFarthestEdge function returns a edge with a minimum length of 1.0 for circle,
// merging threshold should be greater than sqrt(2) * minimum edge length
const CONTACT_MERGE_THRESHOLD = 1.4143;

function findContactPoints(n: Vector2, a: RigidBody, b: RigidBody): Vector2[]
{
    // collision normal in the world space
    let edgeA = findFarthestEdge(a, n);
    let edgeB = findFarthestEdge(b, n.mul(-1));

    let ref = edgeA;
    let inc = edgeB;
    let flip = false;

    let aPerp = Math.abs(edgeA.dir.dot(n));
    let bPerp = Math.abs(edgeB.dir.dot(n));

    if (aPerp > bPerp)
    {
        ref = edgeB;
        inc = edgeA;
        flip = true;
    }

    clipEdge(inc, ref.p1, ref.dir);
    clipEdge(inc, ref.p2, ref.dir.mul(-1));
    clipEdge(inc, ref.p1, flip ? n : n.mul(-1), true);

    let contactPoints: Vector2[];

    // If two points are closer than threshold, merge them into one point.
    if (inc.length <= CONTACT_MERGE_THRESHOLD)
        contactPoints = [inc.p1];
    else
        contactPoints = [inc.p1, inc.p2];

    return contactPoints;
}

// Returns contact data if collide, otherwise returns null
export function detectCollision(a: RigidBody, b: RigidBody): ContactManifold | null
{
    // Circle vs. Circle collision
    if (a instanceof Circle && b instanceof Circle)
    {
        let d = Util.squared_distance(a.position, b.position);
        let r2 = (a as Circle).radius + (b as Circle).radius;

        if (d > r2 * r2)
            return null;
        else
        {
            d = Math.sqrt(d);

            let contactNormal = b.position.sub(a.position).normalized();
            let contactPoint = a.position.add(contactNormal.mul(a.radius));
            let penetrationDepth = (r2 - d);

            if (contactNormal.dot(new Vector2(0, -1)) < 0)
            {
                let tmp = a;
                a = b;
                b = tmp;
                contactNormal.invert();
            }

            let contact = new ContactManifold(a, b, [contactPoint], penetrationDepth, contactNormal);

            return contact;
        }
    }

    // Broad Phase
    let boundingBoxA = createAABB(a);
    let boundingBoxB = createAABB(b);

    if (!testCollideAABB(boundingBoxA, boundingBoxB))
        return null;

    // Narrow Phase
    const gjkResult = gjk(a, b);

    if (!gjkResult.collide)
    {
        return null;
    }
    else
    {
        // If the gjk termination simplex has vertices less than 3, expand to full simplex
        // Because EPA needs a full n-simplex to start
        let simplex = gjkResult.simplex;
        switch (simplex.count)
        {
            case 1:
                let v = simplex.vertices[0];
                let randomSupport = csoSupport(a, b, new Vector2(1, 0)).support;
                if (randomSupport.equals(v))
                    randomSupport = csoSupport(a, b, new Vector2(-1, 0)).support;
                simplex.addVertex(randomSupport);
            case 2:
                let e = new Edge(simplex.vertices[0], simplex.vertices[1]);
                let normalSupport = csoSupport(a, b, e.normal).support;
                if (simplex.containsVertex(normalSupport))
                    simplex.addVertex(csoSupport(a, b, e.normal.inverted()).support);
                else
                    simplex.addVertex(normalSupport);
        }

        const epaResult: EPAResult = epa(a, b, gjkResult.simplex);

        // Apply axis weight to improve coherence
        if (epaResult.contactNormal.dot(new Vector2(0, -1)) < 0)
        {
            let tmp = a;
            a = b;
            b = tmp;
            epaResult.contactNormal.invert();
        }

        let contactPoints = findContactPoints(epaResult.contactNormal, a, b);

        let contact = new ContactManifold(a, b, contactPoints, epaResult.penetrationDepth, epaResult.contactNormal);

        return contact;
    }
}