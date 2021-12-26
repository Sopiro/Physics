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
        switch (this.type) {
            case Type.Static:
                this._mass = Number.MAX_VALUE;
                this._invMass = 0;
                this._inertia = Number.MAX_VALUE;
                this._invInertia = 0;
                this.sleeping = true;
                break;
            case Type.Dynamic:
                this._mass = Settings.defaultMass;
                this._invMass = 1 / this._mass;
                this._inertia = Util.calculateBoxInertia(Settings.defaultSize, Settings.defaultSize, Settings.defaultMass);
                this._invInertia = 1 / this._inertia;
                break;
        }
    }
    get mass() {
        return this._mass;
    }
    set mass(m) {
        this._mass = Util.clamp(m, 0, Number.MAX_VALUE);
        this._invMass = this._mass == 0 ? 0 : 1.0 / this._mass;
    }
    get inverseMass() {
        return this._invMass;
    }
    get inertia() {
        return this._inertia;
    }
    set inertia(i) {
        this._inertia = Util.clamp(i, 0, Number.MAX_VALUE);
        this._invInertia = this._inertia == Number.MAX_VALUE ? 0 : 1.0 / this._inertia;
    }
    get inverseInertia() {
        return this._invInertia;
    }
    get friction() {
        return this._friction;
    }
    set friction(f) {
        this._friction = Util.clamp(f, 0.0, Number.MAX_VALUE);
    }
    get restitution() {
        return this._restitution;
    }
    set restitution(r) {
        this._restitution = Util.clamp(r, 0.0, 1.0);
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
