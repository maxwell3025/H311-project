const keypress = async () => {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    resolve();
  }))
};


console.log("Press any key to continue:")
await keypress().then(() => console.log("hi!"));
console.log("Press any key to continue:")
await keypress().then(() => console.log("hi!"));
console.log("Press any key to continue:")
keypress().then(() => console.log("a"));
console.log("Press any key to continue:")
keypress().then(() => console.log("b"));