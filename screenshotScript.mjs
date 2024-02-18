// run `google-chrome --remote-debugging-port=21222` and navigate to google calendar for this to work

import puppeteer from "puppeteer";
import fs from "fs/promises";
const offset = 1620;
(async () => {
	await fs.mkdir("screenshots", { recursive: true });
	const browserURL = "http://127.0.0.1:21222";
	const browser = await puppeteer.connect({ browserURL });
	const pages = await browser.pages();
	const calendarPage = pages[0];
	await calendarPage.setViewport({
		width: 1500,
		height: 1000,
	});
	for (let i = 0; i < 393; i++) {
      await new Promise(r => setTimeout(r, 500));
		await calendarPage.screenshot({
			path: `screenshots/frame${i + offset}.png`,
		});
		await calendarPage.keyboard.press("j");
		await calendarPage.keyboard.press("j");
		await calendarPage.keyboard.press("k");
	}
	await browser.disconnect();
})();
