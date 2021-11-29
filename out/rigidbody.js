import { Entity } from "./entity.js";
import { Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";
export var Type;
(function (Type) {
    Type[Type["Ground"] = 0] = "Ground";
    Type[Type["Normal"] = 1] = "Normal";
})(Type || (Type = {}));
export class RigidBody extends Entity {
    constructor(type, friction = 0.7, restitution = 0.001) {
        super();
        this._force = new Vector2(0, 0);
        this._torque = 0;
        this.id = -1;
        this._linearVelocity = new Vector2(0, 0);
        this._angularVelocity = 0;
        this._cm = new Vector2(0, 0);
        this._friction = friction;
        this._restitution = restitution;
        this.type = type;
        switch (this.type) {
            case Type.Ground:
                this._mass = Number.MAX_VALUE;
                this._invMass = 0;
                this._inertia = Number.MAX_VALUE;
                this._invInertia = 0;
                break;
            case Type.Normal:
                this._mass = Settings.newBodySettings.mass;
                this._invMass = 1 / this._mass;
                this._inertia = Util.calculateCircleInertia(Settings.newBodySettings.size, this.mass);
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
    get centerOfMass() {
        return this._cm;
    }
    set centerOfMass(cm) {
        this._cm = cm.copy();
    }
    get friction() {
        return this._friction;
    }
    set friction(f) {
        this._friction = Util.clamp(f, 0, Number.MAX_VALUE);
    }
    get restitution() {
        return this._restitution;
    }
    set restitution(r) {
        this._restitution = Util.clamp(r, 0, 1);
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
        this._force = f.copy();
    }
    get torque() {
        return this._torque;
    }
    set torque(t) {
        this._torque = t;
    }
    addForce(f) {
        this._force = this._force.addV(f);
    }
    addTorque(t) {
        this._torque += t;
    }
    addVelocity(vt) {
        this._linearVelocity.x += vt.x;
        this._linearVelocity.y += vt.y;
    }
    addAngularVelocity(wt) {
        this._angularVelocity += wt;
    }
}
