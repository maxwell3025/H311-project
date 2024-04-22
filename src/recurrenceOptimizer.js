import { Block } from "./block";

/**
 * @param { Block[] } eventList 
 * @returns { Block[] }
 */
export function optimizeRecurrences(eventList) {
    /** @type {{[x: string]: Block[]}} */
    const classMap = {};
    eventList.forEach(event => {
        const key = `$${event.start}$${event.end}$${event.color}$${event.order}`
        classMap[key] ??= [];
        classMap[key].push(event);
    })
    const classesOptimized = Object.values(classMap).map(optimizeEventClass);
    return classesOptimized.flat();
}

/**
 * All blocks in `eventList` must have the exact same stats except for `day`.
 * @param { Block[] } eventList 
 * @returns { Block[] }
 */
export function optimizeEventClass(eventList) {
    const sortedEvents = eventList.toSorted((lhs, rhs) => (lhs.day - rhs.day));
    const dayArray = sortedEvents.map(event => event.day);
    const sequenceList = intoSubSequencesGreedy(dayArray);
    const representative = sortedEvents[0];
    return sequenceList.map(sequence => new Block(
            representative.start, 
            representative.end, 
            representative.order, 
            representative.color, 
            sequence.start, 
            sequence.gaps, 
            sequence.repeats
    ));
}

export class ArithmeticSequence {
    start;
    gaps;
    repeats;
    /**
     * @param {number} start 
     * @param {number} gaps 
     * @param {number} repeats 
     */
    constructor(start, gaps, repeats) {
        this.start = start;
        this.gaps = gaps;
        this.repeats = repeats;
    }

    toString() {
        return `${this.start},${this.gaps},${this.repeats}`
    }

    /**
     * @param {string} str 
     */
    static valueOf(str) {
        const [start, gaps, repeats] = str.split(",");
        return new ArithmeticSequence(
            Number.parseInt(start),
            Number.parseInt(gaps),
            Number.parseInt(repeats),
        )
    }
}

/**
 * Finds an efficient partition of `arr` into arithmetic sequences.
 * @param {number[]} arr an array of numbers **sorted in ascending order**
 * @returns {ArithmeticSequence[]}
 */
export function intoSubSequencesGreedy(arr) {
    /** @type {ArithmeticSequence[]} */
    const output = [];
    /** @type {ArithmeticSequence | number | null} */
    let currentSequence = null;
    arr.forEach( value => {
        if(currentSequence === null){
            currentSequence = value;
        } else if (typeof currentSequence === "number"){
            currentSequence = new ArithmeticSequence(currentSequence, value - currentSequence, 2);
        } else {
            if(value === currentSequence.start + currentSequence.gaps * currentSequence.repeats){
                currentSequence.repeats++;
            } else {
                output.push(currentSequence);
                currentSequence = value;
            }
        }
    })

    if(typeof currentSequence === "number"){
        output.push(new ArithmeticSequence(currentSequence, 1, 1));
    } else if (currentSequence instanceof ArithmeticSequence){
        output.push(currentSequence);
    }
    return output;
}

/**
 * Finds an efficient partition of `arr` into arithmetic sequences.
 * @param {number[]} arr an array of numbers **sorted in ascending order**
 * @param {ArithmeticSequence[]} inital an array of numbers **sorted in ascending order**
 * @returns {ArithmeticSequence[]}
 */
export function intoSubSequencesAnnealing(arr, initial) {

}