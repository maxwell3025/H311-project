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

    contains(value) {
        const meetsThreshold = (value >= this.start) && (value <= this.start + this.gaps * this.repeats);
    }

    toString() {
        return `[${this.start},${this.gaps},${this.repeats}]`
    }

    prettyPrint() {
        const stringList = [];
        let currentNumber = this.start;
        for (let i = 0; i < this.repeats; i++) {
            stringList.push(currentNumber.toString().padStart(4, "0"));
            currentNumber += this.gaps;
        }
        return stringList.join(' - ');
    }

    /**
     * @param {string} str 
     * @returns {ArithmeticSequence}
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
    arr.forEach(value => {
        if (currentSequence === null) {
            currentSequence = value;
        } else if (typeof currentSequence === "number") {
            currentSequence = new ArithmeticSequence(currentSequence, value - currentSequence, 2);
        } else {
            if (value === currentSequence.start + currentSequence.gaps * currentSequence.repeats) {
                currentSequence.repeats++;
            } else {
                output.push(currentSequence);
                currentSequence = value;
            }
        }
    })

    if (typeof currentSequence === "number") {
        output.push(new ArithmeticSequence(currentSequence, 1, 1));
    } else if (currentSequence instanceof ArithmeticSequence) {
        output.push(currentSequence);
    }
    return output;
}

/**
 * Finds an efficient partition of `arr` into arithmetic sequences.
 * @param {number[]} arr an array of numbers **sorted in ascending order**
 * @returns {ArithmeticSequence[]}
 */
export function intoSubSequencesGreedyLargestFirst(arr) {
    /** @type { number[] } */
    const invArr = [];
    arr.forEach((value, index) => {
        invArr[value] = index;
    })

    /** @type { ArithmeticSequence[] } */
    const allPossibleSequences = [];
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            const startPos = arr[i];
            const gap = arr[j] - arr[i];
            let sequenceSize = 1;
            while (invArr[startPos + gap * (sequenceSize - 1)] !== undefined) {
                allPossibleSequences.push(new ArithmeticSequence(
                    startPos,
                    gap,
                    sequenceSize,
                ));
                sequenceSize++;
            }
        }
    }

    const allPossibleSequencesSorted = allPossibleSequences.toSorted((a, b) => b.repeats - a.repeats);
    /**
     * This is a description of how the sequences are currently laid out.
     * @member {number} prev The previous number in the sequence, not the index
     * @member {number} next The next number in the sequence, not the index
     * @type {{
     *  prev?: number,
     *  next?: number
     * }[]}
     */
    const connectionDescriptions = []
    /**
     * Debugging only
     */
    function logConnections(){
        for(const value in connectionDescriptions){
                console.debug(`${connectionDescriptions[value].prev}->${value}->${connectionDescriptions[value].next}`);
        }
    }
    arr.forEach(value => {
        connectionDescriptions[value] = {};
    });

    allPossibleSequencesSorted.forEach(sequence => {
        let cost = 1; // Add current bar
        for (let i = 0; i < sequence.repeats; i++) {
            const currentValue = sequence.start + sequence.gaps * i;
            const currentConnection = connectionDescriptions[currentValue];
            cost--; // Remove intersecting bar;
            if (currentConnection.prev !== undefined && !sequence.contains(currentConnection.prev)) {
                cost++;
            }
            if (currentConnection.next !== undefined) {
                cost++;
            }
        }
        if (cost < 0) { // Inclusive since smaller sequences are better in general
            for (let i = 0; i < sequence.repeats; i++) {
                const currentValue = sequence.start + sequence.gaps * i;
                const currentConnection = connectionDescriptions[currentValue];
                if (currentConnection.prev !== undefined)
                    delete connectionDescriptions[currentConnection.prev].next;
                delete currentConnection.prev;
                if (currentConnection.next !== undefined)
                    delete connectionDescriptions[currentConnection.next].prev;
                    delete currentConnection.next;
                if (i !== 0)
                    currentConnection.prev = currentValue - sequence.gaps;
                if (i !== sequence.repeats - 1)
                    currentConnection.next = currentValue + sequence.gaps;
            }
        }
    });

    const output = [];
    arr.forEach(value => {
        if (connectionDescriptions[value].prev === undefined) {
            const sequenceStart = value;
            const gapSize = connectionDescriptions[value] ? connectionDescriptions[value].next - value : 1;
            let sequenceSize = 0;
            let sequenceHead = value;
            while(sequenceHead !== undefined){
                sequenceSize++;
                sequenceHead = connectionDescriptions[sequenceHead].next;
            }
            output.push(new ArithmeticSequence(
                sequenceStart,
                gapSize,
                sequenceSize,
            ))
        }
    });
    return output;
}

