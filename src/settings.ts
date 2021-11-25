import * as Util from "./util.js";

export enum GenerationShape
{
    Box = 0,
    Circle,
    Random
}

const frequencyRange: Util.Pair<number, number> = { p1: 10, p2: 240 };
const iterationRange: Util.Pair<number, number> = { p1: 0, p2: 50 };
const massRange: Util.Pair<number, number> = { p1: 1, p2: 100 };
const sizeRange: Util.Pair<number, number> = { p1: 10, p2: 300 };
const gravityForceRange: Util.Pair<number, number> = { p1: -20, p2: 20 };
const betaRange: Util.Pair<number, number> = { p1: 0, p2: 1 };
const frictionRange: Util.Pair<number, number> = { p1: 0, p2: 1 };
const restitutionRange: Util.Pair<number, number> = { p1: 0, p2: 1 };

// Simulation settings
export const Settings = {
    width: 1280,
    height: 720,
    paused: false,
    frequency: 60,
    fixedDeltaTime: 1 / 60.0,
    GJK_MAX_ITERATION: 20,
    EPA_MAX_ITERATION: 20,
    EPA_TOLERANCE: 1e-9,
    applyGravity: true,
    positionCorrection: true,
    impulseAccumulation: true,
    warmStarting: true,
    indicateCP: false,
    indicateCoM: false,
    showBoundingBox: false,
    numIterations: 15, // Number of resolution iterations
    newBodySettings: {
        shape: GenerationShape.Box,
        mass: 2,
        size: 50,
        friction: 0.7,
        restitution: 0.001,
    },
    gravity: -10,
    gravityScale: 25,
    penetrationSlop: 0.2,
    restitutionSlop: 8, // This has to be greater than (gravity * gravityScale * deltaTime)
    positionCorrectionBeta: 0.2,
    warmStartingThreshold: 0.08,
    deadBottom: -1000,
    grabCenter: false,
    showInfo: false
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
applyGravity.addEventListener("click", () => { Settings.applyGravity = applyGravity.checked; });

const correction = document.querySelector("#correction")! as HTMLInputElement;
correction.checked = Settings.positionCorrection;
correction.addEventListener("click", () => { Settings.positionCorrection = correction.checked; });

const accumulation = document.querySelector("#accumulation")! as HTMLInputElement;
accumulation.checked = Settings.impulseAccumulation;
accumulation.addEventListener("click", () => { Settings.impulseAccumulation = accumulation.checked; });

const warmStarting = document.querySelector("#warmstarting")! as HTMLInputElement;
warmStarting.checked = Settings.warmStarting;
warmStarting.addEventListener("click", () => { Settings.warmStarting = warmStarting.checked; });

const indicateCoM = document.querySelector("#indicateCoM")! as HTMLInputElement;
indicateCoM.checked = Settings.indicateCoM;
indicateCoM.addEventListener("click", () => { Settings.indicateCoM = indicateCoM.checked; });

const indicateContact = document.querySelector("#indicateContact")! as HTMLInputElement;
indicateContact.checked = Settings.indicateCP;
indicateContact.addEventListener("click", () => { Settings.indicateCP = indicateContact.checked; });

const showBB = document.querySelector("#showBB")! as HTMLInputElement;
showBB.checked = Settings.showBoundingBox;
showBB.addEventListener("click", () => { Settings.showBoundingBox = showBB.checked; });

const frequency = document.querySelector("#frequency")! as HTMLInputElement;
frequency.value = String(Util.map(Settings.frequency, frequencyRange.p1, frequencyRange.p2, 0, 100));
const frequencyLabel = document.querySelector("#frequency_label")! as HTMLLabelElement;
frequencyLabel.innerHTML = String(Settings.frequency);
frequency.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(frequency.value), 0, 100, frequencyRange.p1, frequencyRange.p2);
    mappedValue = Math.trunc(mappedValue);
    frequencyLabel.innerHTML = String(mappedValue);

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

let rad = document.querySelectorAll('input[name="shapeRadios"]');
for (var i = 0; i < 3; i++)
{
    let me = rad[i] as HTMLInputElement;
    me.addEventListener('change', () => { Settings.newBodySettings.shape = Number(me.value); });
}

