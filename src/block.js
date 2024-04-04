export class Block {
    start;
    end;
    order;
    color;

    constructor(start, end, order, color) {
        this.start = start;
        this.end = end;
        this.order = order;
        this.color = color;
    }

    toString() {
        return `${this.color ? "b" : "w"}${this.start}-${this.end}`
    }
}