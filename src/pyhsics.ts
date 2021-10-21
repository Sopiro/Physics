import { toFixed, Vector2 } from "./math.js";
import { Polygon } from "./polygon.js";
import { Simplex } from "./simplex.js";

export function subPolygon(p1: Polygon, p2: Polygon): Polygon
{
    let res: Vector2[] = [];

    for (let i = 0; i < p1.count; i++)
    {
        let p1v = p1.localToGlobal().mulVector(p1.vertices[i], 1);
        for (let j = 0; j < p2.count; j++)
        {
            let p2v = p2.localToGlobal().mulVector(p2.vertices[j], 1);

            res.push(p1v.subV(p2v));
        }
    }

    return new Polygon(res, false);
}

// Returns the fardest vertex in the 'dir' direction
export function support(vertices: Vector2[], dir: Vector2): Vector2
{
    let idx = 0;
    let maxValue = dir.dot(vertices[idx]);

    for (let i = 1; i < vertices.length; i++)
    {
        let value = dir.dot(vertices[i]);
        if (value > maxValue)
        {
            idx = i;
            maxValue = value;
        }
    }

    return vertices[idx];
}

export function csoSupport(p1: Polygon, p2: Polygon, dir: Vector2): Vector2
{
    const localDirP1 = p1.globalToLocal().mulVector(dir, 0);
    const localDirP2 = p2.globalToLocal().mulVector(dir.mulS(-1), 0);

    let supportP1 = support(p1.vertices, localDirP1);
    let supportP2 = support(p2.vertices, localDirP2);

    supportP1 = p1.localToGlobal().mulVector(supportP1, 1);
    supportP2 = p2.localToGlobal().mulVector(supportP2, 1);

    return supportP1.subV(supportP2);
}

const MAX_ITERATION = 10;

interface GJKResult
{
    collide: boolean;
    simplex: Simplex;
}

export function gjk(p1: Polygon, p2: Polygon)
{
    const origin = new Vector2(0, 0);
    let simplex = new Simplex();
    let dir = new Vector2(1, 0); // Random initial direction

    let supportPoint = csoSupport(p1, p2, dir);
    simplex.addVertex(supportPoint);

    let result: GJKResult = { collide: false, simplex: simplex };

    let k;
    for (k = 0; k < MAX_ITERATION; k++)
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

        dir = origin.subV(closest.result);
        supportPoint = csoSupport(p1, p2, dir);

        // If the new support point is not further along the search direction than the closest point,
        // the two objects are not colliding so you can early return here.
        if (toFixed(dir.getLength() - dir.normalized().dot(supportPoint.subV(closest.result))) > 0)
        {
            result.collide = false;
            break;
        }

        if (simplex.containsVertex(supportPoint))
        {
            result.collide = false;
            break;
        }
        else
            simplex.addVertex(supportPoint);
    }

    // throw "asd";
    if (k >= MAX_ITERATION)
        throw "Exceed max iteration";

    result.simplex = simplex;

    return result;
}

export function epa(p1: Polygon, p2: Polygon, polytope: Simplex)
{

}