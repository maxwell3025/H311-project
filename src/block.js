export class Block {
    start;
    end;
    order;
    color;
    day;
    repGap;
    repCount;

    /**
     * 
     * @param {number} start 
     * @param {number} end 
     * @param {number} order 
     * @param {boolean} color 
     * @param {number} day 
     * @param {number} repGap 
     * @param {number} repCount 
     */
    constructor(start, end, order, color, day, repGap = 1, repCount = 1) {
        this.start = start;
        this.end = end;
        this.order = order;
        this.color = color;
        this.day = day;
        this.repGap = repGap;
        this.repCount = repGap;
    }

    toString() {
        return `${this.color ? "b" : "w"}${this.start}-${this.end}`
    }
}