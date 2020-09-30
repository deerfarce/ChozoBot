"use strict";

/*
  Avoid editing this file to prevent erasure of edits by future updates.
  See customchatcommands.example.js for a bit more info.
*/

const C = require("cli-color");
const ent = require("html-entities").AllHtmlEntities;

const utils = require("./utils.js");
const strings = require("./strings.js");
const api = require("./api.js");

var chatCommands = {};
/*
  Define command aliases here as:
    alias: commandName
*/
var aliases = {
  kill: "exit",
  closepoll: "endpoll",
  ec: "emotecount",
  uec: "useremotecount",
  ud: "urbandictionary",
  seen: "lastseen",
  ask: "8ball",
  accept: "acceptduel",
  decline: "declineduel",
  choose: "pick",
  lang: "language",
  ipban: "ban"
}
module.exports = {};

function createCommands(bot) {
  if (bot.handlingChatCommands) return false;
  bot.logger.debug(strings.format(bot, "COMMAND_CREATING"));

  /*
    Command object definition. Receives data as a key/value object of multiple
    variables and a function which is executed when the command is called.

    Key name and cmdName MUST be lowercase.

    data - Object.
      cmdName - String. MUST match the name of the command's key in the commands
        object. Ignoring this will cause issues.
      minRank - Float. Target rank to compare the user's rank to. Uses rankMatch.
      rankMatch - String, but only <=, ==, or >=. Defines how minRank will be
        evaluated. If <=, the command will only exec for users with a rank less
        than or equal to minRank, and so on.
      userCooldown - Integer. Amount of time in milliseconds before the same
        user can use this command again (each command has their own independent
        cooldown; overlaps with cmdCooldown)
      cmdCooldown - Integer. Amount of time in milliseconds before anyone can
        use this command again. Differs from userCooldown in that the cooldown
        is not for each single user independently, but for everyone.
      isActive - Boolean. Determines if the command is active at start. Can be
        enabled later through the enable command.
      requiredChannelPerms - Array. List of channel perms (see bottom of bot.js
        for descriptions on these permissions) required for the command to run.
        Example: ["chat", "seeplaylist"]
      allowRankChange - Boolean. Determines if the command's rank may be changed
        or overridden, especially with the setrank command.
      canBeUsedInPM - Boolean. Determines if the command can be used within a
        private message.
    fn - Function. The action performed when the command is called.

    Failure to assign all of these values correctly will result in a broken
    command which will not run until fixed and the bot is restarted. Broken
    commands will be error logged and cannot be enabled.
  */


  /**
   * Command object definition. Receives data as a key/value object of multiple variables and a function which is executed when the command is called.
   * @constructor
   * @param  {Object} data Object of command properties. See comment in file for more info
   * @param  {Function} fn   Command action
   */
  function Command(data, fn) {
    this.cmdName = data.cmdName;
    this.minRank = parseFloat(data.minRank);
    this.rankMatch = data.rankMatch;
    this.userCooldown = parseInt(data.userCooldown);
    this.cmdCooldown = parseInt(data.cmdCooldown);
    this.isActive = utils.parseBool(data.isActive);
    this.requiredChannelPerms = data.requiredChannelPerms;
    this.allowRankChange = utils.parseBool(data.allowRankChange);
    this.canBeUsedInPM = utils.parseBool(data.canBeUsedInPM);
    this.fn = fn;
    this.broken = false;

    this.defaultRank = this.minRank;
    this.defaultRankMatch = this.rankMatch;
    this.defaultCmdCooldown = this.cmdCooldown;
    this.defaultUserCooldown = this.userCooldown;
    this.defaultActiveState = this.isActive;

    if (!Array.isArray(this.requiredChannelPerms)
        || typeof this.cmdName !== "string"
        || typeof this.rankMatch !== "string"
        || this.cmdName === ""
        || !isValidRankMatch(this.rankMatch)
        || null === this.allowRankChange
        || null === this.isActive
        || null === this.canBeUsedInPM
        || isNaN(this.minRank)
        || isNaN(this.userCooldown)
        || isNaN(this.cmdCooldown)
        || this.cmdName.toLowerCase() !== this.cmdName
        || typeof fn !== "function") {
      bot.logger.error(strings.format(bot, "COMMAND_INVALID", [this.cmdName]));
      this.isActive = false;
      this.broken = true;
    } else if (!this.isActive) {
      bot.logger.warn(strings.format(bot, "COMMAND_INACTIVE", [this.cmdName]));
    }
  }

  Command.prototype.lastUse = 0;

  //Put commands below as a key/value pair.
  //Template:
  /*
      "<NAME>": new Command({
        cmdName: "<NAME>",
        minRank: bot.RANKS.USER,
        rankMatch: ">=",
        userCooldown: 2000,
        cmdCooldown: 500,
        isActive: true,
        requiredChannelPerms: [],
        allowRankChange: true,
        canBeUsedInPM: true
      }, function (cmd, user, message, opts) {
        //do something
      })
  */
  var commands = {
    "8ball": new Command({
      cmdName: "8ball",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 30000,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      if (message === "") return false;
      var answers = ["It is certain", "It is decidedly so", "Without a doubt",
        "Yes - definitely", "You may rely on it", "As I see it, yes", "Most likely",
        "Outlook good", "Signs point to yes", "Yes", "Ask again later", "Better not tell you now",
        "Cannot predict now", "Don't count on it", "My reply is no", "My sources say no",
        "Outlook not so good", "Very doubtful", "Never", "Of course not", "Of course! /4u"];
      var answer = answers[Math.floor(Math.random() * answers.length)];
      bot.sendChatMsg(strings.format(bot, "CHAT_EIGHTBALL", [message, answer]));
      return true;
    }),
    "about": new Command({
      cmdName: "about",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 120000,
      cmdCooldown: 60000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      bot.sendChatMsg(bot.botName + " v" + bot.version + " :: written by biggles- :: https://github.com/deerfarce/ChozoBot", false, false);
      return true;
    }),
    "acceptduel": new Command({
      cmdName: "acceptduel",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let duel = bot.getUserDuel(user.name, false);
      if (duel && duel[0] !== user.name) {
        bot.getUserDuel(user.name, true);
        return bot.commenceDuel(duel);
      }
      return false;
    }),
    /*
    "addfromplaylist": new Command({
      cmdName: "addfromplaylist",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 20000,
      cmdCooldown: 10000,
      isActive: false,
      requiredChannelPerms: ["playlistadd"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      Add videos using the youtubeplaylist API method
    }),
    */
    "allow": new Command({
      cmdName: "allow",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let target = message.split(" ")[0];
      if (utils.isValidUserName(target) && callerOverTargetRank(user, target)) {
        let success = bot.allowUser(target);
        if (success) bot.sendPM(user.name, target + " allowed.");
      }
      return false;
    }),
    "anagram": new Command({
      cmdName: "anagram",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 3000,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      var msg = message.trim();
      if (7<=msg.length && msg.length<=30) {
        api.APIcall(bot, "anagram", msg, null, function(status, data, ok) {
          if (!ok || !data) return false;
          bot.sendChatMsg(strings.format(bot, "ANAGRAM_RESULT", [msg, ent.decode(utils.removeExcessWhitespace(utils.removeHtmlTags(data[1])))]));
        });
        return true;
      } else {
        bot.sendChatMsg(strings.format(bot, "ANAGRAM_BAD_LENGTH", [7, 30]));
      }
      return false;
    }),
    "ban": new Command({
      cmdName: "ban",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: ["ban", "chat"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      return disciplineUser(user, cmd, "ipban", message.trim());
    }),
    "blacklist": new Command({
      cmdName: "blacklist",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["playlistdelete"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let spl = message.split(" "),
        result = false,
        op = "add",
        name = "";
      if (spl.length >= 2 && spl[0].toLowerCase() === "/remove" && utils.isValidUserName(spl[1])) {
        result = bot.setUserBlacklistState(spl[1], false);
        name = spl[1];
        op = "remove";
      } else if (spl[0] && utils.isValidUserName(spl[0])) {
        result = bot.setUserBlacklistState(spl[0], true);
        name = spl[0];
      }
      if (result) {
        if (op === "add") {
          bot.sendPM(user.name, strings.format(bot, "BLACKLIST_SUCCESS", [name]));
          bot.logger.mod(user.name + " blacklisted " + name);
          bot.purgeUser(name);
        } else {
          bot.sendPM(user.name, strings.format(bot, "BLACKLIST_REMOVE_SUCCESS", [name]));
          bot.logger.mod(user.name + " removed " + name + " from the blacklist.");
        }
      } else {
        if (op === "add")
          bot.sendPM(user.name, strings.format(bot, "BLACKLIST_FAIL", [name]));
        else
          bot.sendPM(user.name, strings.format(bot, "BLACKLIST_REMOVE_FAIL", [name]));
      }
      return result;
    }),
    "blacklistvid": new Command({
      cmdName: "blacklistvid",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["playlistdelete", "seeplaylist"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let spl = message.split(" "),
        state = true,
        result = false,
        media = null;
      if (spl[0]) {
        if (spl[0].toLowerCase() === "/remove") {
          spl.splice(0,1);
          state = false;
          if (spl.length <= 0) return false;
        }
        let match = spl[0].match(/^(\w\w)\:([\w\/\.\:]+?)$/i);
        if (match) {
          media = {id: match[2], type: match[1].toLowerCase()};
          result = bot.setMediaBlacklistState(media, state);
        } else {
          let pos = parseInt(spl[0]);
          if (!isNaN(pos)) {
            pos--;
            let pl = bot.CHANNEL.playlist;
            if (pos < 0 || pos >= pl.length) return false;
            media = {id: pl[pos].media.id, type: pl[pos].media.type.toLowerCase()};
            result = bot.setMediaBlacklistState(pl[pos], state);
          }
        }
      } else {
        let cm = bot.CHANNEL.currentMedia;
        if (cm) {
          media = {id: cm.id, type: cm.type};
          result = bot.setMediaBlacklistState(cm, true);
        }
      }
      let shortMedia = "";
      if (media) shortMedia = utils.formatLink(media.id, media.type, true);
      if (result) {
        if (state && media) {
          bot.deleteVideoAndDupes(media);
          bot.sendPM(user.name, strings.format(bot, "BLACKLIST_SUCCESS", [shortMedia]));
          bot.logger.mod(user.name + " blacklisted " + shortMedia);
        } else if (!state) {
          bot.sendPM(user.name, strings.format(bot, "BLACKLIST_REMOVE_SUCCESS", [shortMedia]));
          bot.logger.mod(user.name + " removed " + shortMedia + " from the blacklist.");
        }
      } else if (shortMedia !== "") {
        if (state) {
          bot.sendPM(user.name, strings.format(bot, "BLACKLIST_FAIL", [shortMedia]));
        } else {
          bot.sendPM(user.name, strings.format(bot, "BLACKLIST_REMOVE_FAIL", [shortMedia]));
        }
      }
      return result;
    }),
    "bump": new Command({
      cmdName: "bump",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 10000,
      cmdCooldown: 5000,
      isActive: true,
      requiredChannelPerms: ["seeplaylist", "playlistmove"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {

      const BUMP_CAP = bot.cfg.media.bumpCap;
      const BUMP_COOLDOWN = bot.cfg.media.bumpCooldown;

      let playlist = bot.CHANNEL.playlist;
      let explicitPos = false;

      let spl = message.split(" ");
      let vidObj = null;
      let bumpPos = BUMP_CAP;
      let getPos = true;

      if (message.trim() !== "") {
        //See if the very first arg is a number
        let _pos = parseInt(spl[0]);
        if (!isNaN(_pos)) {
          //If it's a number, then check if it's a valid name as some people have
          //numeric usernames
          if (utils.isValidUserName(spl[0])) {
            //Find the user's video
            vidObj = findLastMedia(spl[0]);
            //If no video found, interpret as a self bump to the given position
            if (!vidObj) {
              vidObj = findLastMedia(user.name);
              bumpPos = _pos;
              explicitPos = true;
              getPos = false;
            }
          }
        } else if (utils.isValidUserName(spl[0])) {
          vidObj = findLastMedia(spl[0]);
        }
        if (getPos && spl[1]) {
          let _pos = parseInt(spl[1]);
          if (isNaN(_pos) || _pos > playlist.length) {
            bot.sendPM(user.name, "bump: Invalid position given. Usage: " + bot.trigger + this.cmdName + " [user] [position]");
            return false;
          } else {
            explicitPos = true;
            bumpPos = _pos;
          }
        }
      } else {
        vidObj = findLastMedia(user.name);
      }
      if (bumpPos < BUMP_CAP) bumpPos = BUMP_CAP;
      //Decrement because we're expecting users to provide indexes based on
      //how they see the playlist on CyTube (1-based index)
      //..but also another time because we want to put it after a video
      bumpPos -= 2;
      if (!vidObj || bumpPos + 2 >= playlist.length || bumpPos < 0) return false;
      const TARGETUSER = vidObj.media.queueby;
      if (bot.disallowed(TARGETUSER)) {
          bot.sendPM(user.name, TARGETUSER + " is disallowed.");
          return false;
      }
      if (bot.bumpStats.users.hasOwnProperty(TARGETUSER)) {
          let timeSinceLast = Date.now() - bot.bumpStats.users[TARGETUSER];
          if (timeSinceLast < BUMP_COOLDOWN) {
              bot.sendPM(user.name, TARGETUSER + " was last bumped " + timeSinceLast/1000 + " seconds ago. You can try bumping this user again in " + ((BUMP_COOLDOWN - timeSinceLast)/1000) + " seconds.");
              return false;
          }
      }
      let bumpReference = playlist[bumpPos],
        lastBumped = bot.bumpStats.lastBumpedUIDs;
      if (lastBumped.length > 0) {
        let last_index = lastBumped.length-1;
        for (;last_index >= 0;last_index--) {
          let index = bot.getMediaIndex(lastBumped[last_index]);
          if (!~index || index < BUMP_CAP - 1) {
            lastBumped.splice(last_index, 1);
            continue;
          } else if (~index && index >= BUMP_CAP - 1 && index < playlist.length)
            bumpReference = playlist[index];
            break;
        }
      }
      if (!bumpReference || bumpReference.uid === vidObj.media.uid) return false;
      if (!explicitPos && vidObj.media.media.seconds > 600) {
          bot.sendPM(user.name, "Video Over 10 minutes - please specify a position to bump to or "+bot.trigger+"vidya if video games")
          return false;
      }
      bot.bumpStats.users[TARGETUSER] = Date.now();
      bot.logger.mod(strings.format(bot, "BUMP_LOG", [
        "BUMP",
        utils.formatLink(vidObj.media.media.id, vidObj.media.media.type, true),
        TARGETUSER,
        user.name,
        (vidObj.index+1),
        (bumpPos+2)
      ]));
      bot.bumpStats.lastBumpedUIDs.push(vidObj.media.uid);
      bot.bumpStats.bumpingUIDs.push(vidObj.media.uid);
      bot.moveMedia(vidObj.media.uid, bumpReference.uid);
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.bump_stats) {
        let column = "others";
        if (TARGETUSER === user.name) column = "self";
        bot.db.run("bumpCount", [user.name, column]);
      }
      return true;
    }),
    "cleanemotedb": new Command({
      cmdName: "cleanemotedb",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 60000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
        bot.db.run("getStoredEmotes", null, function(res) {
          if (res && res.rowCount > 0) {
            let i = 0,
              rows = res.rows,
              unused = [];
            for (;i < rows.length; i++) {
              if (!bot.emoteExists(rows[i])) {
                unused.push(rows[i]);
              }
            }
            if (unused.length <= 0) {
              bot.sendChatMsg(strings.format(bot, "DB_EMOTES_CLEANED_NONE", [user.name]));
            } else {
              bot.db.run("cleanUnusedEmotes", [unused], function() {
                bot.sendChatMsg(strings.format(bot, "DB_EMOTES_CLEANED", [user.name]));
              });
            }
          }
        });
        return true;
      }
      return false;
    }),
    "clearcooldownoverrides": new Command({
      cmdName: "clearcooldownoverrides",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      var spl = message.split(" ");
      if (spl.length >= 1 && spl[0].trim() !== "") {
        const COMMAND = resolveCmdName(spl[0]);
        if (COMMAND) {
          COMMAND.userCooldown = COMMAND.defaultUserCooldown;
          COMMAND.cmdCooldown = COMMAND.defaultCmdCooldown;
          delete bot.settings.cmdCooldownOverrides[COMMAND.cmdName];
          delete bot.settings.userCooldownOverrides[COMMAND.cmdName];
          bot.writeSettings();
          bot.sendPM(user.name, "Cooldowns have been reset for " + COMMAND.cmdName + ".");
          bot.logger.mod("Cooldowns for " + COMMAND.cmdName + " reset by " + user.name);
          return true;
        } else {
          bot.sendPM(user.name, "That command does not exist.");
        }
      } else {
        bot.sendPM(user.name, "You must provide a command name.");
      }
      return false;
    }),
    "clearrankoverrides": new Command({
      cmdName: "clearrankoverrides",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      var spl = message.split(" ");
      return resetRank(spl[0], user);
    }),
    "clearemotecount": new Command({
      cmdName: "clearemotecount",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 60000,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
        bot.db.run("deleteUserEmotes", [user.name], function() {
          bot.sendPM(user.name, strings.format(bot, "DB_EMOTES_ERASED", [bot.trigger]));
        });
        return true;
      }
      return false;
    }),
    "clearquotes": new Command({
      cmdName: "clearquotes",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 60000,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.chat) {
        bot.db.run("deleteUserChat", [user.name], function() {
          bot.sendPM(user.name, strings.format(bot, "DB_QUOTES_ERASED", [bot.trigger]));
        })
        return true;
      }
      return false;
    }),
    "comment": new Command({
      cmdName: "comment",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 3000,
      cmdCooldown: 3000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {

      function extractComment(comments) {
        let comment = comments.length > 1 ? comments[Math.floor(Math.random() * comments.length)] : comments[0];
        if (comment.snippet && comment.snippet.topLevelComment && comment.snippet.topLevelComment.snippet) {
          let cchild = comment.snippet.topLevelComment.snippet;
          return {
            author: ent.decode(utils.removeExcessWhitespace(utils.removeHtmlTags(cchild.authorDisplayName))),
            text: ent.decode(utils.removeExcessWhitespace(utils.removeHtmlTags(cchild.textOriginal)))
          };
        }
        return null;
      }

      var currentMedia = bot.CHANNEL.currentMedia;
      if (!currentMedia || currentMedia.type !== "yt") {
        bot.sendPM(user.name, "A YouTube video must be playing to get a random comment.");
        return false;
      }
      let cvd = bot.currentVideoData,
        authorCode = bot.cfg.chat.filters.commentAuthor,
        ID = currentMedia.id;
      if (ID === cvd.id && (cvd.comments !== null || cvd.commentsDisabled)) {
        if (!cvd.comments) return false;
        if (cvd.commentsDisabled) {
          bot.sendChatMsg(strings.format(bot, "API_YT_COMMENTSDISABLED"));
          return true;
        } else if (cvd.comments.length <= 0) {
          bot.sendChatMsg(strings.format(bot, "API_YT_NOCOMMENTS"));
          return true;
        } else {
          let comment = extractComment(cvd.comments);
          if (!comment) return false;
          bot.sendChatMsg("["+authorCode+"]**<" + comment.author + ">**[/"+authorCode+"] " + comment.text);
          return true;
        }
      } else {
        if (bot.gettingComments) {
          bot.sendPM(user.name, "The bot is currently getting the list of comments. Try again in a few seconds. If this persists, this is an issue.");
          return false;
        }
        bot.gettingComments = true;
        api.APIcall(bot, "youtubecomments", ID, bot.cfg.api.youtube_key, function (status, data) {
          cvd.id = ID;
          if (!status) {
            bot.gettingComments = false;
            return false;
          }
          if (status === true && data && data.items) {
            cvd.comments = data.items;
            bot.gettingComments = false;
            if (data.items.length < 1) {
              return bot.sendChatMsg(strings.format(bot, "API_YT_NOCOMMENTS"));
            }
            let comment = extractComment(data.items);
            if (!comment) return true;
            bot.sendChatMsg("["+authorCode+"]**<" + comment.author + ">**[/"+authorCode+"] " + comment.text);
            return true;
          } else if (!data || (data && (!data.items || (data.error && data.error.errors)))) {
            if (status === 403) {
              if (data && data.error && data.error.errors && data.error.errors[0]["reason"]) {
                var reason = data.error.errors[0]["reason"];
                if (reason === "commentsDisabled") {
                  cvd.commentsDisabled = true;
                  bot.gettingComments = false;
                  return bot.sendChatMsg(strings.format(bot, "API_YT_COMMENTSDISABLED"));
                } else {
                  bot.gettingComments = false;
                  return bot.logger.error(strings.format(bot, "API_YT_ERROR", ["youtubecomments", status, reason]));
                }
              }
            }
            bot.gettingComments = false;
            return bot.sendPM(user.name, "Error getting comments. Is a YouTube video playing?");
          }
        });
      }
      return true;
    }),
    "cooldown": new Command({
      cmdName: "cooldown",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 2000,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {

      const help = ()=>{
        bot.sendPM(user.name, bot.trigger + this.cmdName + " commandname (global,cmd)|user duration: Sets the cooldown duration for a given command.");
      }

      let spl = message.split(" ");
      if (spl.length > 0) {
        let cmdName = spl[0].toLowerCase();
        if (cmdName === "") {
          help();
          return false;
        }
        const COMMAND = resolveCmdName(cmdName);
        if (COMMAND) {
          if (COMMAND.broken) {
            bot.sendPM(user.name, "That command is broken. Tell the bot maintainer.");
            return false;
          }
          if (spl.length > 2) {
            let type = spl[1].toLowerCase();
            let duration = parseInt(spl[2]);
            if (isNaN(duration)) {
              help();
              return false;
            } else if (duration < 0) {
              bot.sendPM(user.name, "Invalid duration. Must be 0 or higher.");
              return false;
            }
            let overrides = null,
              old_cooldown = -1;
            if (type === "global" || type === "cmd") {
              old_cooldown = COMMAND.cmdCooldown;
              COMMAND.cmdCooldown = duration;
              bot.sendPM(user.name, "Set the global cooldown for " + cmdName + " to " + duration/1000 + " seconds.");
              overrides = bot.settings.cmdCooldownOverrides;
              type = "cmd"; //simplify for later because we allow different inputs here
            } else if (type === "user") {
              old_cooldown = COMMAND.userCooldown;
              COMMAND.userCooldown = duration;
              bot.sendPM(user.name, "Set the user cooldown for " + cmdName + " to " + duration/1000 + " seconds.");
              overrides = bot.settings.userCooldownOverrides;
            } else {
              help();
              return false;
            }
            if (overrides) {
              if ((type === "cmd" && duration === COMMAND.defaultCmdCooldown) ||
                  (type === "user" && duration === COMMAND.defaultUserCooldown)) {
                delete overrides[COMMAND.cmdName];
              } else {
                overrides[COMMAND.cmdName] = duration;
              }
              bot.logger.mod(user.name + "changed the cooldown ("+type+") for " + COMMAND.cmdName + ": " + old_cooldown + " => " + duration);
              bot.writeSettings();
            }
            return true;
          } else {
            help();
            return false;
          }
        } else {
          bot.sendPM(user.name, "That command, " + cmdName + ", doesn't exist.");
          return false;
        }
      }
      return false;
    }),
    "declineduel": new Command({
      cmdName: "declineduel",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let duel = bot.getUserDuel(user.name, true);
      if (duel && duel[1] === user.name) {
        bot.sendChatMsg(strings.format(bot, "DUEL_DECLINE", [user.name, duel[0], "/data"]));
        return true;
      }
      return false;
    }),
    "deletepoll": new Command({
      cmdName: "deletepoll",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 10000,
      cmdCooldown: 5000,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.saved_polls) {
        let name = message.trim();
        if (name.length < 1 || name.length > 30) {
          bot.sendPM(user.name, "Poll name must be 1-30 characters.");
        } else {
          bot.db.run("deletePoll", [user.name, name], function(res) {
            if (res.rowCount <= 0) {
              bot.sendPM(user.name, "That poll either does not exist, or was not saved by you.");
            } else {
              bot.sendPM(user.name, "Poll deleted: " + name);
            }
          })
          return true;
        }
      }
      return false;
    }),
    "disable": new Command({
      cmdName: "disable",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      return disable(bot, message.split(" ")[0].toLowerCase(), user.name);
    }),
    "disallow": new Command({
      cmdName: "disallow",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let target = message.split(" ")[0];
      if (utils.isValidUserName(target) && callerOverTargetRank(user, target)) {
        let success = bot.disallowUser(target);
        if (success) bot.sendPM(user.name, target + " disallowed.");
      }
      return false;
    }),
    "duel": new Command({
      cmdName: "duel",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 5000,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let target = message.split(" ")[0].toLowerCase();
      var invalidNames = ["", bot.username.toLowerCase(), user.name.toLowerCase()];
      if (~invalidNames.indexOf(target) || bot.userIsBot(target) || bot.disallowed(target)) return false;
      let targetUser = bot.getUser(target);
      if (targetUser && targetUser.rank >= bot.RANKS.USER) {
        let callerDuel = bot.getUserDuel(user.name);
        if (!callerDuel) {
          let targetDuel = bot.getUserDuel(targetUser.name);
          if (!targetDuel) {
            let timeout = setTimeout(function() {
              let duel = bot.getUserDuel(user.name, true);
              if (duel) bot.sendChatMsg(strings.format(bot, "DUEL_EXPIRED", [user.name, targetUser.name]));
            }, 120000);
            bot.duels.push([user.name, targetUser.name, timeout]);
            bot.sendChatMsg(strings.format(bot, "DUEL_BEGIN", [targetUser.name, user.name, bot.trigger, "acceptduel", "declineduel"]))
          } else {
            bot.sendPM(user.name, strings.format(bot, "DUEL_PM_INDUEL"));
          }
        } else {
          if (callerDuel[0] === user.name) {
            bot.sendPM(user.name, strings.format(bot, "DUEL_PM_CALLERWAITING", [callerDuel[1]]));
          } else {
            bot.sendPM(user.name, strings.format(bot, "DUEL_PM_TARGETWAITING", [callerDuel[0]]));
          }
        }
        return true;
      }
      return false;
    }),
    "duelrecord": new Command({
      cmdName: "duelrecord",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 5000,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.duel_stats) {
        bot.db.run("getDuelRecord", [user.name], function(res) {
          let wins = 0, losses = 0, winRate = "0%";
          if (res && res.rowCount > 0) {
            let row = res.rows[0];
            wins = row.wins;
            losses = row.losses;
            if (wins > 0)
              winRate = (100 * wins / (wins + losses)).toFixed(2) + "%";
          }
          bot.sendChatMsg(strings.format(bot, "DUEL_RECORD", [user.name, wins, losses, winRate]));
        });
        return true;
      } else {
        bot.sendPM(user.name, "The duel statistics database table is currently disabled.");
      }
      return false;
    }),
    "echo": new Command({
      cmdName: "echo",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      bot.sendChatMsg(message, false, false);
      return true;
    }),
    "emotecount": new Command({
      cmdName: "emotecount",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 5000,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
        var spl = message.split(" ");
        if (spl[0] !== "" && bot.emoteExists(spl[0])) {
          bot.db.run("getEmoteTotalCount", [spl[0]], function(res) {
            if (res && res.rowCount > 0 && res.rows[0].sum != null) {
              var row = res.rows[0];
              bot.sendChatMsg(strings.format(bot, "CHAT_EC_USED", [spl[0], row.sum, (row.sum == 1 ? "time" : "times")]));
            } else {
              bot.sendChatMsg(strings.format(bot, "CHAT_EC_NOTUSED", [spl[0]]));
            }
          });
          return true;
        }
      }
      return false;
    }),
    "enable": new Command({
      cmdName: "enable",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      return enable(bot, message.split(" ")[0].toLowerCase(), user.name);
    }),
    "endpoll": new Command({
      cmdName: "endpoll",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 1000,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["pollctl"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      bot.socket.emit("closePoll");
      bot.logger.mod(strings.format(bot, "POLL_CLOSED_CMD", [user.name]));
      return true;
    }),
    "exit": new Command({
      cmdName: "exit",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      bot.handlingChatCommands = false;
      bot.kill("exit issued via chat by " + user.name, 1000, 3);
      return true;
    }),
    "flatskiprate": new Command({
      cmdName: "flatskiprate",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 5000,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let skipopts = bot.getOpt("flatSkiprate", {
          managing: false,
          target: -1,
          original_rate: -1
        }
      ),
        spl = message.split(" "),
        help = bot.trigger + this.cmdName + " skip_target|off - Enables flat skiprate with skip_target (number above 0) as the desired amount of skips, or disables if \"off\" is given.";
      if (spl.length >= 1) {
        if (spl[0].toLowerCase() === "off") {
          if (skipopts.managing) {
            skipopts.managing = false;
            skipopts.original_rate = -1;
            bot.setOpt("flatSkiprate", skipopts);
            let msg = "No longer managing flat skiprate.";
            if (skipopts.original_rate < 0) {
              msg += " However, there was no valid original skiprate stored. It has been set to 50%.";
              bot.setChannelOpts({voteskip_ratio: 0.5});
            } else {
              bot.setChannelOpts({voteskip_ratio: skipopts.original_rate});
            }
            bot.sendPM(user.name, msg);
            bot.logger.mod(user.name + " disabled automatic flat skiprate.");
            return true;
          } else {
            bot.sendPM(user.name, "Automatic flat skiprate is currently disabled. Provide the desired amount of skips instead to enable it.");
          }
        } else {
          let target = parseInt(spl[0]);
          if (isNaN(target) || target <= 0) {
            bot.sendPM(user.name, help);
          } else {
            let was_managing = skipopts.managing,
              same_target = skipopts.target === target;
            skipopts.managing = true;
            if (skipopts.original_rate < 0)
              skipopts.original_rate = bot.CHANNEL.opts.voteskip_ratio;
            skipopts.target = target;
            bot.setOpt("flatSkiprate", skipopts);
            let success = bot.setFlatSkiprate();
            if (success) {
              if (was_managing) {
                if (same_target) {
                  bot.sendPM(user.name, "Already managing flat skiprate with that target.");
                } else {
                  bot.sendPM(user.name, "Already managing flat skiprate, but the target amount has been changed.");
                  bot.logger.mod(user.name + " changed flat skiprate target to " + target);
                }
              } else {
                bot.sendPM(user.name, "Now managing flat skiprate with a target skip amount of " + target);
                bot.logger.mod(user.name + " enabled flat skiprate with a target of " + target);
              }
            } else {
              bot.sendPM(user.name, "Unable to begin managing skiprate. Check if I'm a mod.");
            }
            return success;
          }
        }
      } else {
        bot.sendPM(user.name, help);
      }
      return false;
    }),
    "getchanlog": new Command({
      cmdName: "getchanlog",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 60000,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      bot.readChanLog();
      return true;
    }),
    "gettimeban": new Command({
      cmdName: "gettimeban",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let spl = message.split(" ");
      if (spl.length <= 0 || !utils.isValidUserName(spl[0])) return false;
      let timeban = bot.userIsTimebanned(spl[0]),
        timeLeft = (timeban ? (timeban.unbanTime - Date.now()) / 1000 : 0);
      if (timeban) {
        if (timeLeft < 60) {
          bot.sendPM(user.name, strings.format(bot, "TIMEBAN_SOON", [spl[0]]));
        } else {
          bot.sendPM(user.name, strings.format(bot, "TIMEBAN_TIME", [spl[0], utils.secsToTime(timeLeft, true)]));
        }
        return true;
      } else {
        bot.sendPM(user.name, strings.format(bot, "TIMEBAN_NONE", [spl[0]]));
      }
      return false;
    }),
    "img": new Command({
      cmdName: "img",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 30000,
      cmdCooldown: 5000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      let code = bot.cfg.chat.filters.img,
        spoilerTagOpener = bot.cfg.chat.filters.spoilerTagOpener,
        spoilerTagCloser = bot.cfg.chat.filters.spoilerTagCloser;
      if (!code || code === "") {
        bot.sendPM(user.name, "The chatfilter for " + this.cmdName + " is not set up yet. Tell an admin.");
        return false;
      }
      let spl = message.split(" ");
      if (spl.length <= 0) return false;
      let spoiler = false;
      if (spl[0].toLowerCase() === "spoiler") {
        spoiler = true;
        spl.shift();
        if (!spoilerTagOpener || !spoilerTagCloser || spoilerTagOpener === "" || spoilerTagCloser === "") {
          bot.sendPM(user.name, "The chatfilter for spoilers is not set up yet. Tell an admin.");
          return false;
        }
      }
      let link = utils.parseImageLink(spl[0]);
      if (link) {
        let final = link + "." + code;
        if (spoiler) {
          final = spoilerTagOpener + final + spoilerTagCloser;
        }
        if (final.length > 320) {
          bot.sendPM(user.name, "That link is too long, especially with the filters.");
          return false;
        }
        bot.sendChatMsg(final);
        return true;
      }
      return false;
    }),
    "isblacklisted": new Command({
      cmdName: "isblacklisted",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let spl = message.split(" ");
      if (spl.length <= 0) return false;
      if (utils.isValidUserName(spl[0])) {
        let isBlacklisted = ~bot.settings.userBlacklist.indexOf(spl[0].toLowerCase());
        if (isBlacklisted) {
          bot.sendPM(user.name, spl[0] + " is a blacklisted user.");
        } else {
          bot.sendPM(user.name, spl[0] + " is not blacklisted.");
        }
        return true;
      } else {
        let match = spl[0].match(/^(\w\w)\:([\w\/\.\:]+?)$/i);
        if (match) {
          let media = {id: match[2], type: match[1].toLowerCase()};
          if (bot.mediaIsBlacklisted(media)) {
            bot.sendPM(user.name, spl[0] + " is blacklisted media.");
          } else {
            bot.sendPM(user.name, spl[0] + " is not blacklisted.");
          }
          return true;
        }
      }
      return false;
    }),
    "kick": new Command({
      cmdName: "kick",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: ["kick", "chat"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      return disciplineUser(user, cmd, "kick", message.trim());
    }),
    /*
      TODO: make sure you can't traverse paths with this

    "language": new Command({
      cmdName: "language",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 6000,
      cmdCooldown: 2000,
      isActive: false,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let lang = message.toLowerCase().split(" ");
      if (!lang[0] || ((lang[0].length < 2 || lang[0].length > 3) && lang[0] !== "reset")) {
        bot.sendPM(user.name, "Invalid language. Must be 2-3 chars.");
      } else {
        bot.pendingLanguageChange = lang[0];
        return true;
      }
      return false;
    }),
    */
    "lastseen": new Command({
      cmdName: "lastseen",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 2000,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (!bot.cfg.db.useTables.users) return false;
      let out = (msg) => {
        if (opts.isPM) bot.sendPM(user.name, msg);
        else bot.sendChatMsg(msg);
      }
      var spl = message.split(" ");
      if (utils.isValidUserName(spl[0])) {
        var _user = bot.getUser(spl[0]);
        if (_user) {
          out(strings.format(bot, "CHAT_LS_INROOM", [_user.name]));
          return true;
        } else {
          bot.db.run("getLastSeen", [spl[0]], function(res) {
            if (res && res.rowCount > 0 && res.rows[0].last_seen != null) {
              var row = res.rows[0];
              out(strings.format(bot, "CHAT_LS_LASTSEEN", [row.uname, utils.getUTCTimeStringFromDate(row.last_seen)]));
            } else {
              out(strings.format(bot, "CHAT_LS_NOTSEEN", [spl[0]]));
            }
          });
          return true;
        }
      }
      return false;
    }),
    "loadpoll": new Command({
      cmdName: "loadpoll",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 20000,
      cmdCooldown: 10000,
      isActive: true,
      requiredChannelPerms: ["pollctl"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.saved_polls) {
        let name = message.trim();
        let first = name.split(" ")[0],
          timeout = 0;
        if (first && first.toLowerCase().indexOf("time:") === 0) {
          name = name.substr(first.length+1);
          let time = first.substr(5);
          if (!~time.indexOf(":")) {
            let parsed = parseInt(time);
            if (!isNaN(parsed)) timeout = parsed;
          } else {
            timeout = utils.timecodeToSecs(time);
          }
        }
        if (name.length >= 1 && name.length <= 30) {
          bot.db.run("getPoll", [name], function(res) {
            if (res && res.rows.length > 0) {
              let row = res.rows[0],
                opts = null;
              try {
                opts = JSON.parse(row.options);
              } catch (e) {
                bot.sendPM(user.name, "That poll was found, but its options are malformed.");
              }
              if (!opts) return false;
              let poll = {
                title: row.title,
                opts: opts,
                obscured: row.obscured
              }
              if (timeout > 0) poll.timeout = Math.min(86400, timeout);
              bot.openPoll(poll);
            } else {
              bot.sendPM(user.name, "No poll found with the name: " + name);
            }
          })
          return true;
        } else {
          bot.sendPM(user.name, "Poll name must be 1-30 characters.");
        }
      }
      return false;
    }),
    "memoryusage": new Command({
      cmdName: "memoryusage",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      bot.sendChatMsg(strings.format(bot, "MEMORY_USAGE", [(process.memoryUsage().heapUsed / 1024), "KB"]));
    }),
    "modmsg": new Command({
      cmdName: "modmsg",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 8000,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      bot.broadcastModPM(message);
      return true;
    }),
    "mute": new Command({
      cmdName: "mute",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 1000,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (!bot.getOpt("muted", false)) {
        bot.logger.mod(strings.format(bot, "BOT_MUTED", [user.name]));
        return bot.setOpt("muted", true);
      }
      return false;
    }),
    "nameban": new Command({
      cmdName: "nameban",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: ["ban", "chat"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      return disciplineUser(user, cmd, "ban", message.trim());
    }),
    "pick": new Command({
      cmdName: "pick",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 5000,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      let choices = message.split(";"),
        i = 0,
        filtered = [];
      for (;i < choices.length; i++) {
        if (choices[i].length > 0)
          filtered.push(choices[i]);
      }
      if (filtered.length <= 1) {
        bot.sendPM(user.name, "You must have at least two things to pick from! Separate choices with a ;");
        return false;
      } else {
        let choice = filtered[Math.floor(Math.random() * filtered.length)];
        bot.sendChatMsg(user.name + ": " + choice.trim());
        return true;
      }
      return false;
    }),
    "purge": new Command({
      cmdName: "purge",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 10000,
      isActive: true,
      requiredChannelPerms: ["playlistdelete"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let spl = message.split(" ");
      let out = (msg) => {
        if (opts.isPM) bot.sendPM(user.name, msg);
        else bot.sendChatMsg(msg);
      }
      if (utils.isValidUserName(spl[0])) {
        let result = bot.purgeUser(spl[0], true);
        if (result) {
          out(strings.format(bot, "USER_PURGED", [spl[0]]));
        }
        return result;
      }
      return false;
    }),
    "quote": new Command({
      cmdName: "quote",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 20000,
      cmdCooldown: 10000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.chat) {
        var spl = message.split(" ");
        if (spl[0].toLowerCase() === bot.username.toLowerCase() || !utils.isValidUserName(spl[0]) || bot.userIsBot(spl[0]) || bot.getSavedUserData(spl[0]).quoteExempt) return false;
        bot.db.run("getRandomChat", [spl[0]], function(res) {
          if (res && res.rowCount > 0) {
            var row = res.rows[0];
            if (/^\/me /.test(row.msg))
              bot.sendChatMsg(strings.format(bot, "CHAT_QUOTE_ME", [utils.getUTCDateStringFromDate(row.time), row.uname, row.msg.substr(4)]));
            else
              bot.sendChatMsg(strings.format(bot, "CHAT_QUOTE", [utils.getUTCDateStringFromDate(row.time), row.uname, row.msg]));
          }
        });
        return true;
      }
      return false;
    }),
    "quotes": new Command({
      cmdName: "quotes",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 500,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      var opt = "quoteExempt";
      var exempt = bot.getSavedUserData(user.name)[opt];
      var spl = message.toLowerCase().split(" ");
      if (spl[0] === "on" && exempt) {
        bot.setUserDataOpt(user.name, opt, false);
        bot.sendPM(user.name, strings.format(bot, "QUOTE_ON_PM", [bot.trigger]));
      } else if (spl[0] === "off" && !exempt) {
        bot.setUserDataOpt(user.name, opt, true);
        bot.sendPM(user.name, strings.format(bot, "QUOTE_OFF_PM", [bot.trigger]));
      } else {
        bot.sendPM(user.name, strings.format(bot, "QUOTE_NO_ARG_PM", [exempt ? "exempt" : "not exempt", bot.trigger, this.cmdName]));
      }
      return true;
    }),
    "restart": new Command({
      cmdName: "restart",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      bot.handlingChatCommands = false;
      bot.kill("restart issued via chat by " + user.name, 2000, 0);
      return true;
    }),
    "roll": new Command({
      cmdName: "roll",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 10000,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      var splitmsg = message.trim().split(" ");
      var sndmsg = "";
      var dicereg = /^(\d{1,2})?d(\d{1,3})(?:(\+|\-)(\d{1,3}))?/i;
      if (splitmsg[0] && dicereg.test(splitmsg[0])) {
        var d, rolls, sides, op, offset, sum;
        d = splitmsg[0].match(dicereg);
        if (!d) return false;
        rolls = parseInt(d[1]);
        sides = parseInt(d[2]);
        op = d[3];
        offset = parseInt(d[4]);
        if (isNaN(offset)) offset = 0;
        if (isNaN(rolls))
          rolls = 1;
        else if (rolls > 15 || rolls < 1)
          rolls = 2;
        if (sides > 999 || sides < 2)
          sides = 6;
        sum = 0;
        var eachRoll = [];
        var max = rolls * sides;
        sndmsg = user.name + ' rolled ' + rolls + "d" + sides;
        if (op && offset) {
          sndmsg += op + offset;
        }
        sndmsg += ": ";
        for (var i = rolls; i >= 1; i--) {
          var roll = Math.floor((Math.random() * sides) + 1);
          sum += roll;
          eachRoll.push(roll);
        }
        if (rolls > 1 && !offset && sum === max) {
          sndmsg = '[3d]' + sndmsg + 'PERFECT ' + sum.toString() + '[/3d]  /gigago';
        } else {
          if (op === "+") {
            sum += offset;
          } else if (op === "-") {
            sum -= offset;
          }
          sndmsg += sum.toString();
          if (rolls > 1) sndmsg += " {" + eachRoll.join(",") + "}";
        }
      } else {
        var roll = 2;
        var combos = ['DUBS: ', 'TRIPS: ', 'QUADS: ', 'QUINTS!!: ', 'SEXTS!!: ', 'SEPTS!!: ', 'OCTS!!!: ', 'NONS!!!!:', 'DECS!!!! HOLY SHIT: '];
        var dig = parseInt(splitmsg[0]);
        if (!isNaN(dig) && dig > 0 && dig < 11) roll = dig;
        let bestRoll = {num: "", checkem: -1};
        let DoRoll = function() {
          let rollnum = Math.floor(Math.random() * Math.pow(10, roll)).toString();
          rollnum = "0".repeat(roll - rollnum.length) + rollnum;
          let j = 0,
            i,
            repeatcheck = rollnum[rollnum.length - 1];
          for (i = (rollnum.length - 1); i > -1; i--) {
            if (rollnum[i] === repeatcheck)
              j++;
            else
              break;
          }
          if (j > bestRoll.checkem) bestRoll = {num: rollnum, checkem: j};
          else if (j === bestRoll.checkem && rollnum > bestRoll.num) bestRoll.num = rollnum
        }
        DoRoll();
        let luck = bot.settings.lucky[user.name];
        if (luck) {
          delete bot.settings.lucky[user.name];
          bot.writeSettings();
          while (luck > 0) {
            DoRoll();
            luck--;
          }
        }
        if (bestRoll.checkem > 1 && combos[bestRoll.checkem - 2] !== undefined) {
          sndmsg = '[3d]' + user.name + ' rolled ' + combos[bestRoll.checkem - 2] + bestRoll.num + '[/3d]';
          var comboEmotes = ["/go", "/slowgo", "/gigago", "/wow2", "/push", "/praise", "/stop", "/wut2", "/alarm /cantwakeup /alarm2"];
          if (comboEmotes[bestRoll.checkem - 2] !== undefined) sndmsg += '  ' + comboEmotes[bestRoll.checkem - 2];
        } else {
          sndmsg = user.name + ' rolled: ' + bestRoll.num;
        }
      }
      if (sndmsg !== "") {
        bot.sendChatMsg(sndmsg);
        return true;
      }
      return false;
    }),
    "roomtime": new Command({
      cmdName: "roomtime",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 20000,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users) {
        let out = (msg) => {
          if (opts.isPM) bot.sendPM(user.name, msg);
          else bot.sendChatMsg(msg);
        }
        let spl = message.split(" "),
          username = user.name;
        if (spl.length >= 1 && utils.isValidUserName(spl[0])) {
          username = spl[0];
        }
        bot.updateUserRoomTime(username, true, function() {
          bot.db.run("getUserRoomTime", [username], function(res) {
            if (res && res.rows && res.rows[0]) {
              var rows = res.rows[0];
              if (rows.hasOwnProperty("first_seen") && rows.hasOwnProperty("room_time") && rows.hasOwnProperty("afk_time")) {
                if (rows.room_time > 0) {
                  let first_seen = utils.getUTCTimeStringFromDate(rows.first_seen),
                    total_time = utils.secsToTime(Math.floor(rows.room_time), true),
                    active_time = utils.secsToTime(Math.floor(rows.room_time - rows.afk_time), true),
                    percent_active = (((rows.room_time - rows.afk_time) / rows.room_time)*100).toFixed(2);
                  out(strings.format(bot, "CHAT_ROOMTIME", [username, first_seen, total_time, active_time, percent_active]));
                } else {
                  let first_seen = utils.getUTCTimeStringFromDate(rows.first_seen);
                  out(strings.format(bot, "CHAT_ROOMTIME_ONLYSEEN", [username, first_seen]));
                }
              }
            } else {
              out(strings.format(bot, "CHAT_LS_NOTSEEN", [username]));
            }
          });
        });
        return true;
      }
      return false;
    }),
    "savepoll": new Command({
      cmdName: "savepoll",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 10000,
      cmdCooldown: 5000,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.saved_polls) {
        let poll = bot.getCurrentPollFrame(),
          name = message.trim(),
          first = name.split(" ")[0];
        if (!poll) {
          bot.sendPM(user.name, strings.format(bot, "SAVEPOLL_ERR_NOACTIVE"));
        } else if (first && first.toLowerCase().indexOf("time:") === 0) {
          bot.sendPM(user.name, strings.format(bot, "SAVEPOLL_ERR_STARTSWITHTIME"));
        } else if (name.length < 1 || name.length > 30) {
          bot.sendPM(user.name, strings.format(bot, "SAVEPOLL_ERR_NAMELENGTH", [1,30]));
        } else if (poll.opts.length > 10) {
          bot.sendPM(user.name, strings.format(bot, "SAVEPOLL_ERR_OPTLENGTH", [10]));
        } else {
          bot.db.run("insertPoll", [user.name, name, poll.title, poll.obscured, JSON.stringify(poll.opts)], function(res) {
            if (res.rowCount <= 0) {
              bot.sendPM(user.name, strings.format(bot, "SAVEPOLL_ERR_NOTUNIQUE"));
            } else {
              bot.sendPM(user.name, strings.format(bot, "SAVEPOLL_SUCCESS", [name]));
            }
          })
          return true;
        }
      }
      return false;
    }),
    "seekto": new Command({
      cmdName: "seekto",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 6000,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (!bot.leader && !bot.checkChannelPermission("leaderctl")) {
        bot.sendPM(user.name, strings.format(bot, "LEADER_NOPERM"));
        return false;
      }
      let cm = bot.CHANNEL.currentMedia;
      if (!cm) return false;
      let spl = message.split(" ");
      if (spl.length > 0 && spl[0]) {
        bot.seek.autoUnassign = false;
        let time = utils.timecodeToSecs(spl[0]);
        if (time < 0) {
          bot.sendPM(user.name, strings.format(bot, "TIMECODE_BADFORMAT"));
          return false;
        } else if (time > cm.seconds) {
          bot.sendPM(user.name, strings.format(bot, "SEEK_TOOFAR"));
          return false;
        } else if (bot.leader) {
          bot.startLeadTimer();
          bot.sendVideoUpdate(time);
          return true;
        } else {
          bot.seek.time = time;
          bot.seek.autoUnassign = true;
          bot.assignLeader(bot.username);
          return true;
        }
      }
      return false;
    }),
    "selfpurge": new Command({
      cmdName: "selfpurge",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 3600000,
      cmdCooldown: 10000,
      isActive: false,
      requiredChannelPerms: ["seeplaylist", "playlistdelete"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (msg.trim() !== "") {
        bot.sendPM(user.name, strings.format(bot, "SELFPURGE_NOARG", [bot.trigger]));
        return false;
      }
      let currentVidIsUsers = false,
        pl = bot.CHANNEL.playlist,
        name = user.name.toLowerCase();

      if (pl.length <= 0) {
        return false;
      }

      let finalize = function(message) {
        bot.sendChatMsg(strings.format(bot, "USER_PURGED", [user.name]));
        bot.sendPM(user.name, message);
        return true;
      }

      let currentVid = bot.getMedia(bot.CHANNEL.currentUID);
      if (currentVid && currentVid.queueby.toLowerCase() === name) currentVidIsUsers = true;

      if (currentVidIsUsers) {
        let i = 0;
        for (;i < pl.length; i++) {
          if (pl[i].uid !== bot.CHANNEL.currentUID && pl[i].queueby.toLowerCase() === name)
            bot.deleteVideo(pl[i].uid);
        }
        return finalize(strings.format(bot, "SELFPURGE_SEMISUCCESS"));
      } else {
        bot.sendChatMsg("/clean " + user.name, false, true);
        return finalize(strings.format(bot, "SELFPURGE_SUCCESS"));
      }
      return false;
    }),
    "selfremove": new Command({
      cmdName: "selfremove",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 40000,
      cmdCooldown: 20000,
      isActive: true,
      requiredChannelPerms: ["seeplaylist", "playlistdelete"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let splitmsg = message.trim().split(" ");
      if (splitmsg.length <= 0) {
        bot.sendPM(user.name, strings.format(bot, "SELFREMOVE_USAGE", [bot.trigger, this.cmdName]));
        return false;
      }
      let video = false,
        pos = -1,
        pl = bot.CHANNEL.playlist,
        name = user.name.toLowerCase();
      var findVideo = function(dir) {

        let action = function(idx) {
          if (pl[idx].queueby.toLowerCase() === name) {
            pos = idx;
            return pl[idx];
          }
          return -1;
        }

        if (dir === "descending") {
            let i = 0;
            for (; i < pl.length; i++) {
                let media = action(i);
                if (~media) return media;
            }
        } else if (dir === "ascending") {
            var i = pl.length - 1;
            for (; i >= 0; i--) {
                let media = action(i);
                if (~media) return media;
            }
        }
        return false;
      }
      if (splitmsg[0].toLowerCase() === "first") {
          video = findVideo("descending");
      } else if (splitmsg[0].toLowerCase() === "last") {
          video = findVideo("ascending");
      } else {
          pos = parseInt(splitmsg[0]);
          if (isNaN(pos) || pos - 1 < 0 || pos - 1 >= pl.length) {
              bot.sendPM(user.name, strings.format(bot, "PLAYLIST_INVALID_POSITION"));
              return false;
          }
          video = pl[pos - 1];
      }
      if (!video) {
        bot.sendPM(user.name, strings.format(bot, "PLAYLIST_VIDEONOTFOUND"));
        return false;
      }
      if (video.queueby.toLowerCase() === name) {
          if (video.uid === bot.CHANNEL.currentUID) {
              bot.sendPM(user.name, strings.format(bot, "SELFREMOVE_ERR_ACTIVE"));
          } else {
              bot.sendPM(user.name, strings.format(bot, "SELFREMOVE_SUCCESS", [pos]));
              bot.deleteVideo(video.uid);
              return true;
          }
      } else {
          bot.sendPM(user.name, strings.format(bot, "SELFREMOVE_ERR_NOTYOURS", [pos]));
      }
      return false;
    }),
    "setrank": new Command({
      cmdName: "setrank",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      var spl = message.split(" ");
      return setRank(spl[0], spl[1], user);
    }),
    "setrankmatch": new Command({
      cmdName: "setrankmatch",
      minRank: bot.RANKS.ADMIN,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      var spl = message.split(" ");
      return setRankMatch(spl[0], spl[1], user);
    }),
    "shuffle": new Command({
      cmdName: "shuffle",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 2000,
      isActive: true,
      requiredChannelPerms: ["playlistshuffle"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      if (message.trim() === "") {
        bot.socket.emit("shufflePlaylist");
        return true;
      } else {
        bot.sendPM(user.name, strings.format(bot, "SHUFFLE_ERR", [bot.trigger]));
      }
      return false;
    }),
    "shuffleuser": new Command({
      cmdName: "shuffleuser",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 20000,
      isActive: true,
      requiredChannelPerms: ["seeplaylist", "playlistmove"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      let TARGETUSER = message.split(" ")[0];
      if (!utils.isValidUserName(TARGETUSER)) {
        bot.sendPM(user.name, "$shuffleuser <username> -- Disperses a user's videos throughout the playlist.");
        return false;
      }
      let userVideos = bot.getUserVideos(TARGETUSER);
      let pl = bot.CHANNEL.playlist;
      if (userVideos.length <= 0) {
        bot.sendPM(user.name, "No videos found for " + TARGETUSER);
        return false;
      }
      if (pl.length <= userVideos.length)  {
        bot.sendPM(user.name, "Playlist must have at least two contributors to use this command.");
        return false;
      }
      if (pl.length <= 5) {
        bot.sendPM(user.name, "Playlist must have more than 5 videos.");
        return false;
      }
      var moveVid = function(i) {
          if (i < userVideos.length) {
              //keep checking playlist status since it can always update during this
              var retry, after;
              if (userVideos[i].uid !== bot.CHANNEL.currentUID) {
                  do {
                      retry = false;
                      if (userVideos[i].uid !== bot.CHANNEL.currentUID) {
                          let active = bot.getMediaIndex(bot.CHANNEL.currentUID);
                          let newPos = Math.max(5, Math.floor(Math.random() * pl.length - active) + active);
                          after = pl[newPos].uid;
                          if (after === userVideos[i].uid) retry = true;
                      } else {
                          after = -1;
                      }
                  } while (retry);
                  bot.logger.debug("selected UID " + userVideos[i].uid + ", active UID is " + bot.CHANNEL.currentUID);
                  if (after >= 0) {
                      bot.moveMedia(userVideos[i].uid, after);
                  }
              }
              let fn = ()=>{moveVid(i+1)};
              bot.actionQueue.enqueue([this, fn, []]);
          }
      };
      moveVid(0);
    }),
    "su-allow": new Command({
      cmdName: "su-allow",
      minRank: bot.RANKS.OWNER,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let target = message.split(" ")[0];
      if (!utils.isValidUserName(target)) return false;
      let success = bot.allowUser(target);
      if (success) bot.sendPM(user.name, target + " allowed.");
      return success;
    }),
    "su-clearquotes": new Command({
      cmdName: "su-clearquotes",
      minRank: bot.RANKS.OWNER,
      rankMatch: ">=",
      userCooldown: 10000,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.chat) {
        let spl = message.split(" ");
        if (utils.isValidUserName(spl[0])) {
          bot.db.run("deleteUserChat", [spl[0]], function() {
            bot.sendPM(user.name, strings.format(bot, "DB_QUOTES_ERASED_OTHER", [spl[0]]));
          });
          return true;
        } else {
          bot.sendPM(user.name, strings.format(bot, "INVALID_USERNAME"));
        }
      }
      return false;
    }),
    "su-disallow": new Command({
      cmdName: "su-disallow",
      minRank: bot.RANKS.OWNER,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 500,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let target = message.split(" ")[0];
      if (!utils.isValidUserName(target)) return false;
      let success = bot.disallowUser(target);
      if (success) bot.sendPM(user.name, target + " disallowed.");
      return success;
    }),
    "timeban": new Command({
      cmdName: "timeban",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 0,
      isActive: true,
      requiredChannelPerms: ["ban", "chat"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (bot.rank < 3) return false;
      message = message.toLowerCase().trim();
      let space = message.indexOf(" ");
      if (!~space) {
        bot.sendPM(user.name, "timeban [username] [length] -- Valid time notation examples (any numbers can be used): 1y1d1h1m1s, 1m, 30s");
        return false;
      }
      let name = message.substr(0,space),
        time = utils.removeExcessWhitespace(message.substr(space+1)),
        regex = new RegExp(/(\d+[ydhms])/gi);
      if (!utils.isValidUserName(name)) return false;
      if (!regex.test(time)) {
        bot.sendPM(user.name, "You must specify a time! Valid (any numbers can be used): 1y1d1h1m1s");
        return false;
      }
      function strToSecs(str) {
      	let time = parseInt(str.substr(0,str.length-1)),
      		type = str.substr(-1,1);

      	if (!isNaN(time)) {
      		switch (type) {
            case "s": return time;
            case "m": return time*60;
            case "h": return time*60*60;
            case "d": return time*24*60*60;
            //who cares about leap years here
            case "y": return time*365*24*60*60;
            default: return 0;
      		}
      	}
      }

      let matches = time.match(regex),
        banTime = 0,
        i = 0;
      if (!matches) {
        bot.sendPM(user.name, "You must specify a time! Valid (any numbers can be used): 1y1d1h1m1s");
        return false;
      }
      for (;i < matches.length;i++) {
      	if (matches[i] && matches[i] !== "") {
        	banTime += strToSecs(matches[i]);
      	}
      }
      if (banTime > Number.MAX_SAFE_INTEGER || banTime === Infinity) banTime = Number.MAX_SAFE_INTEGER;
      if (banTime <= 60) banTime = 60;
      if (disciplineUser(user, cmd, "ipban", name + " [" + utils.getUTCDateStringFromDate() + "] Banned for " + utils.secsToTime(banTime, true))) {
        bot.timeBan(name, banTime);
        bot.logger.mod("TIMEBAN: " + name + " banned by " + user.name + " for " + banTime + " seconds");
        bot.sendPM(user.name, "Timebanned " + name + " for " + utils.secsToTime(banTime, true));
        return true;
      }
      return false;
    }),
    "top5emotes": new Command({
      cmdName: "top5emotes",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 20000,
      cmdCooldown: 15000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
        bot.db.run("getTopFiveEmotes", null, function(res) {
          if (res && res.rowCount > 0) {
            var txt = "Top " + res.rowCount + " emotes: ";
            for (var i = 0; i < res.rows.length; i++) {
              var row = res.rows[i];
              if (row.emote.length > 40) row.emote = row.emote.substr(0,40) + "...";
              txt += row.emote + ` (${row.sum})`;
              if (i < res.rows.length - 1) txt += ", ";
            }
            bot.sendChatMsg(txt);
          }
        });
        return true;
      }
      return false;
    }),
    "top5emoteusers": new Command({
      cmdName: "top5emoteusers",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 20000,
      cmdCooldown: 15000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
        bot.db.run("getTopFiveEmoteUsers", null, function(res) {
          if (res && res.rowCount > 0) {
            var txt = "Top " + res.rowCount + " emote users: ";
            for (var i = 0; i < res.rows.length; i++) {
              var row = res.rows[i];
              txt += row.uname + ` (${row.sum})`;
              if (i < res.rows.length - 1) txt += ", ";
            }
            bot.sendChatMsg(txt);
          }
        });
        return true;
      }
      return false;
    }),
    "unban": new Command({
      cmdName: "unban",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["ban"],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let spl = message.split(" ");
      if (spl.length <= 0 || !utils.isValidUserName(spl[0])) return false;
      if (bot.userIsTimebanned(spl[0])) {
        bot.sendPM(user.name, strings.format(bot, "UNBAN_FAIL_TIMEBANNED", [spl[0], bot.trigger]));
        return false;
      }
      return bot.unbanUser(spl[0]);
    }),
    "untimeban": new Command({
      cmdName: "untimeban",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["ban"],
      allowRankChange: false,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      let spl = message.split(" ");
      if (spl.length <= 0 || !utils.isValidUserName(spl[0])) return false;
      return bot.unbanUser(spl[0]);
    }),
    "unmute": new Command({
      cmdName: "unmute",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      if (bot.getOpt("muted", false)) {
        bot.logger.mod(strings.format(bot, "BOT_UNMUTED", [user.name]));
        return bot.setOpt("muted", false);
      }
      return false;
    }),
    "uptime": new Command({
      cmdName: "uptime",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 2000,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      bot.sendChatMsg(strings.format(bot, "CHAT_UPTIME", [utils.secsToTime(Math.floor((Date.now() - bot.started)/1000))]));
      return true;
    }),
    "urbandictionary": new Command({
      cmdName: "urbandictionary",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 20000,
      cmdCooldown: 10000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      if (message.trim() === "") return false;
      api.APIcall(bot, "urbandictionary", message, null, function(status, data) {
        if (!data || !status) return false;
        let noResponse = false;
        if (data.list && data.list.length >= 1) {
          function getDefinition() {
            let i = 0;
            for (;i < data.list.length;i++) {
              if (data.list[i].hasOwnProperty("definition") && data.list[i].word.toLowerCase() === message.toLowerCase())
                return ent.decode(utils.removeExcessWhitespace(data.list[i].definition));
            }
            return null;
          }
          let def = getDefinition();
          if (def) {
            def = def.replace(/[\[\]]+/g, "");
            bot.sendChatMsg(strings.format(bot, "API_PLAIN_RESPONSE", ["ud", def]));
          } else {
            noResponse = true;
          }
        } else {
          noResponse = true;
        }
        if (noResponse) {
          bot.sendChatMsg(strings.format(bot, "API_PLAIN_RESPONSE", ["ud", "No definition found."]));
        }
      });
      return true;
    }),
    "useremotecount": new Command({
      cmdName: "useremotecount",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 5000,
      cmdCooldown: 1000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
        var spl = message.split(" ");
        if (utils.isValidUserName(spl[0])) {
          if (bot.getSavedUserData(spl[0]).quoteExempt || spl[0].toLowerCase() === bot.username.toLowerCase()) {
            bot.sendChatMsg(strings.format(bot, "TARGETUSER_EXEMPT"));
            return true;
          } else {
            if (spl.length > 1 && bot.emoteExists(spl[1])) {
              bot.db.run("getUserEmoteCount", [spl[0], spl[1]], function(res) {
                if (res && res.rowCount > 0) {
                  var row = res.rows[0];
                  bot.sendChatMsg(strings.format(bot, "CHAT_UEC_USED", [row.uname, spl[1], row.count, (row.count == 1 ? "time" : "times")]));
                } else {
                  bot.sendChatMsg(strings.format(bot, "CHAT_UEC_NOTUSED", [spl[0], spl[1]]));
                }
              });
              return true;
            } else {
              bot.db.run("getUserTotalEmoteCount", [spl[0]], function(res) {
                if (res && res.rowCount > 0 && res.rows[0].sum != null) {
                  var row = res.rows[0];
                  bot.sendChatMsg(strings.format(bot, "CHAT_UEC_USEDTOTAL", [row.uname, row.sum, (row.sum == 1 ? "emote" : "emotes")]));
                } else {
                  bot.sendChatMsg(strings.format(bot, "CHAT_UEC_NONEUSED", [spl[0]]));
                }
              });
              return true;
            }
          }
        }
      }
      return false;
    }),
    "vidstats": new Command({
      cmdName: "vidstats",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 6000,
      isActive: true,
      requiredChannelPerms: [],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      let cm = bot.CHANNEL.currentMedia;
      if (!cm || cm.type !== "yt") {
        bot.sendPM(user.name, "A YouTube video must be playing to get statistics.");
        return false;
      }
      let cvd = bot.currentVideoData,
        ID = cm.id;
      if (cvd.id === ID && (cvd.views > -1 || cvd.noStats || cvd.ratingsDisabled)) {
        let sndmsg = (cvd.views).toLocaleString("en") + " views. ";
        if (bot.cfg.chat.roomHasSSC) sndmsg = "ssc:#1c8a1a " + sndmsg;
        if (cvd.ratingsDisabled) sndmsg += "Ratings are disabled.";
        else {
          let total = cvd.likes+cvd.dislikes,
            likePercent = (total <= 0) ? "0" : ((cvd.likes/total)*100).toFixed(2);
          sndmsg += cvd.likes + " likes, " + cvd.dislikes + " dislikes (" + likePercent + "% positive)";
        }
        bot.sendChatMsg(sndmsg);
        return true;
      } else {
        if (bot.gettingVideoMeta) {
          bot.sendPM(user.name, "The bot is currently getting the video stats. Try again in a few seconds. If this persists, this is an issue.");
          return false;
        }
        bot.gettingVideoMeta = true;
        api.APIcall(bot, "youtubestatistics", ID, bot.cfg.api.youtube_key, function (status, data, ok) {
          cvd.id = ID;
          if (!status) {
            bot.gettingVideoMeta = false;
            return false;
          }
          if (ok && data && data.items) {
            if (data.items.length < 1 || !data.items[0].hasOwnProperty("statistics")) {
                cvd.noStats = true;
                bot.gettingVideoMeta = false;
                bot.sendChatMsg("No stats found for this video.");
                return;
            }
            let stats = data.items[0]["statistics"];
            cvd.views = parseInt(stats.viewCount);
            let sndmsg = (cvd.views).toLocaleString("en") + " views. ";
            if (bot.cfg.chat.roomHasSSC) sndmsg = "ssc:#1c8a1a " + sndmsg;
            if (!stats.hasOwnProperty("likeCount") || !stats.hasOwnProperty("dislikeCount")) {
              cvd.ratingsDisabled = true;
              sndmsg += "Ratings are disabled.";
            } else {
              var likes = parseInt(stats.likeCount),
                dislikes = parseInt(stats.dislikeCount),
                total = likes+dislikes,
                likePercent = (total <= 0) ? "0" : ((likes/total)*100).toFixed(2);
              cvd.likes = likes;
              cvd.dislikes = dislikes;
              sndmsg += likes + " likes, " + dislikes + " dislikes (" + likePercent + "% positive)";
            }
            bot.gettingVideoMeta = false;
            bot.sendChatMsg(sndmsg);
            return;
          } else if (!data || (data && (!data.items || (data.error && data.error.errors)))) {
            bot.gettingVideoMeta = false;
            return bot.sendPM(user.name, "Error getting video statistics. Is a YouTube video playing?");
          }
        });
      }
      return true;
    }),
    "wolfram": new Command({
      cmdName: "wolfram",
      minRank: bot.RANKS.USER,
      rankMatch: ">=",
      userCooldown: 10000,
      cmdCooldown: 2000,
      isActive: true,
      requiredChannelPerms: ["chat"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      let apiKey = bot.cfg.api.wolfram_key;
      if (apiKey.trim() === "") return false;
      api.APIcall(bot, "wolfram", message, apiKey, function(status, data) {
        if (!status || !data) return false;
        switch (status) {
          case -3:
            bot.logger.error("wolfram error: " + data);
            break;
          case -2:
            bot.sendPM(user.name, "[wolfram] "+data);
            break;
          case -1:
            return false;
          case 200:
            bot.sendChatMsg(strings.format(bot, "API_WR_RESPONSE", [user.name, data]));
            break;
          case 501:
            bot.sendChatMsg(strings.format(bot, "API_WR_RESPONSE", [user.name, "No data found with that query."]));
            break;
          default:
            return false;
        }
      });
    })
  }

    //LOCAL FUNCTIONS
    function disciplineUser(caller, cmdName, method, message) {
      var spl = message.split(" "),
          targetname = spl.splice(0, 1)[0];
      spl = spl.join(" ").trim();
      let lower = targetname.toLowerCase();
      if (lower === caller.name.toLowerCase() || lower === bot.username.toLowerCase() || targetname === "") return false;
      var usr = bot.getUser(targetname);
      if (!callerOverTargetRank(caller, targetname)) return false;
      if (usr) bot.sendChatMsg("/" + method + " " + usr.name + " " + spl, true, true);
      else if (method !== "kick") bot.sendChatMsg("/" + method + " " + targetname + " " + spl, true, true);
      bot.logger.mod(strings.format(bot, "DISCIPLINE_LOG", [caller.name, cmdName, (usr ? usr.name : targetname), (spl !== "" ? spl : "<none>")]));
      return true;
    }

    function resolveCmdName(cmd) {
      if (typeof cmd === "string") {
        cmd = cmd.toLowerCase();
        if (aliases.hasOwnProperty(cmd) && !chatCommands.hasOwnProperty(cmd)) return commands[aliases[cmd]];
        return commands[cmd];
      } else if (cmd instanceof Command) {
        return cmd;
      }
      return null;
    }

    function resetRank(_command, caller) {
      if (!caller) caller = {name: "[none]"};
      var command = resolveCmdName(_command);
      if (!command) return false;
      return (setRank(command, command.defaultRank, caller, true) &&
      setRankMatch(command, command.defaultRankMatch, caller, true));
    }

    function setRank(_command, rank, caller, force) {
      var command = resolveCmdName(_command);
      if (!command) return false;
      if (!command.allowRankChange && !force) {
        bot.sendPM(caller.name, "That command cannot have its rank changed.");
        return false;
      } else if (command.broken) {
        bot.sendPM(caller.name, "That command is broken. Tell the bot maintainer.");
        return false;
      }
      var passed = false;
      var oldrank = command.minRank;
      if (!isNaN(parseFloat(rank)))
        rank = parseFloat(rank);
      if (typeof rank === "string") {
        var rankKeys = Object.keys(bot.RANKS);
        var ranks = {};
        var input = rank.toLowerCase();
        for (var i = 0; i < rankKeys.length; i++) {
          ranks[rankKeys[i].toLowerCase()] = rankKeys[i];
        }
        if (ranks.hasOwnProperty(input)) {
          var newrank = bot.RANKS[ranks[input]];
          if (typeof newrank === "number") {
            command.minRank = newrank;
            passed = true;
          }
        }
      } else if (typeof rank === "number") {
        command.minRank = rank;
        passed = true;
      }
      if (passed) {
        let overrides = bot.settings.minRankOverrides;
        if (command.minRank === command.defaultRank) delete overrides[command.cmdName];
        else overrides[command.cmdName] = command.minRank;
        bot.writeSettings();
        bot.logger.mod(strings.format(bot, "COMMAND_RANK_CHANGED", [command.cmdName, oldrank, rank, utils.colorUsername(bot, caller)]));
      }
      return passed;
    }

    function setRankMatch(_command, rankMatch, caller, force) {
      var command = resolveCmdName(_command);
      if (!command) return false;
      if (!command.allowRankChange && !force) {
        bot.sendPM(caller.name, "That command cannot have its rank changed.");
        return false;
      } else if (command.broken) {
        bot.sendPM(caller.name, "That command is broken. Tell the bot maintainer.");
        return false;
      } else if (!isValidRankMatch(rankMatch)) {
        bot.sendPM(caller.name, "Invalid input. Comparison operator can either be <=, ==, or >=.");
        return false;
      }
      var oldRankMatch = command.rankMatch;
      command.rankMatch = rankMatch;
      let overrides = bot.settings.rankMatchOverrides;
      if (command.rankMatch === command.defaultRankMatch) delete overrides[command.cmdName];
      else overrides[command.cmdName] = command.rankMatch;
      bot.writeSettings();
      bot.logger.mod(strings.format(bot, "COMMAND_RANKMATCH_CHANGED", [command.cmdName, oldRankMatch, rankMatch, utils.colorUsername(bot, caller)]))
      return true;
    }

    function findLastMedia(name) {
      name = name.toLowerCase();
      let playlist = bot.CHANNEL.playlist;
      let i = playlist.length-1;
      for (;i >= 0;i--) {
        if (playlist[i].queueby.toLowerCase() === name) {
          return {media:playlist[i], index:i};
        }
      }
      return null;
    }

    function callerOverTargetRank(caller, targetname) {
      let target = bot.getUser(targetname);
      if (target) {
        return caller.rank > target.rank && bot.rank > target.rank;
      } else if (!bot.first.grabbedChannelRanks) {
        let rank = bot.getChanRank(targetname);
        return caller.rank > rank && bot.rank > rank;
      }
      return false;
    }
    //END FUNCTIONS & COMMANDS

  //Revisit this area because it's a bit messy
  module.exports["Command"] = Command;
  var custCmds = {commands:{},aliases:{}};
  var missingCustCmdsFile = false;
  try {
    let filename = "./customchatcommands";
    if (bot.cfg.advanced.useChannelCustomCommands)
      filename += "-" + bot.CHANNEL.room;
    filename += ".js";
    var cmds = require(filename).getCommands(bot);
    custCmds.commands = cmds.commands;
    custCmds.aliases = cmds.aliases;
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND")
      missingCustCmdsFile = true;
      //bot.logger.error(strings.format(bot, "CUSTOMCOMMANDS_NOT_FOUND"));
    else
      bot.logger.error(strings.format(bot, "CUSTOMCOMMANDS_LOAD_ERROR", [e.stack]));
  }
  let custList = bot.cfg.advanced.customCommandsToLoad, i = 0;
  for (;i < custList.length;i++) {
    if (custList[i] === bot.CHANNEL.room && bot.cfg.advanced.useChannelCustomCommands) continue;
    try {
      let filename = "./customchatcommands-" + custList[i] + ".js";
      let cmds = require(filename).getCommands(bot);
      for (var cmd in cmds.commands) {
        custCmds.commands[cmd] = cmds.commands[cmd];
      }
      for (var alias in cmds.aliases) {
        custCmds.aliases[alias] = cmds.aliases[alias];
      }
    } catch (e) {
      if (e.code === "MODULE_NOT_FOUND") {
        bot.logger.error("Could not find customchatcommands-" + custList[i] + ".js!");
      } else
        bot.logger.error(strings.format(bot, "CUSTOMCOMMANDS_LOAD_ERROR", [e.stack]));
    }
  }
  if (utils.isObject(custCmds.commands)) {
    let numCmds = 0;
    for (let i in custCmds.commands) {
      if (commands.hasOwnProperty(i)) {
        bot.logger.warn(strings.format(bot, "CUSTOMCOMMANDS_OVERWRITE", [i]));
      }
      commands[i] = custCmds.commands[i];
      numCmds++;
    }
    if (utils.isObject(custCmds.aliases)) {
      for (let i in custCmds.aliases) {
        if (aliases.hasOwnProperty(i)) {
          bot.logger.warn(strings.format(bot, "CUSTOMCOMMANDS_ALIASES_OVERWRITE", [i]));
        }
        aliases[i] = custCmds.aliases[i];
      }
    } else {
      bot.logger.error(strings.format(bot, "CUSTOMCOMMANDS_ALIASES_NOT_OBJ"));
    }
    bot.logger.info("Found " + numCmds + " custom commands.");
  } else {
    bot.logger.error(strings.format(bot, "CUSTOMCOMMANDS_CMDS_NOT_OBJ"));
  }

  bot.logger.debug(strings.format(bot, "DBG_CMD_CHECKOVERRIDE"));
  for (let i in commands) {
    i = i.toLowerCase();
    let COMMAND = commands[i];
    if (i !== COMMAND.cmdName) {
      COMMAND.isActive = false;
      COMMAND.broken = true;
      bot.logger.error(strings.format(bot, "COMMAND_INVALID_UNEQUAL_ID", [i]));
      continue;
    }
    //bot.logger.debug(strings.format(bot, "DBG_CMD_SETCDPROP", [i]));
    bot.userCooldowns[i] = {};
    if (bot.settings.cmdStateOverrides.hasOwnProperty(i)) {
      let newState = bot.settings.cmdStateOverrides[i];
      if (newState !== COMMAND.defaultActiveState) {
        bot.logger.debug(strings.format(bot, "DBG_CMD_FOUNDSTATEOVERRIDE", [
          i, COMMAND.defaultActiveState, newState
        ]));
        COMMAND.isActive = newState;
      } else {
        delete bot.settings.cmdStateOverrides[i];
      }
    }
    if (bot.settings.minRankOverrides.hasOwnProperty(i)) {
      if (!COMMAND.allowRankChange) {
        bot.logger.debug(strings.format(bot, "DBG_CMD_FOUNDRANKOVERRIDE_NOTALLOWED", [i]));
      } else {
        var newrank = bot.settings.minRankOverrides[i];
        if (newrank !== COMMAND.defaultRank) {
          bot.logger.debug(strings.format(bot, "DBG_CMD_FOUNDRANKOVERRIDE", [
            i, COMMAND.minRank, newrank
          ]));
          COMMAND.minRank = newrank;
        } else {
          delete bot.settings.minRankOverrides[i];
        }
      }
    }
    if (bot.settings.rankMatchOverrides.hasOwnProperty(i)) {
      if (!COMMAND.allowRankChange) {
        bot.logger.debug(strings.format(bot, "DBG_CMD_FOUNDRANKMATCHOVERRIDE_NOTALLOWED", [i]));
      } else {
        var newrm = bot.settings.rankMatchOverrides[i];
        if (newrm !== COMMAND.defaultRankMatch) {
          bot.logger.debug(strings.format(bot, "DBG_CMD_FOUNDRANKMATCHOVERRIDE", [
            i, COMMAND.rankMatch, newrm
          ]));
          COMMAND.rankMatch = newrm;
        } else {
          delete bot.settings.rankMatchOverrides[i];
        }
      }
    }
    if (bot.settings.userCooldownOverrides.hasOwnProperty(i)) {
      var newcd = bot.settings.userCooldownOverrides[i];
      if (newcd >= 0 && newcd !== COMMAND.defaultUserCooldown) {
        bot.logger.debug(strings.format(bot, "DBG_CMD_FOUNDCDOVERRIDE", [
          i, COMMAND.userCooldown, newcd
        ]));
        COMMAND.userCooldown = newcd;
      } else {
        delete bot.settings.userCooldownOverrides[i];
      }
    }
    if (bot.settings.cmdCooldownOverrides.hasOwnProperty(i)) {
      var newcd = bot.settings.cmdCooldownOverrides[i];
      if (newcd >= 0 && newcd !== COMMAND.defaultCmdCooldown) {
        bot.logger.debug(strings.format(bot, "DBG_CMD_FOUNDGCDOVERRIDE", [
          i, COMMAND.cmdCooldown, newcd
        ]));
        COMMAND.cmdCooldown = newcd;
      } else {
        delete bot.settings.cmdCooldownOverrides[i];
      }
    }
  }
  chatCommands = commands;
  bot.handlingChatCommands = true;
  bot.logger.verbose(strings.format(bot, "COMMAND_LISTENING"));
  return true;
}

module.exports["exec"] = function (bot, user, input, isPM) {
  if (bot.username === "" || bot.cfg.chat.disableAllCommands || bot.killed || !user || bot.disallowed(user.name)) return;
  let username = user.name;
  var split = input.split(" "),
    cmd = split.splice(0, 1)[0],
    givenCmd = cmd;
  if (cmd === "") return;
  if (aliases.hasOwnProperty(cmd) && !chatCommands.hasOwnProperty(cmd)) {
    cmd = aliases[cmd];
  }
  cmd = cmd.toLowerCase();
  if (chatCommands.hasOwnProperty(cmd)) {
    var command = chatCommands[cmd],
      now = Date.now();
    if (!bot.handlingChatCommands) {
      bot.logger.error(strings.format(bot, "COMMAND_USED_BEFOREHANDLING", [cmd]));
      return;
    } else if (chatCommands[cmd].broken) {
      bot.logger.error(strings.format(bot, "COMMAND_USED_BROKEN", [cmd]));
      bot.sendPM(user.name, "\"" + command.cmdName + "\" is broken. Notify a bot maintainer.");
      return;
    } else if (!chatCommands[cmd].isActive) {
      bot.logger.warn(strings.format(bot, "COMMAND_USED_INACTIVE", [cmd]));
      bot.sendPM(user.name, "\"" + command.cmdName + "\" is not active.");
      return;
    } else if (isPM && !chatCommands[cmd].canBeUsedInPM) {
      bot.logger.warn(strings.format(bot, "COMMAND_USED_NOPM", [cmd]));
      bot.sendPM(user.name, "\"" + command.cmdName + "\" cannot be used in PM.");
      return;
    }
    if (user.rank < bot.RANKS.OWNER && bot.settings.disallow.indexOf(username) > -1) return;
    var reqperm = command.requiredChannelPerms;
    for (var i = 0; i < reqperm.length; i++) {
      if (!bot.checkChannelPermission(reqperm[i])) {
        bot.logger.error(strings.format(bot, "COMMAND_CHANPERM_FAIL", [command.cmdName, reqperm[i]]));
        if (user.rank >= bot.RANKS.MOD) {
          bot.sendPM(user.name, "Bot does not have the channel permissions required for " + command.cmdName + ": " + reqperm.join(", "));
        }
        return;
      }
    }
    if ((command.rankMatch === ">=" && user.rank < command.minRank)
        ||(command.rankMatch === "==" && user.rank !== command.minRank)
        ||(command.rankMatch === "<=" && user.rank > command.minRank)) {
      var rankstr = command.minRank;
      if (bot.cfg.rankNames.hasOwnProperty(command.minRank)) rankstr += " (" + bot.cfg.rankNames[command.minRank] + ")";
      else rankstr += "";
      bot.sendPM(user.name, strings.format(bot, "COMMAND_REQUIRED_RANK", [
        command.cmdName, rankstr, command.rankMatch
      ]));
    } else {
      //if bypass is either disabled, or the user is too low of a rank to bypass cooldowns...
      if (bot.cfg.chat.minRankToBypassCooldown < 0 || (bot.cfg.chat.minRankToBypassCooldown > -1 && user.rank < bot.cfg.chat.minRankToBypassCooldown)) {
        if (now - command.lastUse < command.cmdCooldown) {
          return bot.sendPM(user.name, strings.format(bot, "COOLDOWN_C_ACTIVE", [
            command.cmdName, ((command.cmdCooldown - (now - command.lastUse)) / 1000)
          ]));
        } else if (bot.userCooldowns[cmd].hasOwnProperty(username) && now - bot.userCooldowns[cmd][username] < command.userCooldown) {
          return bot.sendPM(user.name, strings.format(bot, "COOLDOWN_U_ACTIVE", [
            command.cmdName, ((command.userCooldown - (now - bot.userCooldowns[cmd][username])) / 1000)
          ]));
        }
      }
      let opts = {
        isPM: isPM
      }
      var success = chatCommands[cmd].fn(givenCmd, user, split.join(" "), opts);
      if (success !== false) {
        //yes, explicit false. undefined should succeed as default behavior
        chatCommands[cmd].lastUse = now;
        bot.userCooldowns[cmd][username] = now;
      }
    }
  } else {
    bot.logger.warn(strings.format(bot, "UNKNOWN_CHAT_COMMAND", [cmd]));
  }
};
module.exports["init"] = createCommands;

function disable(bot, cmd, username) {
  if (aliases.hasOwnProperty(cmd)) cmd = aliases[cmd];
  if (cmd === "disable" || cmd === "enable") return false;
  if (chatCommands.hasOwnProperty(cmd)) {
    let COMMAND = chatCommands[cmd];
    let strID = "COMMAND_DISABLED",
      success = false;
    if (COMMAND.isActive) {
      COMMAND.isActive = false;
      let overrides = bot.settings.cmdStateOverrides;
      if (!COMMAND.defaultActiveState) {
        delete overrides[COMMAND.cmdName];
      } else {
        overrides[COMMAND.cmdName] = false;
      }
      bot.writeSettings();
      success = true;
    } else {
      strID = "COMMAND_DISABLED_FAIL";
    }
    let msg = strings.format(bot, strID, [cmd]);
    bot.logger.verbose(msg);
    if (username)
      bot.sendPM(username, msg);
    return success;
  }
  return false;
}

function enable(bot, cmd, username) {
  if (aliases.hasOwnProperty(cmd)) cmd = aliases[cmd];
  if (chatCommands.hasOwnProperty(cmd)) {
    let COMMAND = chatCommands[cmd];
    let msg = "",
      success = false;
    if (COMMAND.broken) {
      msg = strings.format(bot, "COMMAND_ENABLED_BROKEN", [cmd]);
      bot.logger.error(msg);
    } else if (!COMMAND.isActive) {
      COMMAND.isActive = true;
      let overrides = bot.settings.cmdStateOverrides;
      if (COMMAND.defaultActiveState) {
        delete overrides[COMMAND.cmdName];
      } else {
        overrides[COMMAND.cmdName] = true;
      }
      bot.writeSettings();
      msg = strings.format(bot, "COMMAND_ENABLED", [cmd]);
      success = true;
    } else {
      msg = strings.format(bot, "COMMAND_ENABLED_FAIL", [cmd]);
    }

    if (COMMAND.broken) bot.logger.error(msg);
    else bot.logger.verbose(msg);

    if (username)
      bot.sendPM(username, msg);
    return success;
  }
  return false;
}

function isValidRankMatch(rm) {
  return ~["<=", "==", ">="].indexOf(rm);
}
