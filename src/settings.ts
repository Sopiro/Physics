import { gWorld } from "./game.js";
import * as Util from "./util.js";

export enum GenerationShape
{
    Box = 0,
    Circle,
    Regular,
    Random
}

export enum MouseMode
{
    Grab = 0,
    Force
}

const frequencyRange: Util.Pair<number, number> = { p1: 10, p2: 240 };
const iterationRange: Util.Pair<number, number> = { p1: 1, p2: 50 };
const densityRange: Util.Pair<number, number> = { p1: 1, p2: 100 };
const sizeRange: Util.Pair<number, number> = { p1: 0.1, p2: 3 };
const gravityForceRange: Util.Pair<number, number> = { p1: -20, p2: 20 };
const frictionRange: Util.Pair<number, number> = { p1: 0, p2: 1 };
const restitutionRange: Util.Pair<number, number> = { p1: 0, p2: 1 };
const numVerticesRange: Util.Pair<number, number> = { p1: 2.9, p2: 17 };
const strengthRange: Util.Pair<number, number> = { p1: 0.2, p2: 2.0 };

// Simulation settings
export const Settings = {
    width: 1280,
    height: 720,
    clipWidth: 12.8,
    clipHeight: 7.2,
    paused: false,
    frequency: 60,
    dt: 1.0 / 60.0, // delta time
    inv_dt: 60.0,
    GJK_MAX_ITERATION: 20,
    GJK_TOLERANCE: 1e-13 * 1e-13,
    EPA_MAX_ITERATION: 20,
    EPA_TOLERANCE: 1e-13,
    applyGravity: true,
    positionCorrection: true,
    impulseAccumulation: true,
    warmStarting: true,
    indicateCP: false,
    indicateCoM: false,
    showBoundingBox: false,
    showContactLink: false,
    mode: MouseMode.Grab,
    mouseStrength: 1.5,
    numIterations: 10, // Number of resolution(sequential impulses) iterations
    newBodySettings:
    {
        shape: GenerationShape.Box,
        density: 8,
        size: 0.5,
        friction: 0.7,
        restitution: 0.0,
        numVertices: Math.trunc(Util.random(3.0, 18.0)),
    },
    gravity: -10,
    gravityScale: 0.25,
    penetrationSlop: 0.005,
    restitutionSlop: 0.5, // This has to be greater than (gravity * gravityScale * deltaTime)
    positionCorrectionBeta: 0.2,
    warmStartingThreshold: 0.005 * 0.005,
    deadBottom: -10.0,
    resetCamera: true,
    grabCenter: false,
    showInfo: false,
    randomConvexMaxVertices: 8,
    regularPolygonMaxVertices: 11,
    defaultDensity: 12.5,
    defaultFriction: 0.7,
    defaultRestitution: 0.0,
    blockSolve: true,
    colorizeBody: false,
    colorizeIsland: false,
    restLinearTolerance: 0.005 * 0.005,
    restAngularTolerance: (0.5 * Math.PI / 180.0) * (0.5 * Math.PI / 180.0),
    sleepingWait: 0.5,
    colorizeActiveBody: true,
    sleepEnabled: true,
    applyWarmStartingThreshold: true,
    showProfile: false,
    visualizeAABBTree: false,
}

// Remove the default pop-up context menu
let cvs = document.querySelector("#canvas") as HTMLCanvasElement;
cvs.oncontextmenu = (e) =>
{
    e.preventDefault();
    e.stopPropagation();
}

const pause = document.querySelector("#pause")! as HTMLInputElement;
pause.checked = Settings.paused;
pause.addEventListener("click", () => { Settings.paused = !Settings.paused; });

const applyGravity = document.querySelector("#gravity")! as HTMLInputElement;
applyGravity.checked = Settings.applyGravity;
applyGravity.addEventListener("click", () =>
{
    gWorld.surprise();
    Settings.applyGravity = applyGravity.checked;
});


const correction = document.querySelector("#correction")! as HTMLInputElement;
correction.checked = Settings.positionCorrection;
correction.addEventListener("click", () => { Settings.positionCorrection = correction.checked; });

const accumulation = document.querySelector("#accumulation")! as HTMLInputElement;
accumulation.checked = Settings.impulseAccumulation;
accumulation.addEventListener("click", () => { Settings.impulseAccumulation = accumulation.checked; });