/**
 * @param {ArithmeticSequence} a 
 * @param {ArithmeticSequence} b 
 */
function canMergeSorted(a, b) {
    if (a.repeats === 1 && b.repeats === 1) return true;
    if (a.repeats === 1) {
        return a.start === b.start - b.gaps;
    }
    if (b.repeats === 1) {
        return b.start === a.start + a.gaps * a.repeats;
    }
    if (a.gaps !== b.gaps) return false;
    return b.start === a.start + a.gaps * a.repeats;
}

/**
 * @param {ArithmeticSequence} a 
 * @param {ArithmeticSequence} b 
 */
export function canMerge(a, b) {
    if (a.start < b.start) {
        return canMergeSorted(a, b);
    } else {
        return canMergeSorted(b, a);
    }
}

/**
 * Merges 2 Arithmetic Sequences into 1
 * @param {ArithmeticSequence} a 
 * @param {ArithmeticSequence} b 
 * @returns {ArithmeticSequence}
 */
export function mergeSequences(a, b) {
    if (a.start > b.start) [a, b] = [b, a];
    if ((a.repeats === 1) && (b.repeats === 1)) {
        return new ArithmeticSequence(
            a.start,
            b.start - a.start,
            2
        );
    }
    if (a.repeats === 1) {
        return new ArithmeticSequence(
            a.start,
            b.gaps,
            b.repeats + 1
        );
    }
    if (b.repeats === 1) {
        return new ArithmeticSequence(
            a.start,
            a.gaps,
            a.repeats + 1
        );
    }
    return new ArithmeticSequence(a.start, a.gaps, a.repeats + b.repeats);
}

/**
 * Splits an arithmetic sequence at a certain point
 * @param {ArithmeticSequence} seq 
 * @param {number} pos
 * @returns {[ArithmeticSequence, ArithmeticSequence]}
 */
export function splitSequence(seq, pos) {
    const a = new ArithmeticSequence(
        seq.start,
        seq.gaps,
        pos
    );
    const b = new ArithmeticSequence(
        seq.start + seq.gaps * (pos),
        seq.gaps,
        seq.repeats - pos
    );
    return [a, b];
}

/**
 * Mutates a given partition.
 * @param {ArithmeticSequence[]} initial
 * @returns {ArithmeticSequence[]}
 */
export function mutateSimple(initial) {
    const possibleMerges = [];
    const possibleSplits = [];
    for (let i = 0; i < initial.length; i++) {
        for (let j = 0; j < i; j++) {
            if (canMerge(initial[i], initial[j])) {
                possibleMerges.push([j, i]);
            }
        }
    }
    initial.forEach((sequence, index) => {
        for (let i = 0; i < sequence.repeats - 1; i++) {
            possibleSplits.push([index, i + 1]);
        }
    });
    const mutationIndex = Math.floor(Math.random() * (possibleMerges.length + possibleSplits.length))
    const newSequence = [...initial];
    if (mutationIndex < possibleMerges.length) {
        const mergeIndex = mutationIndex;
        let [indexA, indexB] = possibleMerges[mergeIndex];
        let [b] = newSequence.splice(indexB, 1);
        let [a] = newSequence.splice(indexA, 1);
        newSequence.push(mergeSequences(a, b));
    } else {
        const splitIndex = mutationIndex - possibleMerges.length;
        const [index, pos] = possibleSplits[splitIndex];
        const [sequenceToSplit] = newSequence.splice(index, 1);
        newSequence.push(...splitSequence(sequenceToSplit, pos));
    }
    return newSequence;
}

/**
 * Anneals a efficient partition to minimize number of segments.
 * @param {ArithmeticSequence[]} partition
 * @param {(initial: ArithmeticSequence[]) => ArithmeticSequence} mutationFunction 
 * @returns {ArithmeticSequence[]}
 */
export function annealSubsequence(partition, mutationFunction) {
    let temperature = 0.5;
    let min = 100;
    function singleStep(initial) {
        const newCandidate = mutationFunction(initial);
        const diffEnergy = newCandidate.length - initial.length;
        const acceptanceProbability = Math.exp(-diffEnergy / temperature)
        if (Math.random() < acceptanceProbability) return newCandidate;
        else return initial;
    }
    for (let i = 0; i < 100000; i++) {
        // temperature -= 0.01;
        partition = singleStep(partition);
        // console.log(temperature);
        console.log(partition.length);
        if (min > partition.length) min = partition.length;
        // partition.forEach(sequence => {
        //     console.log(sequence.prettyPrint());
        // })
    }
    console.log(min);
    return partition;
}