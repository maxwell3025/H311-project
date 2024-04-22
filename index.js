import "dotenv"
import { authorize } from "./src/auth.js";
import { writeBlock, backoff, createCalendar } from './src/calendar.js';
import { google } from 'googleapis';
import { Block } from './src/block.js';
import process from "process"
import readline from "node:readline/promises"
import { parseImages } from "./src/imageParsing.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const start = parseInt((await rl.question("start: ")) || "45");
const end = parseInt((await rl.question("end: ")) || "50");
rl.close();

const auth = await authorize();
const calendar = google.calendar({ version: 'v3', auth });

const BLACK_CALENDAR_ID = await createCalendar(calendar, process.env.BLACK_CALENDAR_NAME, "#ff0000");
const WHITE_CALENDAR_ID = await createCalendar(calendar, process.env.WHITE_CALENDAR_NAME, "#00ffff");

console.log("Building event list");

const eventQueue = await parseImages("./" + process.env.FRAME_DIRECTORY, start, end);

console.log(`Drawing weeks ${start} - ${end}`);

let total = 0;
let currentFrame = 0;

console.log(`${eventQueue.length} Requests needed`);
console.log(`Estimated duration is ${eventQueue.length * process.env.MIN_DELAY * 0.001}s`);

while (eventQueue.length != 0) {
  /** @type {Block} */
  const newEvent = eventQueue.shift();
  await backoff(writeBlock(calendar, BLACK_CALENDAR_ID, WHITE_CALENDAR_ID, newEvent)).then(
    () => { total++; },
    err => {
      eventQueue.push(newEvent);
      console.error(err);
      console.error(`Failed to write block ${JSON.stringify(newEvent)}`);
    }
  );

  currentFrame = Math.floor(newEvent.day / 7);
  const nextFrame = eventQueue.length === 0 ? null : Math.floor(eventQueue[0].day / 7);
  if (nextFrame === null || nextFrame === currentFrame + 1) {
    console.log(`Completed ${currentFrame - start + 1}/${end - start} frames`);
  }
}

console.log("Rendering complete");