const warmStarting = document.querySelector("#warmstarting")! as HTMLInputElement;
warmStarting.checked = Settings.warmStarting;
warmStarting.addEventListener("click", () => { Settings.warmStarting = warmStarting.checked; });

const blockSolve = document.querySelector("#blockSolve")! as HTMLInputElement;
blockSolve.checked = Settings.blockSolve;
blockSolve.addEventListener("click", () => { Settings.blockSolve = blockSolve.checked; });

const indicateCoM = document.querySelector("#indicateCoM")! as HTMLInputElement;
indicateCoM.checked = Settings.indicateCoM;
indicateCoM.addEventListener("click", () => { Settings.indicateCoM = indicateCoM.checked; });

const indicateContact = document.querySelector("#indicateContact")! as HTMLInputElement;
indicateContact.checked = Settings.indicateCP;
indicateContact.addEventListener("click", () => { Settings.indicateCP = indicateContact.checked; });

const showBB = document.querySelector("#showBB")! as HTMLInputElement;
showBB.checked = Settings.showBoundingBox;
showBB.addEventListener("click", () => { Settings.showBoundingBox = showBB.checked; });

let modeRadios = document.querySelectorAll('input[name="modeRadios"]');
for (var i = 0; i < 2; i++)
{
    let me = modeRadios[i] as HTMLInputElement;
    me.addEventListener('change', () =>
    {
        let index = Number(me.value);
        Settings.mode = index;
    });
}

const strength = document.querySelector("#strength")! as HTMLInputElement;
strength.value = String(Util.map(Settings.mouseStrength, strengthRange.p1, strengthRange.p2, 0, 100));
const strengthLabel = document.querySelector("#strength_label")! as HTMLLabelElement;
strengthLabel.innerHTML = String(Settings.mouseStrength);
strength.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(strength.value), 0, 100, strengthRange.p1, strengthRange.p2);
    mappedValue = Number(mappedValue.toFixed(2));
    strengthLabel.innerHTML = String(mappedValue);

    updateSetting("strength", mappedValue);
});

const frequency = document.querySelector("#frequency")! as HTMLInputElement;
frequency.value = String(Util.map(Settings.frequency, frequencyRange.p1, frequencyRange.p2, 0, 100));
const frequencyLabel = document.querySelector("#frequency_label")! as HTMLLabelElement;
frequencyLabel.innerHTML = String(Settings.frequency) + "Hz";
frequency.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(frequency.value), 0, 100, frequencyRange.p1, frequencyRange.p2);
    mappedValue = Math.trunc(mappedValue);
    frequencyLabel.innerHTML = String(mappedValue) + "Hz";

    updateSetting("frequency", mappedValue);
});

const iteration = document.querySelector("#iteration")! as HTMLInputElement;
iteration.value = String(Util.map(Settings.numIterations, iterationRange.p1, iterationRange.p2, 0, 100));
const iterationLabel = document.querySelector("#iteration_label")! as HTMLLabelElement;
iterationLabel.innerHTML = String(Settings.numIterations);
iteration.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(iteration.value), 0, 100, iterationRange.p1, iterationRange.p2);
    mappedValue = Math.trunc(mappedValue);
    iterationLabel.innerHTML = String(mappedValue);

    updateSetting("iteration", mappedValue);
});

let vertices_div = document.querySelector("#vertices_div")! as HTMLDivElement;

let shapeRadios = document.querySelectorAll('input[name="shapeRadios"]');
for (var i = 0; i < 4; i++)
{
    let me = shapeRadios[i] as HTMLInputElement;
    me.addEventListener('change', () =>
    {
        let index = Number(me.value);
        Settings.newBodySettings.shape = index;
        vertices_div.hidden = index != 2;
    });
}

const density = document.querySelector("#density")! as HTMLInputElement;
density.value = String(Util.map(Settings.newBodySettings.density, densityRange.p1, densityRange.p2, 0, 100));
const densityLabel = document.querySelector("#density_label")! as HTMLLabelElement;
densityLabel.innerHTML = String(Settings.newBodySettings.density) + "kg";
density.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(density.value), 0, 100, densityRange.p1, densityRange.p2);
    mappedValue = Math.trunc(mappedValue);
    densityLabel.innerHTML = String(mappedValue) + "kg";

    updateSetting("density", mappedValue);
});

