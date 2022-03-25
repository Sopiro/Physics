import { RigidBody, Type } from "./rigidbody.js";
import { testPointInside, detectCollision } from "./detection.js";
import { ContactManifold } from "./contact.js";
import * as Util from "./util.js";
import { Settings } from "./settings.js";
import { Joint } from "./joint.js";
import { Island } from "./island.js";
import { GrabJoint } from "./grab.js";
import { AABBTree } from "./aabbtree.js";
import { AABB, containsAABB, createAABB, toRigidBody } from "./aabb.js";
import { Vector2 } from "./math.js";
import { getCollisionPairsNSquared } from "./nsquared.js";

type Registrable = RigidBody | Joint;

export class World
{
    private uid = 0;

    // Dynamic AABB Tree for broad phase collision detection
    public tree: AABBTree = new AABBTree();
    // All registered rigid bodies
    public bodies: RigidBody[] = [];

    // Constraints to be solved
    public manifolds: ContactManifold[] = [];
    public joints: Joint[] = [];

    public manifoldMap: Map<number, ContactManifold> = new Map();
    public jointMap: Map<number, Joint> = new Map();
    public passTestSet: Set<number> = new Set();

    public numIslands: number = 0;
    public sleepingIslands: number = 0;
    public sleepingBodies: number = 0;

    public forceIntegration: boolean = false;

    update(delta: number): void
    {
        let newManifolds: ContactManifold[] = [];
        let newManifoldMap: Map<number, ContactManifold> = new Map();

        // Update the AABB tree dynamically
        for (let i = 0; i < this.bodies.length; i++)
        {
            let b = this.bodies[i];
            b.manifoldIDs = [];

            if (b.sleeping) continue;

            let node = b.node!;
            let tightAABB = createAABB(b, 0.0);

            if (containsAABB(node.aabb, tightAABB)) continue;

            this.tree.remove(node);
            this.tree.add(b);
        }

        // Broad Phase
        // Retrieve a list of collider pairs that are potentially colliding
        // let pairs = getCollisionPairsNSquared(this.bodies);
        let pairs = this.tree.getCollisionPairs();

        for (let i = 0; i < pairs.length; i++)
        {
            let pair = pairs[i];
            let a = pair.p1;
            let b = pair.p2;

            // Improve coherence
            if (a.id > b.id)
            {
                a = pair.p2;
                b = pair.p1;
            }

            if (a.type == Type.Static && b.type == Type.Static)
                continue;

            let key = Util.make_pair_natural(a.id, b.id);
            if (this.passTestSet.has(key)) continue;

            // Narrow Phase
            // Execute more accurate and expensive collision detection
            let newManifold = detectCollision(a, b);
            if (newManifold == null) continue;

            a.manifoldIDs.push(key);
            b.manifoldIDs.push(key);

            if (Settings.warmStarting && this.manifoldMap.has(key))
            {
                let oldManifold = this.manifoldMap.get(key)!;
                newManifold.tryWarmStart(oldManifold);
            }

            newManifoldMap.set(key, newManifold);
            newManifolds.push(newManifold);
        }

        this.manifoldMap = newManifoldMap;
        this.manifolds = newManifolds;

        // Build the constraint island
        let island = new Island(this);
        let restingBodies = 0;
        let islandID = 0;
        this.sleepingIslands = 0;
        this.sleepingBodies = 0;

        let visited: Set<number> = new Set();
        let stack: RigidBody[] = [];

        // Perform a DFS(Depth First Search) on the constraint graph
        // After building island, each island can be solved in parallel because they are independent of each other
        for (let i = 0; i < this.bodies.length; i++)
        {
            let b = this.bodies[i];

            if (visited.has(b.id) || b.type == Type.Static)
                continue;

            stack = [];
            stack.push(b);

            islandID++;
            while (stack.length > 0)
            {
                let t = stack.pop()!;
                if (visited.has(t.id) || t.type == Type.Static)
                    continue;

                visited.add(t.id);
                t.islandID = islandID;
                island.addBody(t);

                for (let m = 0; m < t.manifoldIDs.length; m++)
                {
                    let key = t.manifoldIDs[m];
                    let manifold = this.manifoldMap.get(key)!;

                    let other = manifold.bodyB.id == t.id ? manifold.bodyA : manifold.bodyB;

                    if (visited.has(other.id))
                        continue;

                    island.addManifold(manifold);
                    stack.push(other);
                }

                for (let j = 0; j < t.jointIDs.length; j++)
                {
                    let key = t.jointIDs[j];
                    let joint = this.jointMap.get(key)!;

                    let other = joint.bodyB.id == t.id ? joint.bodyA : joint.bodyB;

                    if (joint instanceof GrabJoint)
                    {
                        island.addJoint(joint);
                        t.awake();
                    }

                    if (visited.has(other.id))
                        continue;

                    island.addJoint(joint);
                    stack.push(other);
                }

                if (t.resting > Settings.sleepingWait)
                    restingBodies++;
            }

            island.sleeping = Settings.sleepEnabled && (restingBodies == island.numBodies);

            if (island.sleeping)
            {
                this.sleepingBodies += island.numBodies;
                this.sleepingIslands++;
            }

            island.solve(delta);
            island.clear();
            restingBodies = 0;
        }

        this.numIslands = islandID;
    }

