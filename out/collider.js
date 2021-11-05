import { Entity } from "./entity.js";
import { Vector2 } from "./math.js";
export var Type;
(function (Type) {
    Type[Type["Circle"] = 0] = "Circle";
    Type[Type["Polygon"] = 1] = "Polygon";
})(Type || (Type = {}));
// Rigid body collider
export class Collider extends Entity {
    constructor(type, name = "") {
        super();
        this.type = type;
        this._linearVelocity = new Vector2(0, 0);
        this._angularVelocity = 0;
        this._friction = 0.7;
        this._beta = 0.5;
        this._restitution = 0.7;
        this.name = name;
    }
    get mass() {
        return this._mass;
    }
    set mass(m) {
        this._mass = m;
        this._invMass = 1.0 / this._mass;
    }
    get inverseMass() {
        return this._invMass;
    }
    get inertia() {
        return this._inertia;
    }
    set inertia(i) {
        this._inertia = i;
        this._invInertia = 1.0 / i;
    }
    get inverseInertia() {
        return this._invInertia;
    }
    get centerOfMass() {
        return this._cm;
    }
    get friction() {
        return this._friction;
    }
    get contactBeta() {
        return this._beta;
    }
    get restitution() {
        return this._restitution;
    }
    get linearVelocity() {
        return this._linearVelocity;
    }
    set linearVelocity(v) {
        this._linearVelocity.x = v.x;
        this._linearVelocity.y = v.y;
    }
    get angularVelocity() {
        return this._angularVelocity;
    }
    set angularVelocity(w) {
        this._angularVelocity = w;
    }
    update(delta) {
        this._position.x += this._linearVelocity.x * delta;
        this._position.y += this._linearVelocity.y * delta;
        this._rotation += this._angularVelocity * delta;
    }
    addVelocity(vt) {
        this._linearVelocity.x += vt.x;
        this._linearVelocity.y += vt.y;
    }
    addAngularVelocity(wt) {
        this._angularVelocity += wt;
    }
}