const size = document.querySelector("#size")! as HTMLInputElement;
size.value = String(Util.map(Settings.newBodySettings.size, sizeRange.p1, sizeRange.p2, 0, 100));
const sizeLabel = document.querySelector("#size_label")! as HTMLLabelElement;
sizeLabel.innerHTML = String(Settings.newBodySettings.size) + "m";
size.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(size.value), 0, 100, sizeRange.p1, sizeRange.p2);
    mappedValue = Number(mappedValue.toFixed(2));
    sizeLabel.innerHTML = String(mappedValue) + "m";

    updateSetting("size", mappedValue);
});

const friction = document.querySelector("#friction")! as HTMLInputElement;
friction.value = String(Util.map(Settings.newBodySettings.friction, frictionRange.p1, frictionRange.p2, 0, 100));
const frictionLabel = document.querySelector("#friction_label")! as HTMLLabelElement;
frictionLabel.innerHTML = String(Settings.newBodySettings.friction);
friction.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(friction.value), 0, 100, frictionRange.p1, frictionRange.p2);
    mappedValue = Number(mappedValue.toFixed(2));
    frictionLabel.innerHTML = String(mappedValue);

    updateSetting("friction", mappedValue);
});

const restitution = document.querySelector("#restitution")! as HTMLInputElement;
restitution.value = String(Util.map(Settings.newBodySettings.restitution, restitutionRange.p1, restitutionRange.p2, 0, 100));
const restitutionLabel = document.querySelector("#restitution_label")! as HTMLLabelElement;
restitutionLabel.innerHTML = String(Settings.newBodySettings.restitution);
restitution.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(restitution.value), 0, 100, restitutionRange.p1, restitutionRange.p2);
    mappedValue = Number(mappedValue.toFixed(2));
    restitutionLabel.innerHTML = String(mappedValue);

    updateSetting("restitution", mappedValue);
});

const numVertices = document.querySelector("#vertices")! as HTMLInputElement;
numVertices.value = String(Util.map(Settings.newBodySettings.numVertices, numVerticesRange.p1, numVerticesRange.p2, 0, 100));
const numVerticesLabel = document.querySelector("#vertices_label")! as HTMLLabelElement;
numVerticesLabel.innerHTML = String(Settings.newBodySettings.numVertices);
numVertices.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(numVertices.value), 0, 100, numVerticesRange.p1, numVerticesRange.p2);
    mappedValue = Number(Math.trunc(mappedValue));
    if (mappedValue < 3)
        numVerticesLabel.innerHTML = "Random";
    else
        numVerticesLabel.innerHTML = String(mappedValue);

    updateSetting("vertices", mappedValue);
});

const gravityForce = document.querySelector("#gravityForce")! as HTMLInputElement;
gravityForce.value = String(Util.map(Settings.gravity, gravityForceRange.p1, gravityForceRange.p2, 0, 100));
const gravityForceLabel = document.querySelector("#gravityForce_label")! as HTMLLabelElement;
gravityForceLabel.innerHTML = String(Settings.gravity) + "N";
gravityForce.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(gravityForce.value), 0, 100, gravityForceRange.p1, gravityForceRange.p2);
    mappedValue = Number(mappedValue.toPrecision(2));
    gravityForceLabel.innerHTML = String(mappedValue) + "N";

    updateSetting("gravity", mappedValue);
});

const grabCenter = document.querySelector("#grabCenter")! as HTMLInputElement;
grabCenter.checked = Settings.grabCenter;
grabCenter.addEventListener("click", () => { Settings.grabCenter = !Settings.grabCenter; });

const resetCamera = document.querySelector("#resetCamera")! as HTMLInputElement;
resetCamera.checked = Settings.resetCamera;
resetCamera.addEventListener("click", () => { Settings.resetCamera = !Settings.resetCamera; });

const showInfo = document.querySelector("#showInfo")! as HTMLInputElement;
showInfo.checked = Settings.showInfo;
showInfo.addEventListener("click", () => { Settings.showInfo = !Settings.showInfo; });

const contactLink = document.querySelector("#contactLink")! as HTMLInputElement;
contactLink.checked = Settings.showContactLink;
contactLink.addEventListener("click", () => { Settings.showContactLink = !Settings.showContactLink; });

const colorizeBody = document.querySelector("#colorizeBody")! as HTMLInputElement;
colorizeBody.checked = Settings.colorizeBody;
colorizeBody.addEventListener("click", () => { Settings.colorizeBody = !Settings.colorizeBody; });

