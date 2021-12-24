export class Timer {
    constructor() {
        this.times = [];
        this.elapsed = [];
    }
    reset() {
        this.times = [];
        this.elapsed = [];
    }
    mark() {
        this.times.push(performance.now());
        if (this.times.length >= 2)
            this.elapsed.push(this.lastElapsed);
    }
    get lastElapsed() {
        let len = this.times.length;
        if (len >= 2)
            return this.times[len - 1] - this.times[len - 2];
        else
            return 0;
    }
    get lastTime() {
        if (this.times.length == 0)
            return 0;
        else
            return this.times[this.times.length - 1];
    }
    get totalElapsedTime() {
        if (this.times.length == 0)
            return 0;
        else
            return this.times[this.times.length - 1] - this.times[0];
    }
    copy() {
        let res = new Timer();
        Object.assign(res.times, this.times);
        Object.assign(res.elapsed, this.elapsed);
        return res;
    }
}
