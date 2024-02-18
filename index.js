const dir = "splitVideo";
import * as fs from 'node:fs';
import { png2PixelMatrix, scalePixelMatrix, printMatrix } from "./pixelManager.js";
import { SeperateTo7Days } from "./scaleMatrix.js";
import { authorize } from "./auth.js";
import { writeBlock, log } from './calendar.js';
import { buildCalendarColumn } from './eventManager.js';
import { google } from 'googleapis';
import process from "process"

const HEIGHT = 70;
const WIDTH = 49;

const auth = await authorize()
const calendar = google.calendar({version: 'v3', auth});

const CALENDAR_ID = (await calendar.calendarList.list()).data.items.filter(a => a.summary == "teest")[0].id

const keypress = async () => {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    resolve();
  }))
};

fs.readdir("./"+dir, async (_, files) => {

  let die = false
  const redo = []
  
  let total = 0;
  for (let i=746; i<916; i++) {
    const matrixBeforResize = png2PixelMatrix(dir+'/'+files[i]);
    const matrixAfterResize = scalePixelMatrix(matrixBeforResize, HEIGHT, WIDTH);
    const days = SeperateTo7Days(matrixAfterResize, WIDTH, HEIGHT)
    const blocks = days.map(day => buildCalendarColumn(day))

    for (let column=0; column<7; column++) { 
      total += blocks[column].length
      for (const block of blocks[column]) {
        while (die) {
          await new Promise(res => setTimeout(res, 10000))
          process.stdout.write("waiting 10s")
        }

        writeBlock(calendar, CALENDAR_ID, i, column, block).then(()=>{}, ()=> {
          redo.push([i, column, block])

          console.log("died\n");
          die = true
          // setTimeout(() => die = false, 60000)
          console.log("Press any key to continue:\n");
          keypress().then(() => {die = false})
        })
        log(column, i)

        await new Promise((res)=>setTimeout(res, 400))
        // total++
      }
    }
    // total += blocks.length
  }
  console.log(total)
  console.log("redoing :)")
  // for (let i=0; i<redo.length; i++) {
  //   console.log(`redoing ${redo[i]}`)
  //   await writeBlock(calendar, CALENDAR_ID, ...redo[i])
  // }
})
