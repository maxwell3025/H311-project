import { test, expect, describe } from "bun:test"
import { annealSubsequence, ArithmeticSequence, canMerge, intoSubSequencesGreedy, intoSubSequencesGreedyLargestFirst, mergeSequences, mutateSimple, splitSequence } from "../src/recurrenceOptimizer"

describe("intoSubSequencesGreedy", () => {
    test("Greedy Optimizes Simple Case", () => {
        const result = intoSubSequencesGreedy([1, 2, 3, 4]);
        expect(result.length).toBe(1);
        const [seq] = result;
        expect(seq.start).toBe(1);
        expect(seq.gaps).toBe(1);
        expect(seq.repeats).toBe(4);
    });
    test("Greedy On Triangle Numbers", () => {
        const result = intoSubSequencesGreedy([0, 1, 3, 6, 10, 15]);
        expect(result.length).toBe(3);
        const [a, b, c] = result;
        expect(a.start).toBe(0);
        expect(a.gaps).toBe(1);
        expect(a.repeats).toBe(2);

        expect(b.start).toBe(3);
        expect(b.gaps).toBe(3);
        expect(b.repeats).toBe(2);

        expect(c.start).toBe(10);
        expect(c.gaps).toBe(5);
        expect(c.repeats).toBe(2);
    });
})
describe("canMerge", () => {
    test("canMerge works on positive result", () => {
        // 35, 40, 45
        const a = new ArithmeticSequence(
            35,
            5,
            3
        )
        // 50, 55
        const b = new ArithmeticSequence(
            50,
            5,
            2
        )
        expect(canMerge(a, b)).toBeTrue();
        expect(canMerge(b, a)).toBeTrue();
    });
    test("canMerge works on negative result", () => {
        // 35, 40, 45
        const a = new ArithmeticSequence(
            35,
            5,
            3
        )
        // 51, 56
        const b = new ArithmeticSequence(
            51,
            5,
            2
        )
        expect(canMerge(a, b)).toBeFalse();
        expect(canMerge(b, a)).toBeFalse();
    });
    test("canMerge works on positive singleton", () => {
        // 35, 40, 45
        const a = new ArithmeticSequence(
            35,
            5,
            3
        )
        // 50
        const b = new ArithmeticSequence(
            50,
            5,
            1
        )
        expect(canMerge(a, b)).toBeTrue();
        expect(canMerge(b, a)).toBeTrue();
    });
    test("canMerge works on negative singleton", () => {
        // 35, 40, 45
        const a = new ArithmeticSequence(
            35,
            5,
            3
        )
        // 51
        const b = new ArithmeticSequence(
            51,
            5,
            1
        )
        expect(canMerge(a, b)).toBeFalse();
        expect(canMerge(b, a)).toBeFalse();
    });
    test("canMerge works on positive singleton(alt)", () => {
        // 35, 40, 45
        const a = new ArithmeticSequence(
            35,
            5,
            3
        )
        // 30
        const b = new ArithmeticSequence(
            30,
            4,
            1
        )
        expect(canMerge(a, b)).toBeTrue();
        expect(canMerge(b, a)).toBeTrue();
    });
    test("canMerge works on negative singleton(alt)", () => {
        // 35, 40, 45
        const a = new ArithmeticSequence(
            35,
            5,
            3
        )
        // 31
        const b = new ArithmeticSequence(
            31,
            4,
            1
        )
        expect(canMerge(a, b)).toBeFalse();
        expect(canMerge(b, a)).toBeFalse();
    });
});
describe("mergeSequences", () => {
    test("simple case", () => {
        // 5, 7, 9, 11
        const a = new ArithmeticSequence(
            5,
            2,
            4
        );
        // 13, 15
        const b = new ArithmeticSequence(
            13,
            2,
            2
        );
        const { start, gaps, repeats } = mergeSequences(a, b);
        expect(start).toBe(5);
        expect(gaps).toBe(2);
        expect(repeats).toBe(6);
    });
    test("singleton is second", () => {
        // 5, 7, 9, 11
        const a = new ArithmeticSequence(
            5,
            2,
            4
        );
        // 13
        const b = new ArithmeticSequence(
            13,
            1324123,
            1
        );
        const { start, gaps, repeats } = mergeSequences(a, b);
        expect(start).toBe(5);
        expect(gaps).toBe(2);
        expect(repeats).toBe(5);
    });
    test("singleton is first", () => {
        // 11
        const a = new ArithmeticSequence(
            11,
            1254512,
            1
        );
        // 13, 15
        const b = new ArithmeticSequence(
            13,
            2,
            2
        );
        const { start, gaps, repeats } = mergeSequences(a, b);
        expect(start).toBe(11);
        expect(gaps).toBe(2);
        expect(repeats).toBe(3);
    });
    test("singleton is both", () => {
        // 11
        const a = new ArithmeticSequence(
            11,
            14512,
            1
        );
        // 13
        const b = new ArithmeticSequence(
            13,
            124124,
            1
        );
        const { start, gaps, repeats } = mergeSequences(a, b);
        expect(start).toBe(11);
        expect(gaps).toBe(2);
        expect(repeats).toBe(2);
    });
});
describe("splitSequence", () => {
    test("functions correctly", () => {
        // 15, 18, 21, 24, 27, 30
        const seq = new ArithmeticSequence(
            15,
            3,
            6
        );
        const [a, b] = splitSequence(seq, 4);
        // 15, 18, 21, 24
        expect(a).toEqual(new ArithmeticSequence(
            15,
            3,
            4
        ));
        // 27, 30
        expect(b).toEqual(new ArithmeticSequence(
            27,
            3,
            2
        ));
    })
})
describe("mutateSimple", () => {
    test("randomly mutate an array", () => {

    });
    test("forced merge", () => {
        // 1   3
        const originalPartition = [
            new ArithmeticSequence(
                1,
                2315,
                1
            ),
            new ArithmeticSequence(
                3,
                346,
                1
            )
        ];
        const mutatedPartition = mutateSimple(originalPartition);
        expect(mutatedPartition.length).toBe(1);
        const [{ start, gaps, repeats }] = mutatedPartition;
        expect(start).toBe(1);
        expect(gaps).toBe(2);
        expect(repeats).toBe(2);
    })
    test("forced split", () => {
        // 1 - 3
        const originalPartition = [
            new ArithmeticSequence(
                1,
                2,
                2
            )
        ];
        const mutatedPartition = mutateSimple(originalPartition);
        expect(mutatedPartition.length).toBe(2);
        let [a, b] = mutatedPartition;
        if (a.start > b.start) [a, b] = [b, a];
        expect(a.start).toBe(1);
        expect(a.repeats).toBe(1);
        expect(b.start).toBe(3);
        expect(b.repeats).toBe(1);
    });
})
describe.skip("annealSubsequence", () => {
    test("simple", () => {
        const initialPartition = [
            new ArithmeticSequence(0, 1, 1),
            new ArithmeticSequence(1, 1, 1),
            new ArithmeticSequence(2, 1, 1),

            new ArithmeticSequence(8, 1, 1),
            new ArithmeticSequence(10, 1, 1),
            new ArithmeticSequence(12, 1, 1),

            new ArithmeticSequence(16, 1, 1),
            new ArithmeticSequence(19, 1, 1),
            new ArithmeticSequence(22, 1, 1),

            new ArithmeticSequence(24, 1, 1),
            new ArithmeticSequence(28, 1, 1),
            new ArithmeticSequence(32, 1, 1),
        ];
        annealSubsequence(initialPartition, mutateSimple);
    })
})
describe("intoSubSequencesGreedyLargestFirst", () => {
    test("grid-shaped", () => {
        const testCase = [
            0, 1, 2, 3,
            1000, 1002, 1004, 1006,
            2000, 2003, 2006, 2009,
            3000, 3004, 3008, 3012,
            4000, 4005, 4010, 4015,
        ];
        const optimizedValue = intoSubSequencesGreedyLargestFirst(testCase);
        const greedyValue = intoSubSequencesGreedy(testCase);
        console.log(optimizedValue.length);
        console.log(greedyValue.length);
        expect(optimizedValue.length).toBe(4);
    });
    test("random1", () => {
        const testCase = [
            4, 7, 8, 9, 10, 11, 14, 16, 18, 20
        ];
        const optimizedValue = intoSubSequencesGreedyLargestFirst(testCase);
        const greedyValue = intoSubSequencesGreedy(testCase);
        console.log(optimizedValue.length);
        console.log(greedyValue.length);
    });
    test("random2", () => {
        const testCase = [
            3, 9, 15, 24, 26, 27, 34, 38, 39, 40
        ];
        const optimizedValue = intoSubSequencesGreedyLargestFirst(testCase);
        const greedyValue = intoSubSequencesGreedy(testCase);
        console.log(optimizedValue.length);
        console.log(greedyValue.length);
    });
    test("random3", () => {
        const testCase = [
            2, 6, 10, 16, 20, 26, 29, 35, 38, 40, 54, 55, 62, 64, 71, 72, 74, 75, 78, 80
        ]
        const optimizedValue = intoSubSequencesGreedyLargestFirst(testCase);
        const greedyValue = intoSubSequencesGreedy(testCase);
        console.log(optimizedValue.length);
        console.log(greedyValue.length);
    });
    test("random4", () => {
        const testCase = [
            2, 9, 10, 15, 19, 22, 23, 25, 36, 40, 42, 49, 53, 54, 62, 64, 65, 68, 70, 73, 82, 85, 87, 89, 90, 92, 98, 99, 100, 101, 116, 119, 121, 126, 127, 129, 133, 142, 150, 158
        ]
        const optimizedValue = intoSubSequencesGreedyLargestFirst(testCase);
        const greedyValue = intoSubSequencesGreedy(testCase);
        console.log(optimizedValue.length);
        console.log(greedyValue.length);
    });
});