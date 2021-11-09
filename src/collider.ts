import { Entity } from "./entity.js";

export enum Type
{
    Circle = 0,
    Polygon
}

export class Collider extends Entity
{
    public readonly shape: Type;

    constructor(type: Type)
    {
        super();
        this.shape = type;
    }
}