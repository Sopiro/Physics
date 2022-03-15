import { Pair } from "./util.js";
import { RigidBody } from "./rigidbody.js";
import { createAABB, detectCollisionAABB } from "./aabb.js";

//N^2 broad phase, actually (N^2 - N) / 2
export function getCollisionPairsNSquared(bodies: RigidBody[]): Pair<RigidBody, RigidBody>[]
{
    let pairs: Pair<RigidBody, RigidBody>[] = [];

    for (let i = 0; i < bodies.length; i++)
    {
        let a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++)
        {
            let b = bodies[j];

            if (detectCollisionAABB(createAABB(a), createAABB(b)))
            {
                pairs.push({ p1: a, p2: b });
            }
        }
    }

    return pairs;
}