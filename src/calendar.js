import { calendar_v3, google } from 'googleapis';
import process from "process"
import { Block } from "./block.js";

const BASE_DATE = new Date("2024-03-31T00:00:00.000-04:00")

/**
 * 
 * @param {calendar_v3.Calendar} calendar 
 * @param {string} BLACK_ID 
 * @param {string} WHITE_ID 
 * @param {Block} _block 
 * @returns 
 */
export async function writeBlock(calendar, BLACK_ID, WHITE_ID, { start, end, order, color, day, repCount, repGap }) {
  // Example of recurrence: ['RRULE:FREQ=DAILY;UNTIL=20240728T035959Z;INTERVAL=2']

  const t_start = new Date(BASE_DATE);
  t_start.set
  t_start.setUTCDate(t_start.getUTCDate() + day);
  t_start.setMinutes(t_start.getMinutes() + start * 15);

  const t_end = new Date(t_start);
  t_end.setMinutes(t_end.getMinutes() + (end - start) * 15);
  t_start.setSeconds(t_start.getSeconds() + order);

  const t_rend = new Date(t_end);
  t_rend.setUTCDate(t_rend.getUTCDate() + (repCount - 1) * repGap)

  const s_start = t_start.toISOString()
  const s_end = t_end.toISOString()
  const s_rend = t_rend.toISOString()


  const rrule = `RRULE:FREQ=DAILY;COUNT=${repCount};INTERVAL=${repGap}`;
  // const rrule = `RRULE:FREQ=DAILY;COUNT=2;INTERVAL=1`;
  console.log(rrule);
  /** @type {calendar_v3.Schema$Event} */
  const event =  {
    summary: "a",
    start: {
      dateTime: s_start,
      timeZone: "GMT"
    },
    end: {
      dateTime: s_end,
      timeZone: "GMT"
    },
    recurrence: [
      rrule
    ]
  };
  const res = calendar.events.insert({
    calendarId: color ? WHITE_ID : BLACK_ID,
    resource: event
  });
  return res;
}



export function log(column, frame) {
  process.stdout.write(`\r[${".".repeat(column)}${" ".repeat(6 - column)}]` +
    `[${".".repeat(Math.ceil(frame/26.27))}${" ".repeat((2627-frame)/26.27|0)}]` +
    ` aka ${frame} / ${2627}`)
}

export async function writeFrame(calendar, blocks, frame) {

  // for (let column=0; column<7; column++) { 
    // for (const block of blocks[column]) {
      // await writeBlock(calendar, frame, column, block)
        // .then(() => log(column, frame), () => { console.log("DYING"); process.exit(0)})
    // }
  // }

}

function writeFrameToICSs(blocks, frame) {
  let white = ""
  let black = ""

  for (const block of blocks) {
    writeBlock(frame, block, event => {
      let stuff = "BEGIN:VEVENT\n"
      const start = new Date(event.start.dateTime).getTime()
      const end = new Date(event.end.dateTime).getTime()
      stuff += `DTSTAMP:${start}\n`
      stuff += `DTSTART:${start}\n`
      stuff += `DTEND:${end}\n`
      stuff += `SUMMART:${event.summary}\n`
      stuff += "END:VEVENT\n"
      if (event.colorId) black += stuff
      else white += stuff
    })
  }

  return [white, black]
}