const mass = document.querySelector("#mass")! as HTMLInputElement;
mass.value = String(Util.map(Settings.newBodySettings.mass, massRange.p1, massRange.p2, 0, 100));
const massLabel = document.querySelector("#mass_label")! as HTMLLabelElement;
massLabel.innerHTML = String(Settings.newBodySettings.mass) + "kg";
mass.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(mass.value), 0, 100, massRange.p1, massRange.p2);
    mappedValue = Math.trunc(mappedValue);
    massLabel.innerHTML = String(mappedValue) + "kg";

    updateSetting("mass", mappedValue);
});

const size = document.querySelector("#size")! as HTMLInputElement;
size.value = String(Util.map(Settings.newBodySettings.size, sizeRange.p1, sizeRange.p2, 0, 100));
const sizeLabel = document.querySelector("#size_label")! as HTMLLabelElement;
sizeLabel.innerHTML = String(Settings.newBodySettings.size) + "cm";
size.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(size.value), 0, 100, sizeRange.p1, sizeRange.p2);
    mappedValue = Math.trunc(mappedValue);
    sizeLabel.innerHTML = String(mappedValue) + "cm";

    updateSetting("size", mappedValue);
});

const friction = document.querySelector("#friction")! as HTMLInputElement;
friction.value = String(Util.map(Settings.newBodySettings.friction, frictionRange.p1, frictionRange.p2, 0, 100));
const frictionLabel = document.querySelector("#friction_label")! as HTMLLabelElement;
frictionLabel.innerHTML = String(Settings.newBodySettings.friction);
friction.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(friction.value), 0, 100, frictionRange.p1, frictionRange.p2);
    mappedValue = Number(mappedValue.toPrecision(2))
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
    mappedValue = Number(mappedValue.toPrecision(2))
    restitutionLabel.innerHTML = String(mappedValue);

    updateSetting("restitution", mappedValue);
});

const gravityForce = document.querySelector("#gravityForce")! as HTMLInputElement;
gravityForce.value = String(Util.map(Settings.gravity, gravityForceRange.p1, gravityForceRange.p2, 0, 100));
const gravityForceLabel = document.querySelector("#gravityForce_label")! as HTMLLabelElement;
gravityForceLabel.innerHTML = String(Settings.gravity) + "N";
gravityForce.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(gravityForce.value), 0, 100, gravityForceRange.p1, gravityForceRange.p2);
    mappedValue = Number(mappedValue.toPrecision(2))
    gravityForceLabel.innerHTML = String(mappedValue) + "N";

    updateSetting("gravity", mappedValue);
});

const grabCenter = document.querySelector("#grabCenter")! as HTMLInputElement;
grabCenter.checked = Settings.grabCenter;
grabCenter.addEventListener("click", () => { Settings.grabCenter = !Settings.grabCenter; });

const showInfo = document.querySelector("#showInfo")! as HTMLInputElement;
showInfo.checked = Settings.showInfo;
showInfo.addEventListener("click", () => { Settings.showInfo = !Settings.showInfo; });

const beta = document.querySelector("#beta")! as HTMLInputElement;
beta.value = String(Util.map(Settings.positionCorrectionBeta, betaRange.p1, betaRange.p2, 0, 100));
const betaLabel = document.querySelector("#beta_label")! as HTMLLabelElement;
betaLabel.innerHTML = String(Settings.positionCorrectionBeta);
beta.addEventListener("input", () =>
{
    let mappedValue = Util.map(Number(beta.value), 0, 100, betaRange.p1, betaRange.p2);
    mappedValue = Number(mappedValue.toPrecision(2))
    betaLabel.innerHTML = String(mappedValue);

    updateSetting("beta", mappedValue);
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
        case "frequency":
            Settings.frequency = content!;
            Settings.fixedDeltaTime = 1 / content!;
            break;
        case "iteration":
            Settings.numIterations = content!;
            break;
        case "mass":
            Settings.newBodySettings.mass = content!;
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
        case "gravity":
            Settings.gravity = content!;
            break;
        case "beta":
            Settings.positionCorrectionBeta = content!;
            break;
        default:
            break;
    }
}