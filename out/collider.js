import { Entity } from "./entity.js";
import { Vector2 } from "./math.js";
export var Type;
(function (Type) {
    Type[Type["Circle"] = 0] = "Circle";
    Type[Type["Polygon"] = 1] = "Polygon";
})(Type || (Type = {}));
export class Collider extends Entity {
    constructor(type, name = "") {
        super();
        this.type = type;
        this._velocity = new Vector2(0, 0);
        this._angularVelocity = 0;
        this.name = name;
    }
    update(delta) {
        this._translation.x += this._velocity.x * delta;
        this._translation.y += this._velocity.y * delta;
        this._rotation += this._angularVelocity * delta;
    }
    setVelocity(v) {
        this._velocity.x = v.x;
        this._velocity.y = v.y;
    }
    addVelocity(vt) {
        this._velocity.x += vt.x;
        this._velocity.y += vt.y;
    }
    setAngularVelocity(w) {
        this._angularVelocity = w;
    }
    addAngularVelocity(wt) {
        this._angularVelocity += wt;
    }
}
