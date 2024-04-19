const dir = "splitVideo";
import * as fs from 'node:fs/promises';
import { png2PixelMatrix, scalePixelMatrix, printMatrix } from "./src/pixelManager.js";
import { SeparateTo7Days } from "./scaleMatrix.js";
import { authorize } from "./src/auth.js";
import { writeBlock, log } from './src/calendar.js';
import { buildCalendarColumn } from './src/eventManager.js';
import { calendar_v3, google } from 'googleapis';
import { Block } from './src/block.js';
import process from "process"
import readline from "node:readline/promises"
import { optimizeRecurrences } from './src/recurrenceOptimizer.js';

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

console.log("hi")
/**
 * 
 * @param {string} name 
 * @param {string} color 
 */
async function createCalendar(name, color) {
  if(!name.includes("Bad Apple")) throw new Error(`Name must contain "Bad Apple". Received "${name}" instead.`);

  let foregroundColor = color;
  if(foregroundColor !== "#000000" && foregroundColor !== "#ffffff"){
    foregroundColor = "#ffffff";
  }

  const oldCalendars = (await calendar.calendarList.list()).data.items.filter(a => a.summary === name);
  await Promise.all(oldCalendars.map(async oldCalendar => {
    await calendar.calendarList.delete({calendarId: oldCalendar.id})
  }));

  const newCalendar = { summary: name };
  const response = await calendar.calendars.insert({ requestBody: newCalendar });
  const calendarID = response.data.id;
  const calendarListEntry = {
    backgroundColor: color,
    foregroundColor,
    id: calendarID
  }
  const calendarListResponse = await calendar.calendarList.insert({ colorRgbFormat: true, requestBody: calendarListEntry})
  return calendarListResponse.data.id;
}

const BLACK_CALENDAR_ID = await createCalendar("bad [Bad Apple App]", "#ff0000");
const WHITE_CALENDAR_ID = await createCalendar("apple [Bad Apple App]", "#00ffff");

console.log("\nstarting\n");

const files = await fs.readdir("./" + dir);
let die = false
/** @type {Block[]} */
let eventQueue = []

for (let i = Math.max(start, 0); i < Math.min(end, files.length); i++) {
  const matrixBeforeResize = png2PixelMatrix(dir + '/' + (i + 1).toString().padStart(4, "0") + ".png");
  const matrixAfterResize = scalePixelMatrix(matrixBeforeResize, WIDTH, HEIGHT);
  const days = SeparateTo7Days(matrixAfterResize, WIDTH, HEIGHT)
  const blocks = days.map((dayData, index) => buildCalendarColumn(dayData, index + i * 7))
  eventQueue.push(...blocks.flat())
}

eventQueue = optimizeRecurrences(eventQueue);
eventQueue = eventQueue.toSorted((lhs, rhs) => lhs.day - rhs.day);

const MIN_DELAY = 100;
const MAX_DELAY = 2000;
const BACKOFF_FACTOR = 2;
const RELAXATION_FACTOR = 0.99;
let delay = MIN_DELAY;

let total = 0;
let currentFrame = 0;

fs.appendFile(outfile, `${eventQueue.length} Requests needed.\n`);
fs.appendFile(outfile, `Estimated duration is ${eventQueue.length * MIN_DELAY * 0.001}s\n`);

while (eventQueue.length != 0) {
  /** @type {Block} */
  const newEvent = eventQueue.shift();
  writeBlock(calendar, BLACK_CALENDAR_ID, WHITE_CALENDAR_ID, newEvent).then(() => {
    // Success
    delay = Math.max(MIN_DELAY, delay * RELAXATION_FACTOR);
    total++;
  }, err => {
    // Failure
    delay = Math.min(MAX_DELAY, delay * BACKOFF_FACTOR);
    eventQueue.push(newEvent);
    fs.appendFile(outfile, `${err}\n`);
    fs.appendFile(outfile, `Failed to write block ${JSON.stringify(newEvent)}\n`);
    fs.appendFile(outfile, `Delay increased to ${delay}ms\n`);
  });

  currentFrame = Math.floor(newEvent.day / 7);
  const nextFrame = eventQueue.length === 0 ? null : Math.floor(eventQueue[0].day / 7);
  if (nextFrame === null || nextFrame === currentFrame + 1) {
    fs.appendFile(outfile, `Completed ${currentFrame - start + 1}/${end - start} frames\n`)
  }

  await new Promise((res) => setTimeout(res, delay))
}

process.exit(0);