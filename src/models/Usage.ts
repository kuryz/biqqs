export class Usage {
    constructor(
        public readonly plan: string,
        public readonly used: number,
        public readonly limit: number | null
    ) {}

    public get unlimited(): boolean {
        return this.limit === null;
    }

    public get remaining(): number | null {
        if (this.limit === null) {
            return null;
        }
        return Math.max(
            0,
            this.limit - this.used
        );
    }

    public canCreateRecord(): boolean {
        if (this.unlimited) {
            return true;
        }
        return this.used < (this.limit ?? 0);
    }

}