"use strict";

/*
  Use this file to define custom commands, especially room-centric ones.
  Try to avoid editing chatcommands.js so future updates won't erase your edits.

  Rename this file to customchatcommands.js to use it, OR if the advanced
  configuration setting "useChannelCustomCommands" is true, rename this to
  customchatcommands-roomname.js instead.

  You can also rename this to customchatcommands-(anything).js and edit your
  configuration file accordingly. Within your config, refer to:
    advanced.customCommandsToLoad
  There is more information in the configuration file on how to set this up.

  See chatcommands.js for more information on creating commands.
*/

const C = require("cli-color");

const utils = require("./utils.js");
const strings = require("./strings.js");
const api = require("./api.js");
const Command = require("./chatcommands.js").Command;

function getCommands(bot) {
  var commands = {
    "gdqschedule": new Command({
      cmdName: "gdqschedule",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 600000,
      cmdCooldown: 300000,
      isActive: false,
      requiredChannelPerms: ["pollctl"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      api.APIcall(bot, "gdq", null, null, function(status, data, ok) {
        if (ok) {
          let schedule = [], i = 0, now = Date.now();
          let items = data.data.items;
          for (;i < items.length && schedule.length < 6; i++) {
            let time = (items[i].scheduled_t+items[i].length_t)*1000;
            if (time > now) {
              schedule.push(items[i]);
            }
          }
          if (schedule.length > 0) {
            let item = schedule[0];
            let title = "now: " + item.data[0] + ", " + item.data[3] + " (runner: "+item.data[1]+", est: "+item.data[2]+")";
            let options = [], i = 1;
            for (;i < schedule.length; i++) {
              let item = schedule[i];
              options.push(new Date(item.scheduled_t*1000).toGMTString().split(" ")[4] + " UTC: " + item.data[0] + ", " + item.data[3] + " (runner: "+item.data[1]+", est: "+item.data[2]+")");
            }
            bot.openPoll({
              title: title,
              opts: options,
              obscured: false
            });
          }
        }
      });
    })
  }

  var aliases = {}

  return {commands: commands, aliases: aliases}
}

module.exports = {
  getCommands:getCommands
}
