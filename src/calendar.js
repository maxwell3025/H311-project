import "dotenv";
import { calendar_v3 } from 'googleapis';
import { Block } from "./block.js";

const BASE_DATE = new Date("2024-03-31T00:00:00.000-04:00")

let delay = process.env.MIN_DELAY;
export async function backoff(prom) {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return await prom.then(
    res => {
      delay = Math.max(process.env.MIN_DELAY, delay * process.env.RELAXATION_FACTOR);
      return res;
    },
    err => {
      delay = Math.min(process.env.MAX_DELAY, delay * process.env.BACKOFF_FACTOR);
      console.error(`Delay increased to ${delay}ms`);
      return Promise.reject(err);
    }
  )
}

/**
 * Deletes an event from a calendar
 * @param {calendar_v3.Calendar} calendar 
 * @param {string} CALENDAR_ID 
 * @param {string} EVENT_ID 
 */
export async function deleteEvent(calendar, CALENDAR_ID, EVENT_ID) {
  console.log(`deleting event ${EVENT_ID}`);
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: EVENT_ID });
}

/**
 * Lists the events present in a calendar
 * @param {calendar_v3.Calendar} calendar 
 * @param {string} CALENDAR_ID 
 * @returns {calendar_v3.Schema$Event[]}
 */
export async function listEvents(calendar, CALENDAR_ID) {
  /** @type {calendar_v3.Params$Resource$Events$List} */
  const listParams = {
    calendarId: CALENDAR_ID,
    maxResults: 1000,
    showDeleted: false,
    singleEvents: true,
  }
  const result = await calendar.events.list(listParams);
  return result.data.items;
}

/**
 * clears a calendar
 * @param {calendar_v3.Calendar} calendar 
 * @param {string} CALENDAR_ID 
 */
async function clearCalendar(calendar, CALENDAR_ID) {
  const allOldEvents = await listEvents(calendar, CALENDAR_ID);
  console.log(`Deleting ${allOldEvents.length} events`);
  while (allOldEvents.length !== 0) {
    const e = allOldEvents.shift();
    await backoff(deleteEvent(calendar, CALENDAR_ID, e.id)).catch(
      () => allOldEvents.push(e)
    );
  }
}

/**
 * Creates a calendar with the given name and color
 * @param {calendar_v3.Calendar} calendar 
 * @param {string} name 
 * @param {string} color 
 */
export async function createCalendar(calendar, name, color) {
  if (!name.includes("Bad Apple")) throw new Error(`Name must contain "Bad Apple". Received "${name}" instead.`);

  let foregroundColor = color;
  if (foregroundColor !== "#000000" && foregroundColor !== "#ffffff") {
    foregroundColor = "#ffffff";
  }

  const calendarListResponse = await calendar.calendarList.list();
  const oldCalendars = calendarListResponse.data.items.filter(a => a.summary === name);
  if (oldCalendars.length >= 1) {
    await clearCalendar(calendar, oldCalendars[0].id);
    return oldCalendars[0].id;
  }

  const newCalendar = { summary: name };
  const response = await calendar.calendars.insert({ requestBody: newCalendar });
  const calendarID = response.data.id;
  const calendarListEntry = {
    backgroundColor: color,
    foregroundColor,
    id: calendarID
  }

  const calendarCreateResponse = await calendar.calendarList.insert({ colorRgbFormat: true, requestBody: calendarListEntry })
  return calendarCreateResponse.data.id;
}

/**
 * Writes a block onto the calendar
 * @param {calendar_v3.Calendar} calendar 
 * @param {string} BLACK_ID 
 * @param {string} WHITE_ID 
 * @param {Block} block 
 * @returns 
 */
export async function writeBlock(calendar, BLACK_ID, WHITE_ID, { start, end, order, color, day, repCount, repGap }) {

  const t_start = new Date(BASE_DATE);
  t_start.set
  t_start.setUTCDate(t_start.getUTCDate() + day);
  t_start.setMinutes(t_start.getMinutes() + start * 15);

  const t_end = new Date(t_start);
  t_end.setMinutes(t_end.getMinutes() + (end - start) * 15);
  t_start.setSeconds(t_start.getSeconds() + order);

  const s_start = t_start.toISOString()
  const s_end = t_end.toISOString()

  const rrule = `RRULE:FREQ=DAILY;COUNT=${repCount};INTERVAL=${repGap}`;
  console.log(rrule);
  /** @type {calendar_v3.Schema$Event} */
  const event = {
    summary: "a",
    start: {
      dateTime: s_start,
      timeZone: "GMT"
    },
    end: {
      dateTime: s_end,
      timeZone: "GMT"
    },
    recurrence: [rrule]
  };

  const res = calendar.events.insert({
    calendarId: color ? WHITE_ID : BLACK_ID,
    resource: event
  });
  return res;
}

/**
 * 
 * @param {calendar_v3.Calendar} calendar 
 * @param {Block[]} eventQueue 
 * @param {string} BLACK_CALENDAR_ID 
 * @param {string} WHITE_CALENDAR_ID 
 */
export async function uploadEvents(calendar, eventQueue, BLACK_CALENDAR_ID, WHITE_CALENDAR_ID) {
  let total = 0;
  let currentFrame = 0;
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
      console.log(`Completed ${currentFrame} frames`);
    }
  }
}