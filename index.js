import "dotenv"
import { authorize } from "./src/auth.js";
import { writeBlock, backoff, createCalendar, uploadEvents } from './src/calendar.js';
import { google } from 'googleapis';
import { Block } from './src/block.js';
import process from "process"
import readline from "node:readline/promises"
import { parseImages } from "./src/imageParsing.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const auth = await authorize();
const calendar = google.calendar({ version: 'v3', auth });

const BLACK_CALENDAR_ID = await createCalendar(calendar, process.env.BLACK_CALENDAR_NAME, "#ff0000");
const WHITE_CALENDAR_ID = await createCalendar(calendar, process.env.WHITE_CALENDAR_NAME, "#00ffff");

const start = parseInt((await rl.question("start: ")) || "0");
const end = parseInt((await rl.question("end: ")) || "1000000000");

console.log("Building event list");

const eventQueue = await parseImages("./" + process.env.FRAME_DIRECTORY, start, end);

console.log(`Drawing weeks ${start} - ${end}`);
console.log(`${eventQueue.length} Requests needed`);
const confirmationText = await rl.question("confirm rendering(yes/no)? ");
rl.close();
if(confirmationText !== "yes") {
  process.exit(0);
}


await uploadEvents(calendar, eventQueue, BLACK_CALENDAR_ID, WHITE_CALENDAR_ID);

console.log("Rendering complete");