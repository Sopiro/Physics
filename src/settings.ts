export enum GenerationShape
{
    Box = 0,
    Circle,
    Random
}

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
    numIterations: 15, // Number of resolution iterations
    newColliderSettings: {
        shape: GenerationShape.Box,
        mass: 2,
        size: 50
    },
    gravity: -10,
    penetrationSlop: 0.2,
    restitutionSlop: 1000, // This has to be greater than (gravity * delta)
    warmStartingThreshold: 0.2,
}