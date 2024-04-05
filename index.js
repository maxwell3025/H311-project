const dir = "splitVideo";
import * as fs from 'node:fs/promises';
import { png2PixelMatrix, scalePixelMatrix, printMatrix } from "./src/pixelManager.js";
import { SeparateTo7Days } from "./scaleMatrix.js";
import { authorize } from "./src/auth.js";
import { writeBlock, log } from './src/calendar.js';
import { buildCalendarColumn } from './src/eventManager.js';
import { google } from 'googleapis';
import { Block } from './src/block.js';
import process from "process"
import readline from "node:readline/promises"

const HEIGHT = 70;
const WIDTH = 91;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})
const start = parseInt(await rl.question("start: "))
const end = parseInt(await rl.question("end: "))
const outfile = await rl.question("outfile: ")
rl.close()

const auth = await authorize()
const calendar = google.calendar({ version: 'v3', auth });

const CALENDAR_ID = (await calendar.calendarList.list()).data.items.filter(a => a.summary == "bad apple")[0].id
const WHITE_CALENDAR_ID = (await calendar.calendarList.list()).data.items.filter(a => a.summary == "bad")[0].id
const BLACK_CALENDAR_ID = (await calendar.calendarList.list()).data.items.filter(a => a.summary == "apple")[0].id

/*const keypress = async () => {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    resolve();
  }))
};*/


console.log("\nstarting\n");

const files = await fs.readdir("./" + dir);
let die = false
/** @type {Block[]} */
const eventQueue = []

for (let i = Math.max(start, 0); i < Math.min(end, files.length); i++) {
  const matrixBeforeResize = png2PixelMatrix(dir + '/' + (i + 1).toString().padStart(4, "0") + ".png");
  const matrixAfterResize = scalePixelMatrix(matrixBeforeResize, WIDTH, HEIGHT);
  const days = SeparateTo7Days(matrixAfterResize, WIDTH, HEIGHT)
  const blocks = days.map((dayData, index) => buildCalendarColumn(dayData, index + i * 7))
  eventQueue.push(...blocks.flat())
}

const MIN_DELAY = 1000;
const BACKOFF_FACTOR = 2;
const RELAXATION_FACTOR = 0.95;
let delay = MIN_DELAY;

let total = 0;
let currentFrame = 0;

while (eventQueue.length != 0) {
  /** @type {Block} */
  const newEvent = eventQueue.shift();
  await writeBlock(calendar, CALENDAR_ID, newEvent).then(() => {
    // Success
    delay = Math.max(MIN_DELAY, delay * RELAXATION_FACTOR);
    total++;
  }, err => {
    // Failure
    delay *= BACKOFF_FACTOR;
    eventQueue.push(newEvent);
    fs.appendFile(outfile, `${err}\n`);
    fs.appendFile(outfile, `Failed to write block ${JSON.stringify(newEvent)}\n`);
    fs.appendFile(outfile, `Delay increased to ${delay}ms\n`);
  });
  const frame = Math.floor(newEvent.day / 7);
  if (frame > currentFrame) {
    currentFrame = frame;
    fs.appendFile(outfile, `Completed ${frame - start}/${end - start}\n`)
  }
  await new Promise((res) => setTimeout(res, delay))
}

process.exit(0);
for (let i = start || 0; i < end || files.length; i++) {
  const matrixBeforeResize = png2PixelMatrix(dir + '/' + files[i]);
  const matrixAfterResize = scalePixelMatrix(matrixBeforeResize, WIDTH, HEIGHT);
  const days = SeparateTo7Days(matrixAfterResize, WIDTH, HEIGHT)
  const blocks = days.map(day => buildCalendarColumn(day))

  for (let column = 0; column < 7; column++) {
    total += blocks[column].length
    for (const block of blocks[column]) {
      while (die) {
        await new Promise(res => setTimeout(res, 6000))
        // process.stdout.write("waiting 10s")
      }

      writeBlock(calendar, CALENDAR_ID, i, column, block).then(() => { }, () => {
        redo.push([i, column, block])

        fs.appendFile(outfile, "died\n")
        die = true
        setTimeout(() => {
          fs.appendFile(outfile, "undied\n")
          die = false
        }, 30000)
        // console.log("Press any key to continue:\n");
        // keypress().then(() => {die = false})
      })
      // log(column, i)

      await new Promise((res) => setTimeout(res, 1000))
    }
    fs.appendFile(outfile, `frame ${i}/${end}\n`)
  }
}
fs.appendFile(outfile, "redoing\n")
for (let i = 0; i < redo.length; i++) {
  fs.appendFile(outfile, `redoing ${redo[i]}\n`)
  await writeBlock(calendar, CALENDAR_ID, ...redo[i])
}