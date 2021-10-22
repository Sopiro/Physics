interface Key
{
    [key: string]: boolean;
}

export let last_keys: Key = {};
export let curr_keys: Key = {};
export let mouses = { last_down: false, curr_down: false, lastX: 0.0, lastY: 0.0, currX: 0.0, currY: 0.0, dx: 0.0, dy: 0.0 };