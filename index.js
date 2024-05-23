const mineflayer = require('mineflayer');
const fs = require('fs');

// Function to read and parse config.json safely
function readConfig() {
  try {
    let rawdata = fs.readFileSync('config.json');
    return JSON.parse(rawdata);
  } catch (error) {
    console.error('Error reading config.json:', error);
    return null;
  }
}

const data = readConfig();
if (!data) {
  process.exit(1); // Exit if config is not found or invalid
}

const host = data["ip"];
const username = data["name"];
const moveinterval = 2; // 2-second movement interval
const maxrandom = 5; // 0-5 seconds added to movement interval (randomly)
const actions = ['forward', 'back', 'left', 'right'];

let lasttime = -1;
let connected = false; // Use boolean to track connection state
let lastaction;

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function createBot() {
  const bot = mineflayer.createBot({
    host: host,
    username: username,
  });

  bot.on('login', function () {
    console.log("Logged In");
    connected = true;
    setTimeout(() => {
      bot.chat("/gamemode spectator");
      console.log("Attempted to switch to spectator mode. Checking...");
    }, 30000); // Wait 30 seconds before trying to switch to spectator mode
  });

  bot.on('spawn', function () {
    connected = true;
  });

  bot.on('death', function () {
    bot.emit("respawn");
  });

  bot.on('kicked', function (reason) {
    console.log("Bot was kicked from the server. Reason:", reason);
    connected = false;
    setTimeout(createBot, 10000); // Reconnect after 10 seconds
  });

  bot.on('end', function () {
    console.log("Bot has been disconnected. Reconnecting...");
    connected = false;
    setTimeout(createBot, 10000); // Reconnect after 10 seconds
  });

  bot.on('error', function (err) {
    console.log("Error occurred:", err);
    connected = false;
    setTimeout(createBot, 10000); // Retry after 10 seconds on error
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    console.log(`${username}: ${message}`);

    if (message.includes('switched to Spectator mode')) {
      console.log("Bot is now in spectator mode. Starting to move...");
      startMoving(bot);
    }
  });

  bot.on('time', function () {
    if (!connected) return;

    const currentTime = new Date().getTime();
    if (lasttime < 0 || currentTime - lasttime > (moveinterval * 1000 + Math.random() * maxrandom * 1000)) {
      lastaction = actions[Math.floor(Math.random() * actions.length)];
      bot.setControlState(lastaction, true);
      setTimeout(() => bot.setControlState(lastaction, false), 1000); // Move for 1 second
      lasttime = currentTime;
    }
  });
}

function startBot() {
  console.log("Attempting to log in...");
  createBot(); // Attempt to create a bot instance
}

// Continuous login attempts
function attemptLogin() {
  startBot(); // Start attempting to log in
}

// Begin attempting to log in
attemptLogin();
