import { Entity } from "./entity.js";
import { Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
export var Type;
(function (Type) {
    Type[Type["Static"] = 0] = "Static";
    Type[Type["Dynamic"] = 1] = "Dynamic";
})(Type || (Type = {}));
// Children: Circle, Polygon
export class RigidBody extends Entity {
    constructor(type) {
        super();
        this.id = -1;
        this.islandID = 0;
        this.manifoldIDs = []; // ids of contact manifold containing this body
        this.jointIDs = []; // ids of the joint containing this body
        this.resting = 0;
        this.sleeping = false;
        this._force = new Vector2(0, 0);
        this._torque = 0.0;
        this._linearVelocity = new Vector2(0, 0);
        this._angularVelocity = 0;
        this._friction = Settings.defaultFriction;
        this._restitution = Settings.defaultRestitution;
        this._surfaceSpeed = 0.0;
        this.type = type;
        if (this.type == Type.Static) {
            this._density = Number.MAX_VALUE;
            this._mass = Number.MAX_VALUE;
            this._invMass = 0;
            this._inertia = Number.MAX_VALUE;
            this._invInertia = 0;
            this.sleeping = true;
        }
        else {
            // This part is implemented by children.
        }
    }
    get density() {
        return this._density;
    }
    set density(d) {
        Util.assert(d > 0);
        this._density = d;
    }
    get mass() {
        return this._mass;
    }
    set mass(m) {
        Util.assert(m > 0);
        this._mass = m;
        this._invMass = 1.0 / m;
    }
    get inverseMass() {
        return this._invMass;
    }
    get inertia() {
        return this._inertia;
    }
    set inertia(i) {
        Util.assert(i > 0);
        this._inertia = i;
        this._invInertia = 1.0 / i;
    }
    get inverseInertia() {
        return this._invInertia;
    }
    get friction() {
        return this._friction;
    }
    set friction(f) {
        Util.assert(f > 0);
        this._friction = f;
    }
    get restitution() {
        return this._restitution;
    }
    set restitution(r) {
        Util.assert(r >= 0 && r <= 1.0);
        this._restitution = r;
    }
    get surfaceSpeed() {
        return this._surfaceSpeed;
    }
    set surfaceSpeed(s) {
        this._surfaceSpeed = s;
    }
    get linearVelocity() {
        return this._linearVelocity;
    }
    set linearVelocity(v) {
        this._linearVelocity = v.copy();
    }
    get angularVelocity() {
        return this._angularVelocity;
    }
    set angularVelocity(w) {
        this._angularVelocity = w;
    }
    get force() {
        return this._force;
    }
    set force(f) {
        this._force.x = f.x;
        this._force.y = f.y;
    }
    get torque() {
        return this._torque;
    }
    set torque(t) {
        this._torque = t;
    }
    awake() {
        if (this.type == Type.Static)
            return;
        this.resting = 0;
        this.sleeping = false;
    }
}
