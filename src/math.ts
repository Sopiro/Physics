import * as Util from "./util.js";

export class Vector2
{
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0)
    {
        this.x = x;
        this.y = y;
    }

    clear(): void
    {
        this.x = 0;
        this.y = 0;
    }

    copy(): Vector2
    {
        return new Vector2(this.x, this.y);
    }

    fix(limit = 1e-13): void
    {
        this.x = Util.toFixed(this.x, limit);
        this.y = Util.toFixed(this.y, limit);
    }

    fixed(limit = 1e-13): Vector2
    {
        return new Vector2(Util.toFixed(this.x, limit), Util.toFixed(this.y, limit));
    }

    invert(): void
    {
        this.x *= -1;
        this.y *= -1;
    }

    inverted(): Vector2
    {
        return new Vector2(this.x * -1, this.y * -1);
    }

    normalize(): void
    {
        const len = this.length;

        if (len != 0)
        {
            this.x /= len;
            this.y /= len;
        }
    }

    normalized(): Vector2
    {
        const len = this.length;

        if (len != 0)
            return this.div(len);
        else
            return this;
    }

    get squaredLength(): number
    {
        return this.x * this.x + this.y * this.y;
    }

    get length(): number
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    dot(v: Vector2): number
    {
        return this.x * v.x + this.y * v.y;
    }

    cross(v: Vector2): number
    {
        return this.x * v.y - this.y * v.x;
    }

    add(v: Vector2): Vector2
    {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    sub(v: Vector2): Vector2
    {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    div(v: number): Vector2
    {
        return new Vector2(this.x / v, this.y / v);
    }

    mul(v: number): Vector2
    {
        return new Vector2(this.x * v, this.y * v);
    }

    equals(v: Vector2): boolean
    {
        return this.x == v.x && this.y == v.y;
    }

    to(v: Vector2): Vector2
    {
        return v.sub(this);
    }

    unNaN(): void
    {
        if (isNaN(this.x) || isNaN(this.y))
        {
            this.x = 0;
            this.y = 0;
        }
    }
}

export class Vector3
{
    x: number;
    y: number;
    z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    clear(): void
    {
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }

    copy(): Vector3
    {
        return new Vector3(this.x, this.y, this.z);
    }

    fix(limit = 1e-13): void
    {
        this.x = Util.toFixed(this.x, limit);
        this.y = Util.toFixed(this.y, limit);
        this.z = Util.toFixed(this.z, limit);
    }

    fixed(limit = 1e-13): Vector3
    {
        return new Vector3(Util.toFixed(this.x, limit), Util.toFixed(this.y, limit), Util.toFixed(this.z, limit));
    }

    normalize(): void
    {
        const len = this.length;

        this.x /= len;
        this.y /= len;
        this.z /= len;
    }

    normalized(): Vector3
    {
        const len = this.length;

        if (len != 0)
            return this.div(len);
        else
            return this;
    }

    invert(): void
    {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
    }

    inverted(): Vector3
    {
        return new Vector3(this.x * -1, this.y * -1, this.z * -1);
    }

    get length(): number
    {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    dot(v: Vector3): number
    {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v: Vector3): Vector3
    {
        return new Vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
    }

    add(v: Vector3): Vector3
    {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    sub(v: Vector3): Vector3
    {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    div(s: number): Vector3
    {
        return new Vector3(this.x / s, this.y / s, this.z / s);
    }

    divXYZ(x: number, y: number, z: number): Vector3
    {
        return new Vector3(this.x / x, this.y / y, this.z / z);
    }

    mul(s: number): Vector3
    {
        return new Vector3(this.x * s, this.y * s, this.z * s);
    }

    mulXYZ(x: number, y: number, z: number): Vector3
    {
        return new Vector3(this.x * x, this.y * y, this.z * z);
    }

    equals(v: Vector3): boolean
    {
        return this.x == v.x && this.y == v.y && this.z == v.z;
    }

    to(v: Vector3): Vector3
    {
        return v.sub(this);
    }

    unNaN(): void
    {
        if (isNaN(this.x) || isNaN(this.y) || isNaN(this.z))
        {
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }
    }
}

export class Vector4
{
    x: number;
    y: number;
    z: number;
    w: number;

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0)
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    clear(): void
    {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 0;
    }

    copy(): Vector4
    {
        return new Vector4(this.x, this.y, this.z, this.w);
    }

    toFixed(limit = 1e-13): void
    {
        this.x = Util.toFixed(this.x, limit);
        this.y = Util.toFixed(this.y, limit);
        this.z = Util.toFixed(this.z, limit);
        this.w = Util.toFixed(this.w, limit);
    }

    fixed(): Vector4
    {
        return new Vector4(Math.round(this.x * 1e9) / 1e9, Math.round(this.y * 1e9) / 1e9, Math.round(this.z * 1e9) / 1e9, Math.round(this.w * 1e9) / 1e9);
    }

    normalize(): void
    {
        const len = this.length;

        this.x /= len;
        this.y /= len;
        this.z /= len;
        this.w /= len;
    }

    normalized(): Vector4
    {
        const len = this.length;

        if (len != 0)
            return this.div(len);
        else
            return this;
    }

    invert(): void
    {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        this.w *= -1;
    }

    inverted(): Vector4
    {
        return new Vector4(this.x * -1, this.y * -1, this.z * -1, this.w * -1);
    }

    get length(): number
    {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    dot(v: Vector4): number
    {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    }

    add(v: Vector4): Vector4
    {
        return new Vector4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
    }

    sub(v: Vector4): Vector4
    {
        return new Vector4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
    }

    div(s: number): Vector4
    {
        return new Vector4(this.x / s, this.y / s, this.z / s, this.w / s);
    }

    divXYZW(x: number, y: number, z: number, w: number): Vector4
    {
        return new Vector4(this.x / x, this.y / y, this.z / z, this.w / w);
    }

    mul(s: number): Vector4
    {
        return new Vector4(this.x * s, this.y * s, this.z * s, this.w * s);
    }

    mulXYZW(x: number, y: number, z: number, w: number): Vector4
    {
        return new Vector4(this.x * x, this.y * y, this.z * z, this.w * w);
    }

    equals(v: Vector4): boolean
    {
        return this.x == v.x && this.y == v.y && this.z == v.z && this.w == v.w;
    }

    unNaN(): void
    {
        if (isNaN(this.x) || isNaN(this.y) || isNaN(this.z) || isNaN(this.w))
        {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 0;
        }
    }
}

export class Matrix2
{
    m00: number; m01: number;
    m10: number; m11: number;

    constructor()
    {
        this.m00 = 1; this.m01 = 0;
        this.m10 = 0; this.m11 = 1;
    }

    loadIdentity(): void
    {
        this.m00 = 1; this.m01 = 0;
        this.m10 = 0; this.m11 = 1;
    }

    copy(): Matrix2
    {
        let res = new Matrix2();

        res.m00 = this.m00; res.m01 = this.m01;
        res.m10 = this.m10; res.m11 = this.m11;

        return res;
    }

    mulMatrix(right: Matrix2): Matrix2
    {
        let res = new Matrix2();

        res.m00 = this.m00 * right.m00 + this.m01 * right.m10;
        res.m01 = this.m00 * right.m01 + this.m01 * right.m11;

        res.m10 = this.m10 * right.m00 + this.m11 * right.m10;
        res.m11 = this.m10 * right.m01 + this.m11 * right.m11;

        return res;
    }

    mulVector(right: Vector2): Vector2
    {
        let res = new Vector2(0, 0);

        res.x = this.m00 * right.x + this.m01 * right.y;
        res.y = this.m10 * right.x + this.m11 * right.y;

        return res;
    }

    rotate(r: number): Matrix2
    {
        const sin = Math.sin(r);
        const cos = Math.cos(r);

        let res = new Matrix2();

        res.m00 = cos;
        res.m01 = -sin;
        res.m10 = sin;
        res.m11 = cos;

        return this.mulMatrix(res);
    }

    transpose(): Matrix2
    {
        let res = new Matrix2();
        res.m00 = this.m00;
        res.m01 = this.m10;
        res.m10 = this.m01;
        res.m11 = this.m11;

        return res;
    }

    get determinant(): number
    {
        return this.m00 * this.m11 - this.m01 * this.m10;
    }

    inverted(): Matrix2
    {
        let res = new Matrix2();
        let det = this.determinant;

        if (det == 0) throw "Determinant 0";

        det = 1.0 / det;
        res.m00 = det * this.m11;
        res.m01 = -det * this.m01;
        res.m10 = -det * this.m10;
        res.m11 = det * this.m00;

        return res;
    }

    addMatrix(m: Matrix2): Matrix2
    {
        let res = new Matrix2();

        res.m00 = this.m00 + m.m00;
        res.m01 = this.m01 + m.m01;
        res.m10 = this.m10 + m.m10;
        res.m11 = this.m11 + m.m11;

        return res;
    }
}

export class Matrix3
{
    m00: number; m01: number; m02: number;
    m10: number; m11: number; m12: number;
    m20: number; m21: number; m22: number;

    constructor()
    {
        this.m00 = 1; this.m01 = 0; this.m02 = 0;
        this.m10 = 0; this.m11 = 1; this.m12 = 0;
        this.m20 = 0; this.m21 = 0; this.m22 = 1;
    }

    loadIdentity(): void
    {
        this.m00 = 1; this.m01 = 0; this.m02 = 0;
        this.m10 = 0; this.m11 = 1; this.m12 = 0;
        this.m20 = 0; this.m21 = 0; this.m22 = 1;
    }

    copy(): Matrix3
    {
        let res = new Matrix3();

        res.m00 = this.m00; res.m01 = this.m01; res.m02 = this.m02;
        res.m10 = this.m10; res.m11 = this.m11; res.m12 = this.m12;
        res.m20 = this.m20; res.m21 = this.m21; res.m22 = this.m22;

        return res;
    }

    mulMatrix(right: Matrix3): Matrix3
    {
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

    mulVector2(right: Vector2, z: number): Vector2
    {
        let res = new Vector2(0, 0);

        res.x = this.m00 * right.x + this.m01 * right.y + this.m02 * z;
        res.y = this.m10 * right.x + this.m11 * right.y + this.m12 * z;

        return res;
    }

    mulVector3(right: Vector3): Vector3
    {
        let res = new Vector3(0, 0, 0);

        res.x = this.m00 * right.x + this.m01 * right.y + this.m02 * right.z;
        res.y = this.m10 * right.x + this.m11 * right.y + this.m12 * right.z;
        res.z = this.m20 * right.x + this.m21 * right.y + this.m22 * right.z;

        return res;
    }

    scale(x: number, y: number): Matrix3
    {
        let scale = new Matrix3();
        scale.m00 = x;
        scale.m11 = y;

        return this.mulMatrix(scale);
    }

    rotate(r: number): Matrix3
    {
        const sin = Math.sin(r);
        const cos = Math.cos(r);

        let res = new Matrix3();

        res.m00 = cos;
        res.m01 = -sin;
        res.m10 = sin;
        res.m11 = cos;

        return this.mulMatrix(res);
    }

    translate(x: number, y: number): Matrix3
    {
        let res = new Matrix3();

        res.m02 = x;
        res.m12 = y;

        return this.mulMatrix(res);
    }

    inverted(): Matrix3
    {
        let res = new Matrix3();

        let det =
            this.m00 * (this.m11 * this.m22 - this.m21 * this.m12) -
            this.m01 * (this.m10 * this.m22 - this.m12 * this.m20) +
            this.m02 * (this.m10 * this.m21 - this.m11 * this.m20);

        if (det == 0) throw "Determinant 0";
        let inv_det = 1.0 / det;

        res.m00 = (this.m11 * this.m22 - this.m21 * this.m12) * inv_det;
        res.m01 = (this.m02 * this.m21 - this.m01 * this.m22) * inv_det;
        res.m02 = (this.m01 * this.m12 - this.m02 * this.m11) * inv_det;
        res.m10 = (this.m12 * this.m20 - this.m10 * this.m22) * inv_det;
        res.m11 = (this.m00 * this.m22 - this.m02 * this.m20) * inv_det;
        res.m12 = (this.m10 * this.m02 - this.m00 * this.m12) * inv_det;
        res.m20 = (this.m10 * this.m21 - this.m20 * this.m11) * inv_det;
        res.m21 = (this.m20 * this.m01 - this.m00 * this.m21) * inv_det;
        res.m22 = (this.m00 * this.m11 - this.m10 * this.m01) * inv_det;

        return res;
    }
}

export class Matrix4
{
    m00: number; m01: number; m02: number; m03: number;
    m10: number; m11: number; m12: number; m13: number;
    m20: number; m21: number; m22: number; m23: number;
    m30: number; m31: number; m32: number; m33: number;

    constructor()
    {
        this.m00 = 1; this.m01 = 0; this.m02 = 0; this.m03 = 0;
        this.m10 = 0; this.m11 = 1; this.m12 = 0; this.m13 = 0;
        this.m20 = 0; this.m21 = 0; this.m22 = 1; this.m23 = 0;
        this.m30 = 0; this.m31 = 0; this.m32 = 0; this.m33 = 1;
    }

    loadIdentity(): void
    {
        this.m00 = 1; this.m01 = 0; this.m02 = 0; this.m03 = 0;
        this.m10 = 0; this.m11 = 1; this.m12 = 0; this.m13 = 0;
        this.m20 = 0; this.m21 = 0; this.m22 = 1; this.m23 = 0;
        this.m30 = 0; this.m31 = 0; this.m32 = 0; this.m33 = 1;
    }

    copy(): Matrix4
    {
        let res = new Matrix4();

        res.m00 = this.m00; res.m01 = this.m01; res.m02 = this.m02; res.m03 = this.m03;
        res.m10 = this.m10; res.m11 = this.m11; res.m12 = this.m12; res.m13 = this.m13;
        res.m20 = this.m20; res.m21 = this.m21; res.m22 = this.m22; res.m23 = this.m23;
        res.m20 = this.m30; res.m31 = this.m31; res.m32 = this.m32; res.m33 = this.m33;

        return res;
    }

    fromAxis(vx: Vector3, vy: Vector3, vz: Vector3): Matrix4
    {
        let res = new Matrix4();

        res.m00 = vx.x; res.m01 = vy.x; res.m02 = vz.x;
        res.m10 = vx.y; res.m11 = vy.y; res.m12 = vz.y;
        res.m20 = vx.z; res.m21 = vy.z; res.m22 = vz.z;

        return res;
    }

    mulMatrix(right: Matrix4): Matrix4
    {
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

    mulVector(right: Vector3, w: number): Vector3
    {
        let res = new Vector3(0, 0, 0);

        if (w == undefined) w = 1;

        res.x = this.m00 * right.x + this.m01 * right.y + this.m02 * right.z + this.m03 * w;
        res.y = this.m10 * right.x + this.m11 * right.y + this.m12 * right.z + this.m13 * w;
        res.z = this.m20 * right.x + this.m21 * right.y + this.m22 * right.z + this.m23 * w;

        return res;
    }

    scale(x: number, y: number = x, z: number = x): Matrix4
    {
        let scale = new Matrix4();
        scale.m00 = x;
        scale.m11 = y;
        scale.m22 = z;

        return this.mulMatrix(scale);
    }

    rotate(x: number, y: number, z: number): Matrix4
    {
        const sinX = Math.sin(x);
        const cosX = Math.cos(x);
        const sinY = Math.sin(y);
        const cosY = Math.cos(y);
        const sinZ = Math.sin(z);
        const cosZ = Math.cos(z);

        let res = new Matrix4();

        res.m00 = cosY * cosZ; res.m01 = -cosY * sinZ; res.m02 = sinY; res.m03 = 0;
        res.m10 = sinX * sinY * cosZ + cosX * sinZ; res.m11 = -sinX * sinY * sinZ + cosX * cosZ; res.m12 = -sinX * cosY; res.m13 = 0;
        res.m20 = -cosX * sinY * cosZ + sinX * sinZ; res.m21 = cosX * sinY * sinZ + sinX * cosZ; res.m22 = cosX * cosY; res.m23 = 0;
        res.m30 = 0; res.m31 = 0; res.m32 = 0; res.m33 = 1;

        return this.mulMatrix(res);
    }

    translate(x: number, y: number, z: number): Matrix4
    {
        let res = new Matrix4();

        res.m03 = x;
        res.m13 = y;
        res.m23 = z;

        return this.mulMatrix(res);
    }
}
