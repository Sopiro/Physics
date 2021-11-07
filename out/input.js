export let last_keys = {};
export let curr_keys = {};
export let mouses = { last_down: false, curr_down: false, lastX: 0.0, lastY: 0.0, currX: 0.0, currY: 0.0, dx: 0.0, dy: 0.0 };
export function isMouseDown() {
    return mouses.curr_down && !mouses.last_down;
}
export function isMouseUp() {
    return !mouses.curr_down && mouses.last_down;
}
export function isMousePressed() {
    return mouses.curr_down;
}
export function isKeyDown(key) {
    return curr_keys[key] && !last_keys[key];
}
export function isKeyUp(key) {
    return !curr_keys[key] && last_keys[key];
}
export function isKeyPressed(key) {
    return curr_keys[key];
}
