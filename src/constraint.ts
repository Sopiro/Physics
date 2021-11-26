export abstract class Constraint
{
    public abstract prepare(delta: number): void;
    public abstract solve(): void;
}