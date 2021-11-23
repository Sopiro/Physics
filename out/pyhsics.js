import { Circle } from "./circle.js";
import { Type as Shape } from "./collider.js";
import { Edge } from "./edge.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import { Polytope } from "./polytope.js";
import { Simplex } from "./simplex.js";
import * as Util from "./util.js";
export function createAABB(c) {
    switch (c.shape) {
        case Shape.Circle:
            let circle = c;
            let cmInGlobal = c.localToGlobal.mulVector(circle.center, 1);
            return {
                min: new Vector2(cmInGlobal.x - circle.radius, cmInGlobal.y - circle.radius),
                max: new Vector2(cmInGlobal.x + circle.radius, cmInGlobal.y + circle.radius)
            };
        case Shape.Polygon:
            let poly = c;
            const lTg = poly.localToGlobal;
            let res = { min: lTg.mulVector(poly.vertices[0], 1), max: lTg.mulVector(poly.vertices[0], 1) };
            for (let i = 1; i < poly.count; i++) {
                let gv = lTg.mulVector(poly.vertices[i], 1);
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
        default:
            throw "Not supported shape";
    }
}
export function testCollideAABB(a, b) {
    if (a.min.x > b.max.x || a.max.x < b.min.x)
        return false;
    if (a.min.y > b.max.y || a.max.y < b.min.y)
        return false;
    return true;
}
// Returns the fardest vertex in the 'dir' direction
function support(collider, dir) {
    if (collider.shape == Shape.Polygon && collider instanceof Polygon) {
        let idx = 0;
        let maxValue = dir.dot(collider.vertices[idx]);
        for (let i = 1; i < collider.vertices.length; i++) {
            let value = dir.dot(collider.vertices[i]);
            if (value > maxValue) {
                idx = i;
                maxValue = value;
            }
        }
        return { vertex: collider.vertices[idx], index: idx };
    }
    else if (collider.shape == Shape.Circle && collider instanceof Circle) {
        return { vertex: dir.normalized().mulS(collider.radius), index: -1 };
    }
    else {
        throw "Not supported shape";
    }
}
function csoSupport(c1, c2, dir) {
    const localDirP1 = c1.globalToLocal.mulVector(dir, 0);
    const localDirP2 = c2.globalToLocal.mulVector(dir.mulS(-1), 0);
    let supportP1 = support(c1, localDirP1).vertex;
    let supportP2 = support(c2, localDirP2).vertex;
    supportP1 = c1.localToGlobal.mulVector(supportP1, 1);
    supportP2 = c2.localToGlobal.mulVector(supportP2, 1);
    return {
        support: supportP1.subV(supportP2),
        supportA: supportP1,
        supportB: supportP2
    };
}
const MAX_ITERATION = 20;
function gjk(c1, c2) {
    const origin = new Vector2(0, 0);
    let simplex = new Simplex();
    let dir = new Vector2(1, 0); // Random initial direction
    let result = { collide: false, simplex: simplex };
    let supportPoint = csoSupport(c1, c2, dir);
    simplex.addVertex(supportPoint.support, { p1: supportPoint.supportA, p2: supportPoint.supportB });
    for (let k = 0; k < MAX_ITERATION; k++) {
        let closest = simplex.getClosest(origin);
        if (closest.result.fixed().equals(origin)) {
            result.collide = true;
            break;
        }
        if (simplex.count != 1) {
            // Rebuild the simplex with vertices that are used(involved) to calculate closest distance
            let newSimplex = new Simplex();
            for (let i = 0; i < closest.info.length; i++)
                newSimplex.addVertex(simplex.vertices[closest.info[i]], simplex.supports[closest.info[i]]);
            simplex = newSimplex;
        }
        dir = origin.subV(closest.result);
        supportPoint = csoSupport(c1, c2, dir);
        // If the new support point is not further along the search direction than the closest point,
        // the two objects are not colliding so you can early return here.
        if (Util.toFixed(dir.getLength() - dir.normalized().dot(supportPoint.support.subV(closest.result))) > 0) {
            result.collide = false;
            break;
        }
        if (simplex.containsVertex(supportPoint.support)) {
            result.collide = false;
            break;
        }
        else {
            simplex.addVertex(supportPoint.support, { p1: supportPoint.supportA, p2: supportPoint.supportB });
        }
    }
    result.simplex = simplex;
    return result;
}
function findFarthestEdge(c, dir) {
    let localDir = c.globalToLocal.mulVector(dir, 0);
    let farthest = support(c, localDir);
    let curr = farthest.vertex;
    let idx = farthest.index;
    let localToGlobal = c.localToGlobal;
    switch (c.shape) {
        case Shape.Circle:
            {
                curr = localToGlobal.mulVector(curr, 1);
                let tangent = new Vector2(-dir.y, dir.x);
                return new Edge(curr, curr.addV(tangent));
            }
        case Shape.Polygon:
            {
                let p = c;
                let prev = p.vertices[(idx - 1 + p.count) % p.count];
                let next = p.vertices[(idx + 1) % p.count];
                let e1 = curr.subV(prev).normalized();
                let e2 = curr.subV(next).normalized();
                let w = Math.abs(e1.dot(localDir)) <= Math.abs(e2.dot(localDir));
                curr = localToGlobal.mulVector(curr, 1);
                return w ? new Edge(localToGlobal.mulVector(prev, 1), curr) : new Edge(curr, localToGlobal.mulVector(next, 1));
            }
    }
}
const TOLERANCE = 0.001;
function epa(c1, c2, gjkResult) {
    let polytope = new Polytope(gjkResult);
    let closestEdge = { index: 0, distance: Infinity, normal: new Vector2() };
    for (let i = 0; i < MAX_ITERATION; i++) {
        closestEdge = polytope.getClosestEdge();
        let supportPoint = csoSupport(c1, c2, closestEdge.normal);
        let newDistance = closestEdge.normal.dot(supportPoint.support);
        if (Math.abs(closestEdge.distance - newDistance) > TOLERANCE) {
            // Insert the support vertex so that it expands our polytope
            polytope.vertices.splice(closestEdge.index + 1, 0, supportPoint.support);
        }
        else {
            // If you didn't expand edge, you reached the most outer edge
            break;
        }
    }
    return {
        penetrationDepth: closestEdge.distance,
        contactNormal: closestEdge.normal,
    };
}
function clipEdge(edge, p, dir, remove = false) {
    let d1 = edge.p1.subV(p).dot(dir);
    let d2 = edge.p2.subV(p).dot(dir);
    if (d1 >= 0 && d2 >= 0)
        return;
    let per = Math.abs(d1) + Math.abs(d2);
    if (d1 < 0) {
        if (remove)
            edge.p1 = edge.p2;
        else
            edge.p1 = edge.p1.addV(edge.p2.subV(edge.p1).mulS(-d1 / per));
    }
    else if (d2 < 0) {
        if (remove)
            edge.p2 = edge.p1;
        else
            edge.p2 = edge.p2.addV(edge.p1.subV(edge.p2).mulS(-d2 / per));
    }
}
function findContactPoints(n, a, b) {
    // collision normal in the world space
    let edgeA = findFarthestEdge(a, n);
    let edgeB = findFarthestEdge(b, n.mulS(-1));
    let ref = edgeA;
    let inc = edgeB;
    let flip = false;
    if (Math.abs(edgeA.dir.dot(n)) > Math.abs(edgeB.dir.dot(n))) {
        ref = edgeB;
        inc = edgeA;
        flip = true;
    }
    clipEdge(inc, ref.p1, ref.dir);
    clipEdge(inc, ref.p2, ref.dir.mulS(-1));
    clipEdge(inc, ref.p1, flip ? n : n.mulS(-1), true);
    let contactPoints;
    if (inc.length <= 1.4143)
        contactPoints = [inc.p1];
    else
        contactPoints = [inc.p1, inc.p2];
    return contactPoints;
}
export function detectCollision(a, b) {
    // Broad Phase
    let boundingBoxA = createAABB(a);
    let boundingBoxB = createAABB(b);
    if (!testCollideAABB(boundingBoxA, boundingBoxB))
        return { collide: false };
    // Narrow Phase
    const gjkResult = gjk(a, b);
    if (!gjkResult.collide) {
        return { collide: false };
    }
    else {
        // If the gjk termination simplex has vertices less than 3, expand to full simplex
        // Because EPA needs a full n-simplex to start
        let simplex = gjkResult.simplex;
        switch (simplex.count) {
            case 1:
                let v = simplex.vertices[0];
                simplex.addVertex(csoSupport(a, b, v.normalized().inverted()).support);
            case 2:
                let e = new Edge(simplex.vertices[0], simplex.vertices[1]);
                let newVertex = csoSupport(a, b, e.normal).support;
                if (simplex.containsVertex(newVertex))
                    simplex.addVertex(csoSupport(a, b, e.normal.inverted()).support);
                else
                    simplex.addVertex(newVertex);
        }
        const epaResult = epa(a, b, simplex);
        let contactPoints = findContactPoints(epaResult.contactNormal, a, b);
        return {
            collide: true,
            penetrationDepth: epaResult.penetrationDepth,
            contactNormal: epaResult.contactNormal,
            contactPonits: contactPoints
        };
    }
}
