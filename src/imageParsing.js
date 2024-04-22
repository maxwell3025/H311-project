import "dotenv";
import { readdir } from "fs/promises"
import { SeparateTo7Days } from "../scaleMatrix";
import { buildCalendarColumn } from "./eventManager";
import { png2PixelMatrix, resizePixelMatrix } from "./pixelManager";
import { optimizeRecurrences } from "./recurrenceOptimizer";

/**
 * 
 * @param {string} directory 
 * @param {number} startWeek 
 * @param {number} endWeek 
 * @returns 
 */
export async function parseImages(directory, startWeek, endWeek) {
    const files = await readdir(directory);

    /** @type {Block[]} */
    let eventQueue = []

    startWeek = Math.max(startWeek, 0);
    endWeek = Math.min(endWeek, files.length);
    for (let weekNumber = startWeek; weekNumber < endWeek; weekNumber++) {
        const matrixBeforeResize = png2PixelMatrix(directory + '/' + (weekNumber + 1).toString().padStart(4, "0") + ".png");
        const matrixAfterResize = resizePixelMatrix(matrixBeforeResize, process.env.WIDTH, process.env.HEIGHT);
        const days = SeparateTo7Days(matrixAfterResize, parseInt(process.env.WIDTH), parseInt(process.env.HEIGHT))
        const blocks = days.map((day, index) => buildCalendarColumn(day, index + weekNumber * 7))
        eventQueue.push(...blocks.flat())
    }
    eventQueue = optimizeRecurrences(eventQueue);
    eventQueue = eventQueue.toSorted((lhs, rhs) => lhs.day - rhs.day);
    return eventQueue;
}