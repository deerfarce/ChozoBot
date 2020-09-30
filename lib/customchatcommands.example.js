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
    "testcommand": new Command({
      cmdName: "testcommand",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 2000,
      cmdCooldown: 2000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      bot.sendChatMsg("Test command working!");
    })
  }

  var aliases = {
    testcmd: "testcommand"
  }

  return {commands: commands, aliases: aliases}
}

module.exports = {
  getCommands:getCommands
}
