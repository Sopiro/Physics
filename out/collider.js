import { Entity } from "./entity.js";
export var Type;
(function (Type) {
    Type[Type["Circle"] = 0] = "Circle";
    Type[Type["Polygon"] = 1] = "Polygon";
})(Type || (Type = {}));
export class Collider extends Entity {
    constructor(type) {
        super();
        this.shape = type;
    }
}
