"use strict";

const C = require("cli-color");
const fs = require("fs");

const strings = require("./strings.js");
const api = require("./api.js");
const utils = require("./utils.js");

/*
  Here are commands that will execute if used in the terminal, for example:
    /say msg
  These default commands are mostly used for debugging purposes.

  "cmdname": function(bot, cmd [the cmd name used], message [the rest of the input after the command name]) {
    action when used;
  }

*/

var clicommands = {
  "exit": function(bot) {
    bot.kill("exit by user", 1000, 3);
  },
  "restart": function(bot) {
    bot.kill("restart by user", 1000, 0);
  },
  "say": function(bot, cmd, message) {
    bot.sendChatMsg(message, false, true, true);
  },
  "userinfo": function(bot, cmd, message) {
    if (message.trim() === "") return;
    let i = 0;
    for (;i<bot.CHANNEL.users.length;i++) {
      let user = bot.CHANNEL.users[i];
      if (message.toLowerCase() === user.name.toLowerCase()) {
        bot.logger.info(JSON.stringify(user));
      }
    }
  },
  "users": function(bot, cmd, message) {
    //logic from CyTube: https://github.com/calzoneman/sync/blob/f081bc782adba074052884995b90bc77dcef3338/www/js/util.js#L417
    function sortUserlist() {
      let userlist = bot.CHANNEL.users;
      userlist.sort(function(A,B) {
        let nameA = A.name.toLowerCase(),
          nameB = B.name.toLowerCase();
        let afkA = A.meta.afk,
          afkB = B.meta.afk;
        if (afkA && !afkB) return 1;
        if (!afkA && afkB) return -1;

        let rankA = A.rank,
          rankB = B.rank;
        if (rankA < rankB) return 1;
        if (rankA > rankB) return -1;

        if (nameA > nameB) return 1;
        if (nameA < nameB) return -1;
        return 0;
      });
    }
    sortUserlist();
    let i = 0,
      users = bot.CHANNEL.users,
      out = [];
    for (;i<users.length;i++) {
      out.push(utils.colorUsername(bot, users[i]));
    }
    bot.logger.info("Registered users online: " + out.join(", "));
  },
  "videolist": function(bot, cmd, message) {
    for (var i = 0; i < bot.CHANNEL.playlist.length; i++) {
      bot.logger.info(JSON.stringify(bot.CHANNEL.playlist[i]));
    }
  },
  "currentmedia": function(bot,cmd,message) {
    var cm = bot.CHANNEL.currentMedia;
    bot.logger.info(cm ? JSON.stringify(bot.CHANNEL.currentMedia) : "currentMedia appears to be empty.");
  },
  "readchanlog": function(bot, cmd, message) {
    bot.readChanLog();
  },
  "setname": function(bot, cmd, message) {
    if (bot.username === "" && !bot.guest) {
      if (!utils.isValidUserName(message)) {
        bot.logger.error("Invalid username. Must be 1-20 chars long and consist of -, _, or alphanumeric characters only.");
      } else {
        var fn = (()=>{
          bot.socket.emit("login", {
            name: message
          });
        });
        bot.actionQueue.enqueue([this, fn, []]);
      }
    }
  },
  "showbumpstats": function(bot, cmd, message) {
    let bs = bot.bumpStats;
    bot.logger.info(JSON.stringify(bs));
  },
  "memory": function(bot, cmd, message) {
    bot.logger.info(strings.format(bot, "MEMORY_USAGE", [(process.memoryUsage().heapUsed / 1024), "KB"]));
  },
  "subnet": function(bot, cmd, message) {
    if (message.trim() === "") return;
    let user = bot.getUser(message);
    if (user && user.meta.ip) {
      let matches = bot.matchSubnet(user.meta.ip, true);
      bot.logger.info(matches.length > 0 ? matches.join(", ") : "No matches found.");
    }
  },
  "setluck": function(bot,cmd,message) {
    if (message.trim() === "") return;
    let spl = message.split(" ");
    if (spl.length < 2) return;
    let user = bot.getUser(spl[0]);
    let luck = parseInt(spl[1]);
    if (user && !isNaN(luck)) {
      bot.settings.lucky[user.name] = luck;
      bot.logger.info("Set " + user.name + "'s luck to " + luck);
    }
  },
  "testalllogs": function(bot,cmd,message) {
    let logs = bot.logger;
    for (var i in logs) {
      logs[i]("Test message.");
    }
  },
  "disablecommands": function(bot, cmd, message) {
    bot.cfg.chat.disableAllCommands = true;
    bot.logger.info("Disabled commands.");
  },
  "enablecommands": function(bot, cmd, message) {
    bot.cfg.chat.disableAllCommands = false;
    bot.logger.info("Enabled commands.");
  },
  "mute": function(bot, cmd, message) { //TODO: make global mute/unmute functions that the chatcommands will also use
    if (!bot.getOpt("muted", false)) {
      bot.logger.mod(strings.format(bot, "BOT_MUTED", ["CLI user"]));
      bot.setOpt("muted", true);
    } else {
      bot.logger.warn("You're already muted.");
    }
  },
  "unmute": function(bot, cmd, message) {
    if (bot.getOpt("muted", false)) {
      bot.logger.mod(strings.format(bot, "BOT_UNMUTED", ["CLI user"]));
      bot.setOpt("muted", false);
    } else {
      bot.logger.warn("You're not muted.");
    }
  }
}

var aliases = {
  kill: "exit"
}

module.exports = {
  "exec":function(bot, input) {
    if (bot.killed) return;
    var split = input.split(" "),
      cmd = split.splice(0,1)[0].substr(1);
    if (aliases.hasOwnProperty(cmd) && !clicommands.hasOwnProperty(cmd)) {
      cmd = aliases[cmd];
    }
    cmd = cmd.toLowerCase();
    if (clicommands.hasOwnProperty(cmd)) {
      clicommands[cmd](bot, cmd, split.join(" "));
    } else {
      bot.logger.warn(strings.format(bot, "UNKNOWN_CLI_COMMAND", [C.yellow("/" + cmd)]));
    }
  }
}
