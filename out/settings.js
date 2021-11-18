export var GenerationShape;
(function (GenerationShape) {
    GenerationShape[GenerationShape["Box"] = 0] = "Box";
    GenerationShape[GenerationShape["Circle"] = 1] = "Circle";
    GenerationShape[GenerationShape["Random"] = 2] = "Random";
})(GenerationShape || (GenerationShape = {}));
// Simulation settings
export const Settings = {
    fixedDeltaTime: 1 / 144.0,
    applyGravity: true,
    positionCorrection: true,
    impulseAccumulation: true,
    warmStarting: true,
    indicateCP: false,
    indicateCoM: false,
    showBoundingBox: false,
    numIterations: 15,
    newColliderSettings: {
        shape: GenerationShape.Box,
        mass: 2,
        size: 50
    },
    gravity: -10,
    penetrationSlop: 0.2,
    restitutionSlop: 1000,
    warmStartingThreshold: 0.2,
};
