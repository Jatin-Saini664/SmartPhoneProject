const process = require("process");

process.stdin.on('data', data => {
    console.log(`You typed ${data.toString()}`);
    process.exit();
  });