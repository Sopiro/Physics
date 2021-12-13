import { Matrix3, Vector2 } from "./math.js";
export class Entity {
    constructor() {
        this._position = new Vector2(0, 0);
        this._rotation = 0;
        this._scale = new Vector2(1, 1);
    }
    get position() {
        return this._position;
    }
    set position(p) {
        this._position.x = p.x;
        this._position.y = p.y;
    }
    get rotation() {
        return this._rotation;
    }
    set rotation(r) {
        this._rotation = r;
    }
    get scale() {
        return this._scale;
    }
    set scale(s) {
        this._scale.x = s.x;
        this._scale.y = s.y;
    }
    resetTransform() {
        this._position.clear();
        this._rotation = 0;
        this._scale = new Vector2(1, 1);
    }
    translate(t) {
        this._position.x += t.x;
        this._position.y += t.y;
    }
    rotate(r) {
        this._rotation += r;
    }
    doScale(s) {
        this._scale.x *= s.x;
        this._scale.y *= s.y;
    }
    // Returns local to global transform
    get localToGlobal() {
        return new Matrix3()
            .translate(this._position.x, this._position.y)
            .rotate(this._rotation)
            .scale(this._scale.x, this._scale.y);
    }
    // Returns global to local transform
    get globalToLocal() {
        return new Matrix3()
            .scale(1.0 / this._scale.x, 1.0 / this._scale.y)
            .rotate(-this._rotation)
            .translate(-this._position.x, -this._position.y);
    }
}
