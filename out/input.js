import { Vector2 } from "./math.js";
import { updateSetting } from "./settings.js";
const last_keys = {};
const curr_keys = {};
const mouses = [];
const maxMouseButtons = 5;
export const mousePosition = new Vector2(0, 0);
export const mouseLastPosition = new Vector2(0, 0);
export let last_scroll = false;
export let curr_scroll = false;
export const mouseScroll = new Vector2(0, 0);
export const mouseAcceleration = new Vector2(0, 0);
export function init(engine) {
    // Registers event listeners
    engine.cvs.addEventListener("mousedown", (e) => {
        if (e.button > maxMouseButtons)
            return;
        mouses[e.button].curr_down = true;
    }, false);
    window.addEventListener("mouseup", (e) => {
        if (e.button > maxMouseButtons)
            return;
        mouses[e.button].curr_down = false;
    }, false);
    window.addEventListener("keydown", (e) => {
        if (e.key == "Escape")
            updateSetting("pause");
        curr_keys[e.key] = true;
    });
    window.addEventListener("keyup", (e) => {
        curr_keys[e.key] = false;
    });
    window.addEventListener("mousemove", (e) => {
        let rect = engine.cvs.getBoundingClientRect();
        mousePosition.x = e.clientX - rect.left;
        mousePosition.y = e.clientY - rect.top;
    });
    engine.cvs.addEventListener("wheel", (e) => {
        mouseScroll.x = e.deltaX / 100;
        mouseScroll.y = e.deltaY / 100;
        curr_scroll = true;
    });
    for (let i = 0; i < maxMouseButtons; i++)
        mouses.push({ last_down: false, curr_down: false });
}
export function update() {
    mouseAcceleration.x = mousePosition.x - mouseLastPosition.x;
    mouseAcceleration.y = mousePosition.y - mouseLastPosition.y;
    mouseLastPosition.x = mousePosition.x;
    mouseLastPosition.y = mousePosition.y;
    last_scroll = curr_scroll;
    curr_scroll = false;
    mouseScroll.clear();
    for (let i = 0; i < mouses.length; i++)
        mouses[i].last_down = mouses[i].curr_down;
    Object.assign(last_keys, curr_keys);
}
export function isScrolling() {
    return curr_scroll;
}
export function isScrollingStart() {
    return curr_scroll && !last_scroll;
}
export function isScrollingEnd() {
    return !curr_scroll && last_scroll;
}
export function isMousePressed(button = 0) {
    return mouses[button].curr_down && !mouses[button].last_down;
}
export function isMouseReleased(button = 0) {
    return !mouses[button].curr_down && mouses[button].last_down;
}
export function isMouseDown(button = 0) {
    return mouses[button].curr_down;
}
export function isKeyPressed(key) {
    return curr_keys[key] && !last_keys[key];
}
export function isKeyReleased(key) {
    return !curr_keys[key] && last_keys[key];
}
export function isKeyDown(key) {
    return curr_keys[key];
}
