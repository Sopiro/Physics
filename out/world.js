import { Vector2 } from "./math.js";
import { Type } from "./collider.js";
import { detectCollision } from "./pyhsics.js";
export class World {
    constructor(useFixedDelta) {
        this.colliders = [];
        // Number of resolution iterations
        this.numIterations = 10;
        this.fixedDeltaTime = 1 / 144.0;
        this.gravity = -9.81 * 144;
        this.sleep = 0.01;
        this.useFixedDelta = useFixedDelta;
    }
    update(delta) {
        if (this.useFixedDelta)
            delta = this.fixedDeltaTime;
        // Integrate forces, yield tentative velocities that possibly violate the constraint
        this.colliders.forEach(c => {
            c.addVelocity(c.force.mulS(c.inverseMass * delta));
            c.addAngularVelocity(c.torque * c.inverseInertia * delta);
            // Apply gravity 
            if (c.type != Type.Ground)
                c.addVelocity(new Vector2(0, this.gravity * delta));
        });
        const contacts = [];
        // O(N^2) Crud collision detection
        for (let i = 0; i < this.colliders.length; i++) {
            let a = this.colliders[i];
            for (let j = i + 1; j < this.colliders.length; j++) {
                let b = this.colliders[j];
                let contact = detectCollision(a, b);
                if (contact != null)
                    contacts.push(contact);
            }
        }
        // Prepare for resolution step
        contacts.forEach(contact => {
            contact.prepareResolution(delta);
        });
        // Iteratively resolve violated velocity constraint
        for (let i = 0; i < this.numIterations; i++) {
            contacts.forEach(contact => {
                contact.resolveConstraint();
            });
        }
        // console.log(this.colliders[0].linearVelocity);
        // Update the positions using the new velocities
        this.colliders.forEach((c, index) => {
            c.position.x += c.linearVelocity.x * delta;
            c.position.y += c.linearVelocity.y * delta;
            c.rotation += c.angularVelocity * delta;
            if (c.position.y < -500)
                this.colliders.splice(index, 1);
            c.force.clear();
            c.torque = 0;
        });
        // console.log(this.colliders[0].linearVelocity.getLength());
    }
    register(collider) {
        this.colliders.push(collider);
    }
    clear() {
        this.colliders = [];
    }
    get numColliders() {
        return this.colliders.length;
    }
}
