import { Polygon } from "./polygon.js";
export class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    copy() {
        return new Vector2(this.x, this.y);
    }
    normalize() {
        const len = this.getLength();
        if (len != 0) {
            this.x /= len;
            this.y /= len;
        }
    }
    normalized() {
        const len = this.getLength();
        if (len != 0)
            return this.divS(len);
        else
            return this;
    }
    getLength() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }
    addV(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }
    subV(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }
    divS(v) {
        return new Vector2(this.x / v, this.y / v);
    }
    mulS(v) {
        return new Vector2(this.x * v, this.y * v);
    }
    equals(v) {
        return this.x == v.x && this.y == v.y;
    }
    unNaN() {
        if (isNaN(this.x) || isNaN(this.y)) {
            this.x = 0;
            this.y = 0;
        }
    }
}
export class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    copy() {
        return new Vector3(this.x, this.y, this.z);
    }
    normalize() {
        const len = this.getLength();
        this.x /= len;
        this.y /= len;
        this.z /= len;
    }
    normalized() {
        const len = this.getLength();
        if (len != 0)
            return this.divS(len);
        else
            return this;
    }
    getLength() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    cross(v) {
        return new Vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
    }
    add(v) {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }
    sub(v) {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }
    divS(v) {
        return new Vector3(this.x / v, this.y / v, this.z / v);
    }
    divXYZ(x, y, z) {
        return new Vector3(this.x / x, this.y / y, this.z / z);
    }
    mulS(v) {
        return new Vector3(this.x * v, this.y * v, this.z * v);
    }
    mulXYZ(x, y, z) {
        return new Vector3(this.x * x, this.y * y, this.z * z);
    }
    equals(v) {
        return this.x == v.x && this.y == v.y && this.z == v.z;
    }
    unNaN() {
        if (isNaN(this.x) || isNaN(this.y) || isNaN(this.z)) {
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }
    }
}
export class Matrix3 {
    constructor() {
        this.m00 = 1;
        this.m01 = 0;
        this.m02 = 0;
        this.m10 = 0;
        this.m11 = 1;
        this.m12 = 0;
        this.m20 = 0;
        this.m21 = 0;
        this.m22 = 1;
    }
    loadIdentity() {
        this.m00 = 1;
        this.m01 = 0;
        this.m02 = 0;
        this.m10 = 0;
        this.m11 = 1;
        this.m12 = 0;
        this.m20 = 0;
        this.m21 = 0;
        this.m22 = 1;
    }
    copy() {
        let res = new Matrix3();
        res.m00 = this.m00;
        res.m01 = this.m01;
        res.m02 = this.m02;
        res.m10 = this.m10;
        res.m11 = this.m11;
        res.m12 = this.m12;
        res.m20 = this.m20;
        res.m21 = this.m21;
        res.m22 = this.m22;
        return res;
    }
    mulMatrix(right) {
        let res = new Matrix3();
        res.m00 = this.m00 * right.m00 + this.m01 * right.m10 + this.m02 * right.m20;
        res.m01 = this.m00 * right.m01 + this.m01 * right.m11 + this.m02 * right.m21;
        res.m02 = this.m00 * right.m02 + this.m01 * right.m12 + this.m02 * right.m22;
        res.m10 = this.m10 * right.m00 + this.m11 * right.m10 + this.m12 * right.m20;
        res.m11 = this.m10 * right.m01 + this.m11 * right.m11 + this.m12 * right.m21;
        res.m12 = this.m10 * right.m02 + this.m11 * right.m12 + this.m12 * right.m22;
        res.m20 = this.m20 * right.m00 + this.m21 * right.m10 + this.m22 * right.m20;
        res.m21 = this.m20 * right.m01 + this.m21 * right.m11 + this.m22 * right.m21;
        res.m22 = this.m20 * right.m02 + this.m21 * right.m12 + this.m22 * right.m22;
        return res;
    }
    mulVector(right, z) {
        let res = new Vector2(0, 0);
        if (z == undefined)
            z = 1;
        res.x = this.m00 * right.x + this.m01 * right.y + this.m02 * z;
        res.y = this.m10 * right.x + this.m11 * right.y + this.m12 * z;
        return res;
    }
    mulVectors(right, z) {
        let res = [];
        for (let i = 0; i < right.length; i++)
            res.push(this.mulVector(right[i], 1));
        return res;
    }
    scale(x, y) {
        if (y == undefined)
            y = x;
        let scale = new Matrix3();
        scale.m00 = x;
        scale.m11 = y;
        return this.mulMatrix(scale);
    }
    rotate(r) {
        const sin = Math.sin(r);
        const cos = Math.cos(r);
        let res = new Matrix3();
        res.m00 = cos;
        res.m01 = -sin;
        res.m10 = sin;
        res.m11 = cos;
        return this.mulMatrix(res);
    }
    translate(x, y) {
        let res = new Matrix3();
        res.m02 = x;
        res.m12 = y;
        return this.mulMatrix(res);
    }
}
export class Matrix4 {
    constructor() {
        this.m00 = 1;
        this.m01 = 0;
        this.m02 = 0;
        this.m03 = 0;
        this.m10 = 0;
        this.m11 = 1;
        this.m12 = 0;
        this.m13 = 0;
        this.m20 = 0;
        this.m21 = 0;
        this.m22 = 1;
        this.m23 = 0;
        this.m30 = 0;
        this.m31 = 0;
        this.m32 = 0;
        this.m33 = 1;
    }
    loadIdentity() {
        this.m00 = 1;
        this.m01 = 0;
        this.m02 = 0;
        this.m03 = 0;
        this.m10 = 0;
        this.m11 = 1;
        this.m12 = 0;
        this.m13 = 0;
        this.m20 = 0;
        this.m21 = 0;
        this.m22 = 1;
        this.m23 = 0;
        this.m30 = 0;
        this.m31 = 0;
        this.m32 = 0;
        this.m33 = 1;
    }
    copy() {
        let res = new Matrix4();
        res.m00 = this.m00;
        res.m01 = this.m01;
        res.m02 = this.m02;
        res.m03 = this.m03;
        res.m10 = this.m10;
        res.m11 = this.m11;
        res.m12 = this.m12;
        res.m13 = this.m13;
        res.m20 = this.m20;
        res.m21 = this.m21;
        res.m22 = this.m22;
        res.m23 = this.m23;
        res.m20 = this.m30;
        res.m31 = this.m31;
        res.m32 = this.m32;
        res.m33 = this.m33;
        return res;
    }
    fromAxis(vx, vy, vz) {
        let res = new Matrix4();
        res.m00 = vx.x;
        res.m01 = vy.x;
        res.m02 = vz.x;
        res.m10 = vx.y;
        res.m11 = vy.y;
        res.m12 = vz.y;
        res.m20 = vx.z;
        res.m21 = vy.z;
        res.m22 = vz.z;
        return res;
    }
    mulMatrix(right) {
        let res = new Matrix4();
        res.m00 = this.m00 * right.m00 + this.m01 * right.m10 + this.m02 * right.m20 + this.m03 * right.m30;
        res.m01 = this.m00 * right.m01 + this.m01 * right.m11 + this.m02 * right.m21 + this.m03 * right.m31;
        res.m02 = this.m00 * right.m02 + this.m01 * right.m12 + this.m02 * right.m22 + this.m03 * right.m32;
        res.m03 = this.m00 * right.m03 + this.m01 * right.m13 + this.m02 * right.m23 + this.m03 * right.m33;
        res.m10 = this.m10 * right.m00 + this.m11 * right.m10 + this.m12 * right.m20 + this.m13 * right.m30;
        res.m11 = this.m10 * right.m01 + this.m11 * right.m11 + this.m12 * right.m21 + this.m13 * right.m31;
        res.m12 = this.m10 * right.m02 + this.m11 * right.m12 + this.m12 * right.m22 + this.m13 * right.m32;
        res.m13 = this.m10 * right.m03 + this.m11 * right.m13 + this.m12 * right.m23 + this.m13 * right.m33;
        res.m20 = this.m20 * right.m00 + this.m21 * right.m10 + this.m22 * right.m20 + this.m23 * right.m30;
        res.m21 = this.m20 * right.m01 + this.m21 * right.m11 + this.m22 * right.m21 + this.m23 * right.m31;
        res.m22 = this.m20 * right.m02 + this.m21 * right.m12 + this.m22 * right.m22 + this.m23 * right.m32;
        res.m23 = this.m20 * right.m03 + this.m21 * right.m13 + this.m22 * right.m23 + this.m23 * right.m33;
        res.m30 = this.m30 * right.m00 + this.m31 * right.m10 + this.m32 * right.m20 + this.m33 * right.m30;
        res.m31 = this.m30 * right.m01 + this.m31 * right.m11 + this.m32 * right.m21 + this.m33 * right.m31;
        res.m32 = this.m30 * right.m02 + this.m31 * right.m12 + this.m32 * right.m22 + this.m33 * right.m32;
        res.m33 = this.m30 * right.m03 + this.m31 * right.m13 + this.m32 * right.m23 + this.m33 * right.m33;
        return res;
    }
    mulVector(right, w) {
        let res = new Vector3(0, 0, 0);
        if (w == undefined)
            w = 1;
        res.x = this.m00 * right.x + this.m01 * right.y + this.m02 * right.z + this.m03 * w;
        res.y = this.m10 * right.x + this.m11 * right.y + this.m12 * right.z + this.m13 * w;
        res.z = this.m20 * right.x + this.m21 * right.y + this.m22 * right.z + this.m23 * w;
        return res;
    }
    mulVectors(right, z) {
        let res = [];
        for (let i = 0; i < right.length; i++)
            res.push(this.mulVector(right[i], 1));
        return res;
    }
    scale(x, y, z) {
        if (y == undefined && z == undefined) {
            y = x;
            z = x;
        }
        let scale = new Matrix4();
        scale.m00 = x;
        scale.m11 = y;
        scale.m22 = z;
        return this.mulMatrix(scale);
    }
    rotate(x, y, z) {
        const sinX = Math.sin(x);
        const cosX = Math.cos(x);
        const sinY = Math.sin(y);
        const cosY = Math.cos(y);
        const sinZ = Math.sin(z);
        const cosZ = Math.cos(z);
        let res = new Matrix4();
        res.m00 = cosY * cosZ;
        res.m01 = -cosY * sinZ;
        res.m02 = sinY;
        res.m03 = 0;
        res.m10 = sinX * sinY * cosZ + cosX * sinZ;
        res.m11 = -sinX * sinY * sinZ + cosX * cosZ;
        res.m12 = -sinX * cosY;
        res.m13 = 0;
        res.m20 = -cosX * sinY * cosZ + sinX * sinZ;
        res.m21 = cosX * sinY * sinZ + sinX * cosZ;
        res.m22 = cosX * cosY;
        res.m23 = 0;
        res.m30 = 0;
        res.m31 = 0;
        res.m32 = 0;
        res.m33 = 1;
        return this.mulMatrix(res);
    }
    translate(x, y, z) {
        let res = new Matrix4();
        res.m03 = x;
        res.m13 = y;
        res.m23 = z;
        return this.mulMatrix(res);
    }
}
export function createCameraMatrix() {
}
export function subPolygon(p1, p2) {
    let res = [];
    for (let i = 0; i < p1.count; i++) {
        let p1v = p1.localToGlobal().mulVector(p1.vertices[i], 1);
        for (let j = 0; j < p2.count; j++) {
            let p2v = p2.localToGlobal().mulVector(p2.vertices[j], 1);
            res.push(p1v.subV(p2v));
        }
    }
    return new Polygon(res, false);
}
// Returns the fardest vertex in the 'dir' direction
export function support(vertices, dir) {
    let idx = 0;
    let maxValue = dir.dot(vertices[idx]);
    for (let i = 1; i < vertices.length; i++) {
        let value = dir.dot(vertices[i]);
        if (value > maxValue) {
            idx = i;
            maxValue = value;
        }
    }
    return vertices[idx];
}
export function csoSupport(p1, p2, dir) {
    const localDirP1 = p1.globalToLocal().mulVector(dir, 0);
    const localDirP2 = p2.globalToLocal().mulVector(dir.mulS(-1), 0);
    let supportP1 = support(p1.vertices, localDirP1);
    let supportP2 = support(p2.vertices, localDirP2);
    supportP1 = p1.localToGlobal().mulVector(supportP1, 1);
    supportP2 = p2.localToGlobal().mulVector(supportP2, 1);
    return supportP1.subV(supportP2);
}
export function gjk(q, p1, p2) {
}
