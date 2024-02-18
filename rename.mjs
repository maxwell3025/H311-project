import {glob} from "glob"
import {rename} from "fs"
const frameList = await glob("screenshots/frame*.png")
console.log(frameList)
frameList.forEach(badName => {
    const number = badName.slice(17, -4);
    console.log(number.padStart(4, "0"))
    const goodName = `screenshots/frame${number.padStart(4, "0")}.png`
    console.log(goodName)
    rename(badName, goodName, () => {})
})
