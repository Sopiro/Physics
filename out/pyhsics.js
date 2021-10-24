import { Circle } from "./circle.js";
import { Type } from "./collider.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import { Polytope } from "./polytope.js";
import { Simplex } from "./simplex.js";
import { getUV, lerpVector, toFixed } from "./util.js";
// Returns the fardest vertex in the 'dir' direction
function support(collider, dir) {
    if (collider.type == Type.Polygon && collider instanceof Polygon) {
        let idx = 0;
        let maxValue = dir.dot(collider.vertices[idx]);
        for (let i = 1; i < collider.vertices.length; i++) {
            let value = dir.dot(collider.vertices[i]);
            if (value > maxValue) {
                idx = i;
                maxValue = value;
            }
        }
        return collider.vertices[idx];
    }
    else if (collider.type == Type.Circle && collider instanceof Circle) {
        return dir.normalized().mulS(collider.radius);
    }
    else {
        throw "Not supported shape";
    }
}
function csoSupport(c1, c2, dir) {
    const localDirP1 = c1.globalToLocal().mulVector(dir, 0);
    const localDirP2 = c2.globalToLocal().mulVector(dir.mulS(-1), 0);
    let supportP1 = support(c1, localDirP1);
    let supportP2 = support(c2, localDirP2);
    supportP1 = c1.localToGlobal().mulVector(supportP1, 1);
    supportP2 = c2.localToGlobal().mulVector(supportP2, 1);
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
        if (toFixed(dir.getLength() - dir.normalized().dot(supportPoint.support.subV(closest.result))) > 0) {
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
            polytope.supports.splice(closestEdge.index + 1, 0, { p1: supportPoint.supportA, p2: supportPoint.supportB });
        }
        else {
            // If you didn't expand edge, you reached the most outer edge
            break;
        }
    }
    // Calcalate the contact point
    const a = polytope.vertices[closestEdge.index];
    const b = polytope.vertices[(closestEdge.index + 1) % polytope.count];
    const supportA1 = polytope.supports[closestEdge.index].p1;
    const supportB1 = polytope.supports[closestEdge.index].p2;
    const supportA2 = polytope.supports[(closestEdge.index + 1) % polytope.count].p1;
    const supportB2 = polytope.supports[(closestEdge.index + 1) % polytope.count].p2;
    // Project origin onto the closest CSO edge, compute the barycentric weights
    const uv = getUV(a, b, new Vector2(0, 0));
    return {
        penetrationDepth: closestEdge.distance,
        contactNormal: closestEdge.normal,
        // For each collider, linearly combine the support points corresponding to the vertices of the edge,
        // using the barycentric weights as coefficients
        contactPointA: lerpVector(supportA1, supportA2, uv),
        contactPointB: lerpVector(supportB1, supportB2, uv)
    };
}
export function detectCollision(a, b) {
    const gjkResult = gjk(a, b);
    if (gjkResult.simplex.count != 3) {
        return { collide: false };
    }
    else {
        const epaResult = epa(a, b, gjkResult.simplex);
        return {
            collide: true,
            penetrationDepth: epaResult.penetrationDepth,
            contactNormal: epaResult.contactNormal,
            contactPonintA: epaResult.contactPointA,
            contactPonintB: epaResult.contactPointB,
        };
    }
}
