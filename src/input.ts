interface Key
{
    [key: string]: boolean;
}

export let last_keys: Key = {};
export let curr_keys: Key = {};
export let mouses = { last_down: false, curr_down: false, lastX: 0.0, lastY: 0.0, currX: 0.0, currY: 0.0, dx: 0.0, dy: 0.0 };

export function isMouseDown(): boolean
{
    return mouses.curr_down && !mouses.last_down;
}

export function isMouseUp(): boolean
{
    return !mouses.curr_down && mouses.last_down;
}

export function isMousePressed(): boolean
{
    return mouses.curr_down;
}

export function isKeyDown(key: string): boolean
{
    return curr_keys[key] && !last_keys[key];
}

export function isKeyUp(key: string): boolean
{
    return !curr_keys[key] && last_keys[key];
}

export function isKeyPressed(key: string): boolean
{
    return curr_keys[key];
}