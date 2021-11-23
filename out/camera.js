import { Entity } from "./entity.js";
export class Camera extends Entity {
    constructor() {
        super();
    }
    getTransform() {
        return super.localToGlobal;
    }
    getCameraTransform() {
        return super.globalToLocal;
    }
}
