export class Timer
{
    public times: number[] = [];
    public elapsed: number[] = [];

    reset()
    {
        this.times = [];
        this.elapsed = [];
    }

    mark(): void
    {
        this.times.push(performance.now());

        if (this.times.length >= 2)
            this.elapsed.push(this.lastElapsed);
    }

    get lastElapsed(): number
    {
        let len = this.times.length;

        if (len >= 2)
            return this.times[len - 1] - this.times[len - 2];
        else
            return 0;
    }

    get lastTime(): number
    {
        if (this.times.length == 0)
            return 0;
        else
            return this.times[this.times.length - 1];
    }

    get totalElapsedTime(): number
    {
        if (this.times.length == 0)
            return 0;
        else
            return this.times[this.times.length - 1] - this.times[0];
    }

    copy(): Timer
    {
        let res = new Timer();

        Object.assign(res.times, this.times);
        Object.assign(res.elapsed, this.elapsed);

        return res;
    }
}