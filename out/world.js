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
        this.useFixedDelta = useFixedDelta;
    }
    update(delta) {
        if (this.useFixedDelta)
            delta = this.fixedDeltaTime;
        // Apply externel forces, yield tentative velocities that possibly violate the constraint
        this.colliders.forEach(collider => {
            // Apply gravity 
            if (collider.type != Type.Ground)
                collider.addVelocity(new Vector2(0, this.gravity * delta));
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
            contact.prepareResoultion(delta);
        });
        // Iteratively resolve violated velocity constraint
        for (let i = 0; i < this.numIterations; i++) {
            contacts.forEach(contact => {
                contact.resolveConstraint();
            });
        }
        // Update the positions using the new velocities
        this.colliders.forEach((collider, index) => {
            collider.update(delta);
            if (collider.position.y < -500)
                this.colliders.splice(index, 1);
        });
    }
    register(collider) {
        this.colliders.push(collider);
    }
    clear() {
        this.colliders = [];
    }
}
