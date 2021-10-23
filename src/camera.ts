import { Entity } from "./entity.js";
import { Matrix3 } from "./math.js";

export class Camera extends Entity
{
    constructor()
    {
        super();
    }

    getTransform(): Matrix3
    {
        return super.localToGlobal();
    }

    getCameraTransform(): Matrix3
    {
        return super.globalToLocal();
    }
}