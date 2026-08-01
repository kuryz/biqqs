export abstract class BaseModel {
    constructor(
        public readonly id: number,
        public readonly createdAt: Date
    ) {}
}