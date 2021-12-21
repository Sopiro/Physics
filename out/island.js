import { Settings } from "./settings.js";
export class Island {
    constructor() {
        this.bodies = [];
        // Constraints to be solved
        this.manifolds = [];
        this.joints = [];
        this.constraints = [];
    }
    solve() {
        // Prepare for resolution step
        for (let i = 0; i < this.manifolds.length; i++)
            this.manifolds[i].prepare();
        for (let i = 0; i < this.joints.length; i++)
            this.joints[i].prepare();
        // Iteratively resolve violated velocity constraint
        for (let i = 0; i < Settings.numIterations; i++) {
            for (let j = 0; j < this.manifolds.length; j++)
                this.manifolds[j].solve();
            for (let j = 0; j < this.joints.length; j++)
                this.joints[j].solve();
        }
    }
    addBody(body) {
        this.bodies.push(body);
    }
    addManifold(manifold) {
        this.manifolds.push(manifold);
        this.constraints.push(manifold);
    }
    addJoint(joint) {
        this.joints.push(joint);
        this.constraints.push(joint);
    }
    clear() {
        this.bodies = [];
        this.manifolds = [];
        this.joints = [];
        this.constraints = [];
    }
}
// // Prepare for resolution step
// for (let i = 0; i < this.constraints.length; i++)
//     this.constraints[i].prepare();
// // Iteratively resolve violated velocity constraint
// for (let i = 0; i < Settings.numIterations; i++)
//     for (let j = 0; j < this.constraints.length; j++)
//         this.constraints[j].solve();