const colorizeIsland = document.querySelector("#colorizeIsland")! as HTMLInputElement;
colorizeIsland.checked = Settings.colorizeIsland;
colorizeIsland.addEventListener("click", () => { Settings.colorizeIsland = !Settings.colorizeIsland; });

const sleepEnabled = document.querySelector("#sleepEnabled")! as HTMLInputElement;
sleepEnabled.checked = Settings.sleepEnabled;
sleepEnabled.addEventListener("click", () => { Settings.sleepEnabled = !Settings.sleepEnabled; });

const applyWarmStartingThreshold = document.querySelector("#applyWarmStartingThreshold")! as HTMLInputElement;
applyWarmStartingThreshold.checked = Settings.applyWarmStartingThreshold;
applyWarmStartingThreshold.addEventListener("click", () => { Settings.applyWarmStartingThreshold = !Settings.applyWarmStartingThreshold; });

const colorizeActiveBody = document.querySelector("#colorizeActiveBody")! as HTMLInputElement;
colorizeActiveBody.checked = Settings.colorizeActiveBody;
colorizeActiveBody.addEventListener("click", () => { Settings.colorizeActiveBody = !Settings.colorizeActiveBody; });

const visualizeAABBTree = document.querySelector("#visualizeAABBTree")! as HTMLInputElement;
visualizeAABBTree.checked = Settings.visualizeAABBTree;
visualizeAABBTree.addEventListener("click", () => { Settings.visualizeAABBTree = !Settings.visualizeAABBTree; });

const showProfile = document.querySelector("#showProfile")! as HTMLInputElement;
showProfile.checked = Settings.showProfile;
showProfile.addEventListener("click", () => { Settings.showProfile = !Settings.showProfile; });

export function updateSetting(id: string, content?: any)
{
    switch (id)
    {
        case "pause":
            Settings.paused = !Settings.paused;
            pause.checked = Settings.paused;
            break
        case "g":
            if (content == undefined)
                Settings.applyGravity = !Settings.applyGravity;
            else
                Settings.applyGravity = content;
            applyGravity.checked = Settings.applyGravity;
            break;
        case "c":
            Settings.positionCorrection = !Settings.positionCorrection;
            correction.checked = Settings.positionCorrection;
            break;
        case "a":
            Settings.impulseAccumulation = !Settings.impulseAccumulation;
            accumulation.checked = Settings.impulseAccumulation;
            break;
        case "i":
            Settings.showInfo = !Settings.showInfo;
            showInfo.checked = Settings.showInfo;
            break;
        case "w":
            Settings.warmStarting = !Settings.warmStarting;
            warmStarting.checked = Settings.warmStarting;
            break;
        case "m":
            Settings.indicateCoM = !Settings.indicateCoM;
            indicateCoM.checked = Settings.indicateCoM;
            break;
        case "p":
            Settings.indicateCP = !Settings.indicateCP;
            indicateContact.checked = Settings.indicateCP;
            break;
        case "f":
            Settings.showProfile = !Settings.showProfile;
            showProfile.checked = Settings.showProfile;
            break;
        case "v":
            Settings.visualizeAABBTree = !Settings.visualizeAABBTree;
            visualizeAABBTree.checked = Settings.visualizeAABBTree;
            break;
        case "b":
            Settings.showBoundingBox = !Settings.showBoundingBox;
            showBB.checked = Settings.showBoundingBox;
            break;
        case "frequency":
            Settings.frequency = content!;
            Settings.dt = 1 / content!;
            Settings.inv_dt = content!;
            break;
        case "iteration":
            Settings.numIterations = content!;
            break;
        case "density":
            Settings.newBodySettings.density = content!;
            break;
        case "size":
            Settings.newBodySettings.size = content!;
            break;
        case "friction":
            Settings.newBodySettings.friction = content!;
            break;
        case "restitution":
            Settings.newBodySettings.restitution = content!;
            break;
        case "vertices":
            Settings.newBodySettings.numVertices = content!;
            break;
        case "gravity":
            Settings.gravity = content!;
            break;
        case "beta":
            Settings.positionCorrectionBeta = content!;
            break;
        case "strength":
            Settings.mouseStrength = content!;
            break;
        default:
            break;
    }
}