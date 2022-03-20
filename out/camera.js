import { Entity } from "./entity.js";
export class Camera extends Entity {
    constructor() {
        super();
    }
    get transform() {
        return super.localToGlobal;
    }
    get cameraTransform() {
        return super.globalToLocal;
    }
    reset() {
        this.resetTransform();
    }
}