    register(r: Registrable, passTest: boolean = false): void
    {
        r.id = this.uid++;

        if (r instanceof RigidBody)
        {
            this.bodies.push(r);
            this.tree.add(r);
        }
        else if (r instanceof Joint)
        {
            if (r.bodyA.id == -1 || r.bodyB.id == -1)
                throw "You should register the rigid bodies before registering the joint";

            if (passTest)
                this.addPassTestPair(r.bodyA, r.bodyB);

            r.bodyA.jointIDs.push(r.id);
            if (r.bodyA.id != r.bodyB.id) // Extra handle for grab joint
                r.bodyB.jointIDs.push(r.id);

            this.jointMap.set(r.id, r);
            this.joints = Array.from(this.jointMap.values());
        }
    }

    unregister(id: number, isJoint: boolean = false): boolean
    {
        if (isJoint)
        {
            let joint = this.jointMap.get(id);
            if (joint == undefined) return false;

            for (let i = 0; i < joint.bodyA.jointIDs.length; i++)
            {
                if (id == joint.bodyA.jointIDs[i])
                {
                    joint.bodyA.jointIDs.splice(i, 1);
                    break;
                }
            }

            for (let i = 0; i < joint.bodyB.jointIDs.length; i++)
            {
                if (id == joint.bodyB.jointIDs[i])
                {
                    joint.bodyB.jointIDs.splice(i, 1);
                    break;
                }
            }

            this.jointMap.delete(id);
            this.removePassTestPair(joint.bodyA, joint.bodyB);
            this.joints = Array.from(this.jointMap.values());

            return true;
        }

        for (let i = 0; i < this.bodies.length; i++)
        {
            let b = this.bodies[i];
            if (b.id != id) continue;

            this.bodies.splice(i, 1);
            this.tree.remove(b.node!);

            for (let m = 0; m < b.manifoldIDs.length; m++)
            {
                let manifold = this.manifoldMap.get(b.manifoldIDs[m])!;

                manifold.bodyA.awake();
                manifold.bodyB.awake();
            }

            for (let j = 0; j < b.jointIDs.length; j++)
            {
                let jid = b.jointIDs[j];

                let joint = this.jointMap.get(jid)!;
                let other = joint.bodyA.id == id ? joint.bodyB : joint.bodyA;

                other.awake();

                for (let k = 0; k < other.jointIDs.length; k++)
                {
                    if (other.jointIDs[k] == jid)
                    {
                        other.jointIDs.splice(k, 1);
                        break;
                    }
                }

                this.jointMap.delete(jid);
            }

            this.joints = Array.from(this.jointMap.values());
            return true;
        }

        return false;
    }

    queryPoint(point: Vector2): RigidBody[]
    {
        let res: RigidBody[] = [];
        let nodes = this.tree.queryPoint(point);

        for (let i = 0; i < nodes.length; i++)
        {
            let b = nodes[i].body!;

            if (testPointInside(b, point))
            {
                res.push(b);
                break;
            }
        }

        return res;
    }

    queryRegion(region: AABB): RigidBody[]
    {
        let res: RigidBody[] = [];
        let nodes = this.tree.queryRegion(region);

        for (let i = 0; i < nodes.length; i++)
        {
            let node = nodes[i];

            if (containsAABB(region, node.aabb))
            {
                res.push(node.body!);
                continue;
            }

            if (detectCollision(toRigidBody(region), node.body!) != null)
            {
                res.push(node.body!);
            }
        }

        return res;
    }

    addPassTestPair(bodyA: RigidBody, bodyB: RigidBody)
    {
        this.passTestSet.add(Util.make_pair_natural(bodyA.id, bodyB.id));
        this.passTestSet.add(Util.make_pair_natural(bodyB.id, bodyA.id));
    }

    removePassTestPair(bodyA: RigidBody, bodyB: RigidBody)
    {
        this.passTestSet.delete(Util.make_pair_natural(bodyA.id, bodyB.id));
        this.passTestSet.delete(Util.make_pair_natural(bodyB.id, bodyA.id));
    }

    reset(): void
    {
        this.tree.reset();
        this.bodies = [];
        this.joints = [];
        this.manifolds = [];
        this.passTestSet.clear();
        this.manifoldMap.clear();
        this.jointMap.clear();
        this.uid = 0;
    }

    surprise(): void
    {
        for (let i = 0; i < this.bodies.length; i++)
        {
            let b = this.bodies[i];
            b.awake();
        }
    }

    get numBodies(): number
    {
        return this.bodies.length;
    }

    get numJoints(): number
    {
        return this.jointMap.size;
    }
}