import { test, expect } from "bun:test"
import { intoSubSequencesGreedy } from "../src/recurrenceOptimizer"

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