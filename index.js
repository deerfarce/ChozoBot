"use strict";

const path = require("path");
const readline = require("readline");
const fs = require("fs");
const procArgs = process.argv.slice(2);
const roomExp = new RegExp(/^[\w-]{1,30}$/);

let cfgname = "config.js";
let foundArgs = {};
let argAliases = {
  "--roomcfg": "-r"
}

for (var i = 0; i < procArgs.length; i++) {
  let ARG = procArgs[i];
  if (argAliases.hasOwnProperty(ARG))
    ARG = argAliases[ARG];
  if (!foundArgs[ARG]) {
    foundArgs[ARG] = true;
    switch (ARG) {
      case "-r":
        if (i+1 < procArgs.length && roomExp.test(procArgs[i+1])) {
          i++;
          cfgname = "config-" + procArgs[i] + ".js";
        } else {
          console.error("roomcfg: Invalid argument");
          return process.exit(1);
        }
        break;
      default:
        break;
    }
  } else {
    console.error(procArgs[i] + " used more than once");
    return process.exit(1);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let config = null;
try {
  config = require(path.join(__dirname, cfgname));
} catch (e) {
  if (e.code === "MODULE_NOT_FOUND") {
    let errText = cfgname + " not found!";
    console.error(errText);
    let date = new Date();
    let _errpath = path.join(__dirname, "errors");

    if (!fs.existsSync(_errpath)) {
      fs.mkdirSync(_errpath, {recursive: true});
    }

    fs.writeFileSync(path.join(_errpath, "error_" + date.getTime() + ".txt"), date.toGMTString() + "\n\n" + e.stack + "\n\n" + errText);
    setTimeout(function() {
      process.exit(1);
    }, 5000);
  } else
    onErr(e);
}
const ROOM = config.login.room;
if (!(roomExp.test(ROOM))) {
  console.error("Invalid channel name! Channel names must consist of 1-30 chars and only A-Z, a-z, 0-9, _ and -");
  return process.exit(1);
}
const scriptPath = config.advanced.scriptsInChannelFolder ? ROOM : "";
const logPath = path.join(__dirname, "logs", ROOM);
const errorPath = path.join(__dirname, "errors", ROOM);

if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, {recursive: true});
}
if (!fs.existsSync(errorPath)) {
  fs.mkdirSync(errorPath, {recursive: true});
}
const bot = require(path.join(__dirname, "lib", scriptPath, "bot.js")).init(config, rl, __dirname);

//catches uncaught exceptions
process.on('uncaughtException', onErr);

function onErr(err) {
  if (err.code) {
    if (err.code === "57P01" || err.code === "57P03") {
      if (bot && bot.db) {
        bot.db.onConnError(err);
      }
      return;
    } else if (err.code === "ECONNRESET" || err.message === "Connection terminated unexpectedly") {
      if (err.client && err.client.host === config.db.connectionInfo.host) {
        bot.db.onConnError(err);
        return;
      }
    }
  }

  var date = new Date();
  console.error(err.code);
  console.error(err.stack);
  fs.writeFileSync(path.join(__dirname, "errors", "error_" + date.getTime() + ".txt"), date.toGMTString() + "\n\nERROR CODE: " + (err.code ? err.code : "[none given]") + "\n\n" + err.stack);
  if (bot) bot.kill("Uncaught Exception, see error logs", 1000, 1);
  setTimeout(function() {
    process.exit(1);
  }, 5000);
}
