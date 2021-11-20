import * as Util from "./util.js";

export enum GenerationShape
{
    Box = 0,
    Circle,
    Random
}

let iterationRange: Util.Pair<number, number> = { p1: 0, p2: 50 };
let massRange: Util.Pair<number, number> = { p1: 1, p2: 100 };
let sizeRange: Util.Pair<number, number> = { p1: 10, p2: 300 };

// Simulation settings
export const Settings = {
    paused: false,
    fixedDeltaTime: 1 / 144.0,
    applyGravity: true,
    positionCorrection: true,
    impulseAccumulation: true,
    warmStarting: true,
    indicateCP: false,
    indicateCoM: false,
    showBoundingBox: false,
    numIterations: 15, // Number of resolution iterations (0 ~ 50)
    newColliderSettings: {
        shape: GenerationShape.Box,
        mass: 2, // (0 ~ 100)
        size: 50 // (10 ~ 300)
    },
    gravity: -10,
    penetrationSlop: 0.2,
    restitutionSlop: 1000, // This has to be greater than (gravity * delta)
    warmStartingThreshold: 0.2,
}

// Remove the default pop-up context menu
let cvs = document.querySelector("#canvas") as HTMLCanvasElement;
cvs.oncontextmenu = (e) =>
{
    e.preventDefault();
    e.stopPropagation();
}

const pause = document.querySelector("#pause")! as HTMLInputElement;
pause.addEventListener("click", () => { Settings.paused = !Settings.paused; });

const gravity = document.querySelector("#gravity")! as HTMLInputElement;
gravity.addEventListener("click", () => { Settings.applyGravity = gravity.checked; });

const correction = document.querySelector("#correction")! as HTMLInputElement;
correction.addEventListener("click", () => { Settings.positionCorrection = correction.checked; });

const accumulation = document.querySelector("#accumulation")! as HTMLInputElement;
accumulation.addEventListener("click", () => { Settings.impulseAccumulation = accumulation.checked; });

const warmStarting = document.querySelector("#warmstarting")! as HTMLInputElement;
warmStarting.addEventListener("click", () => { Settings.warmStarting = warmStarting.checked; });

const indicateCoM = document.querySelector("#indicateCoM")! as HTMLInputElement;
indicateCoM.addEventListener("click", () => { Settings.indicateCoM = indicateCoM.checked; });

const indicateContact = document.querySelector("#indicateContact")! as HTMLInputElement;
indicateContact.addEventListener("click", () => { Settings.indicateCP = indicateContact.checked; });

const showBB = document.querySelector("#showBB")! as HTMLInputElement;
showBB.addEventListener("click", () => { Settings.showBoundingBox = showBB.checked; });

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

let rad = document.querySelectorAll('input[name="shapeRadios"]');
for (var i = 0; i < 3; i++)
{
    let me = rad[i] as HTMLInputElement;
    me.addEventListener('change', () => { Settings.newColliderSettings.shape = Number(me.value); });
}

const mass = document.querySelector("#mass")! as HTMLInputElement;
mass.value = String(Util.map(Settings.newColliderSettings.mass, massRange.p1, massRange.p2, 0, 100));
const massLabel = document.querySelector("#mass_label")! as HTMLLabelElement;
massLabel.innerHTML = String(Settings.newColliderSettings.mass) + "kg";
mass.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(mass.value), 0, 100, massRange.p1, massRange.p2);
    mappedValue = Math.trunc(mappedValue);
    massLabel.innerHTML = String(mappedValue) + "kg";

    updateSetting("mass", mappedValue);
});

const size = document.querySelector("#size")! as HTMLInputElement;
size.value = String(Util.map(Settings.newColliderSettings.size, sizeRange.p1, sizeRange.p2, 0, 100));
const sizeLabel = document.querySelector("#size_label")! as HTMLLabelElement;
sizeLabel.innerHTML = String(Settings.newColliderSettings.size) + "cm";
size.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(size.value), 0, 100, sizeRange.p1, sizeRange.p2);
    mappedValue = Math.trunc(mappedValue);
    sizeLabel.innerHTML = String(mappedValue) + "cm";

    updateSetting("size", mappedValue);
});

export function updateSetting(id: string, content: any = undefined)
{
    switch (id)
    {
        case "pause":
            Settings.paused = !Settings.paused;
            pause.checked = Settings.paused;
            break
        case "g":
            Settings.applyGravity = !Settings.applyGravity;
            gravity.checked = Settings.applyGravity;
            break;
        case "r":
            Settings.positionCorrection = !Settings.positionCorrection;
            correction.checked = Settings.positionCorrection;
            break;
        case "a":
            Settings.impulseAccumulation = !Settings.impulseAccumulation;
            accumulation.checked = Settings.impulseAccumulation;
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
        case "b":
            Settings.showBoundingBox = !Settings.showBoundingBox;
            showBB.checked = Settings.showBoundingBox;
            break;
        case "iteration":
            Settings.numIterations = content!;
            break;

        case "mass":
            Settings.newColliderSettings.mass = content!;
            break;
        case "size":
            Settings.newColliderSettings.size = content!;
            break;
        default:
            break;
    }
}