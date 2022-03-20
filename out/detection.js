import { Circle } from "./circle.js";
import { ContactManifold } from "./contact.js";
import { Edge } from "./edge.js";
import { Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import { Polytope } from "./polytope.js";
import { Simplex } from "./simplex.js";
import * as Util from "./util.js";
import { Settings } from "./settings.js";
// Returns the fardest vertex in the 'dir' direction
function support(b, dir) {
    if (b instanceof Polygon) {
        let idx = 0;
        let maxValue = dir.dot(b.vertices[idx]);
        for (let i = 1; i < b.vertices.length; i++) {
            let value = dir.dot(b.vertices[i]);
            if (value > maxValue) {
                idx = i;
                maxValue = value;
            }
        }
        return { vertex: b.vertices[idx], index: idx };
    }
    else if (b instanceof Circle) {
        return { vertex: dir.normalized().mul(b.radius), index: -1 };
    }
    else {
        throw "Not a supported shape";
    }
}
/*
* Returns support point in 'Minkowski Difference' set
* Minkowski Sum: A ⊕ B = {Pa + Pb| Pa ∈ A, Pb ∈ B}
* Minkowski Difference : A ⊖ B = {Pa - Pb| Pa ∈ A, Pb ∈ B}
* CSO stands for Configuration Space Object
*/
function csoSupport(b1, b2, dir) {
    const localDirP1 = b1.globalToLocal.mulVector2(dir, 0);
    const localDirP2 = b2.globalToLocal.mulVector2(dir.inverted(), 0);
    let supportP1 = support(b1, localDirP1).vertex;
    let supportP2 = support(b2, localDirP2).vertex;
    supportP1 = b1.localToGlobal.mulVector2(supportP1, 1);
    supportP2 = b2.localToGlobal.mulVector2(supportP2, 1);
    return supportP1.sub(supportP2);
}
function gjk(b1, b2) {
    const origin = new Vector2(0, 0);
    let simplex = new Simplex();
    let dir = new Vector2(1, 0); // Random initial direction
    let result = { collide: false, simplex: simplex };
    let supportPoint = csoSupport(b1, b2, dir);
    simplex.addVertex(supportPoint);
    for (let k = 0; k < Settings.GJK_MAX_ITERATION; k++) {
        let closest = simplex.getClosest(origin);
        if (Util.squared_distance(closest.result, origin) < Settings.GJK_TOLERANCE) {
            result.collide = true;
            break;
        }
        if (simplex.count != 1) {
            // Rebuild the simplex with vertices that are used(involved) to calculate closest distance
            simplex.shrink(closest.contributors);
        }
        dir = origin.sub(closest.result);
        supportPoint = csoSupport(b1, b2, dir);
        // If the new support point is not further along the search direction than the closest point,
        // two objects are not colliding so you can early return here.
        if (dir.length > dir.normalized().dot(supportPoint.sub(closest.result))) {
            result.collide = false;
            break;
        }
        if (simplex.containsVertex(supportPoint)) {
            result.collide = false;
            break;
        }
        else {
            simplex.addVertex(supportPoint);
        }
    }
    result.simplex = simplex;
    return result;
}
function epa(b1, b2, gjkResult) {
    let polytope = new Polytope(gjkResult);
    let closestEdge = { index: 0, distance: Infinity, normal: new Vector2(0, 0) };
    for (let i = 0; i < Settings.EPA_MAX_ITERATION; i++) {
        closestEdge = polytope.getClosestEdge();
        let supportPoint = csoSupport(b1, b2, closestEdge.normal);
        let newDistance = closestEdge.normal.dot(supportPoint);
        if (Math.abs(closestEdge.distance - newDistance) > Settings.EPA_TOLERANCE) {
            // Insert the support vertex so that it expands our polytope
            polytope.vertices.splice(closestEdge.index + 1, 0, supportPoint);
        }
        else {
            // If you didn't expand edge, it means you reached the closest outer edge
            break;
        }
    }
    return {
        penetrationDepth: closestEdge.distance,
        contactNormal: closestEdge.normal,
    };
}
const TANGENT_MIN_LENGTH = 0.01;
function findFarthestEdge(b, dir) {
    let localDir = b.globalToLocal.mulVector2(dir, 0);
    let farthest = support(b, localDir);
    let curr = farthest.vertex;
    let idx = farthest.index;
    let localToGlobal = b.localToGlobal;
    if (b instanceof Circle) {
        curr = localToGlobal.mulVector2(curr, 1);
        let tangent = Util.cross(1, dir).mul(TANGENT_MIN_LENGTH);
        return new Edge(curr, curr.add(tangent), -1);
    }
    else if (b instanceof Polygon) {
        let p = b;
        let prev = p.vertices[(idx - 1 + p.count) % p.count];
        let next = p.vertices[(idx + 1) % p.count];
        let e1 = curr.sub(prev).normalized();
        let e2 = curr.sub(next).normalized();
        let w = Math.abs(e1.dot(localDir)) <= Math.abs(e2.dot(localDir));
        curr = localToGlobal.mulVector2(curr, 1);
        return w ?
            new Edge(localToGlobal.mulVector2(prev, 1), curr, (idx - 1 + p.count) % p.count, idx) :
            new Edge(curr, localToGlobal.mulVector2(next, 1), idx, (idx + 1) % p.count);
    }
    else {
        throw "Not a supported shape";
    }
}
function clipEdge(edge, p, dir, remove = false) {
    let d1 = edge.p1.sub(p).dot(dir);
    let d2 = edge.p2.sub(p).dot(dir);
    if (d1 >= 0 && d2 >= 0)
        return;
    let per = Math.abs(d1) + Math.abs(d2);
    if (d1 < 0) {
        if (remove) {
            edge.p1 = edge.p2;
            edge.id1 = edge.id2;
        }
        else {
            edge.p1 = edge.p1.add(edge.p2.sub(edge.p1).mul(-d1 / per));
        }
    }
    else if (d2 < 0) {
        if (remove) {
            edge.p2 = edge.p1;
            edge.id2 = edge.id1;
        }
        else {
            edge.p2 = edge.p2.add(edge.p1.sub(edge.p2).mul(-d2 / per));
        }
    }
}
// Since the findFarthestEdge function returns a edge with a minimum length of 0.01 for circle,
// merging threshold should be greater than sqrt(2) * minimum edge length
const CONTACT_MERGE_THRESHOLD = 1.415 * TANGENT_MIN_LENGTH;
function findContactPoints(n, a, b) {
    let edgeA = findFarthestEdge(a, n);
    let edgeB = findFarthestEdge(b, n.inverted());
    let ref = edgeA; // Reference edge
    let inc = edgeB; // Incidence edge
    let flip = false;
    let aPerpendicularness = Math.abs(edgeA.dir.dot(n));
    let bPerpendicularness = Math.abs(edgeB.dir.dot(n));
    if (aPerpendicularness >= bPerpendicularness) {
        ref = edgeB;
        inc = edgeA;
        flip = true;
    }
    clipEdge(inc, ref.p1, ref.dir);
    clipEdge(inc, ref.p2, ref.dir.inverted());
    clipEdge(inc, ref.p1, flip ? n : n.inverted(), true);
    let contactPoints;
    // If two points are closer than threshold, merge them into one point
    if (inc.length <= CONTACT_MERGE_THRESHOLD) {
        contactPoints = [{ point: inc.p1, id: inc.id1 }];
    }
    else {
        contactPoints = [{ point: inc.p1, id: inc.id1 }, { point: inc.p2, id: inc.id2 }];
    }
    return contactPoints;
}
// Returns contact data if collide, otherwise returns null
export function detectCollision(a, b) {
    // Circle vs. Circle collision
    if (a instanceof Circle && b instanceof Circle) {
        let d = Util.squared_distance(a.position, b.position);
        let r2 = a.radius + b.radius;
        if (d > r2 * r2) {
            return null;
        }
        else {
            d = Math.sqrt(d);
            let contactNormal = b.position.sub(a.position).normalized();
            let contactPoint = a.position.add(contactNormal.mul(a.radius));
            let penetrationDepth = (r2 - d);
            let flipped = false;
            if (contactNormal.dot(new Vector2(0, -1)) < 0) {
                let tmp = a;
                a = b;
                b = tmp;
                contactNormal.invert();
                flipped = true;
            }
            let contact = new ContactManifold(a, b, [{ point: contactPoint, id: -1 }], penetrationDepth, contactNormal, flipped);
            return contact;
        }
    }
    const gjkResult = gjk(a, b);
    if (!gjkResult.collide) {
        return null;
    }
    else {
        // If the gjk termination simplex has vertices less than 3, expand to full simplex
        // Because EPA needs a full n-simplex to get started
        let simplex = gjkResult.simplex;
        switch (simplex.count) {
            case 1:
                let v = simplex.vertices[0];
                let randomSupport = csoSupport(a, b, new Vector2(1, 0));
                if (randomSupport.equals(v))
                    randomSupport = csoSupport(a, b, new Vector2(-1, 0));
                simplex.addVertex(randomSupport);
            case 2:
                let e = new Edge(simplex.vertices[0], simplex.vertices[1]);
                let normalSupport = csoSupport(a, b, e.normal);
                if (simplex.containsVertex(normalSupport))
                    simplex.addVertex(csoSupport(a, b, e.normal.inverted()));
                else
                    simplex.addVertex(normalSupport);
        }
        const epaResult = epa(a, b, gjkResult.simplex);
        let flipped = false;
        // Apply axis weight to improve coherence
        if (epaResult.contactNormal.dot(new Vector2(0, -1)) < 0) {
            let tmp = a;
            a = b;
            b = tmp;
            epaResult.contactNormal.invert();
            flipped = true;
        }
        // Remove floating point error
        epaResult.contactNormal.fix(Settings.EPA_TOLERANCE);
        let contactPoints = findContactPoints(epaResult.contactNormal, a, b);
        let contact = new ContactManifold(a, b, contactPoints, epaResult.penetrationDepth, epaResult.contactNormal, flipped);
        return contact;
    }
}
export function testPointInside(body, point) {
    let localP = body.globalToLocal.mulVector2(point, 1);
    if (body instanceof Circle) {
        return localP.length <= body.radius;
    }
    else if (body instanceof Polygon) {
        let poly = body;
        let dir = poly.vertices[0].sub(localP).cross(poly.vertices[1].sub(localP));
        for (let i = 1; i < poly.vertices.length; i++) {
            let nDir = poly.vertices[i].sub(localP).cross(poly.vertices[(i + 1) % poly.count].sub(localP));
            if (dir * nDir < 0)
                return false;
        }
        return true;
    }
    else {
        throw "Not a supported shape";
    }
}
