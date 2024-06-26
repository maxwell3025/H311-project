import {test, expect} from "bun:test";
import {buildCalendarColumn, halfLBlockOptimizer} from "../src/eventManager";

/**
 * 
 * @param {string} input 
 * @returns 
 */
function fastDefinition(input){
    return input.trim().split("\n").map(line => line.trim().split('').map(cell => cell === "1"))
}

test("circle", () => {
    const input = fastDefinition(`
    001100
    011110
    111111
    111111
    011110
    001100
    `)
    const output = buildCalendarColumn(input);
    expect(output.length).toBe(19)
});

test("creeper", () => {
    const input = fastDefinition(`
    00000000
    00000000
    01100110
    01100110
    00011000
    00111100
    00100100
    00100100
    `)
    const output = buildCalendarColumn(input);
    expect(output.length).toBe(29)
});

test("L-blocking on example", () => {
    const example = fastDefinition(`
    000000
    000000
    000000
    000000
    000000
    000111
    000111
    000111
    000011
    000011
    000011
    000111
    000000
    000111
    000000
    000111
    000000
    000111
    000000
    000111
    000000
    000111
    000000
    000111
    000000
    000111
    `);
    console.log(halfLBlockOptimizer(example, 1, 5).join("\n"));
});
