"use strict";

const path = require("path");
const fs = require("fs");
const ent = require("html-entities").AllHtmlEntities;
const C = require("cli-color");

const chatcmd = require("./chatcommands.js");
const utils = require("./utils.js");
const strings = require("./strings.js");


/**
 * Binds event handlers to the socket and gives each one easy access to the Bot.
 *
 * @param  {Bot} bot    Bot object
 * @param  {Object} socket Socket
 * @param  {Object} config Bot configuration object
 */
function setHandlers(bot, socket, config) {

  if (socket._callbacks.length > 2) return false;

  bot.logger.debug(strings.format(bot, "DBG_SETTING_HANDLERS"));

  socket.on("addUser", function(data) {
    var now = Date.now();
    data["lastRoomtimeCheck"] = now;
    data["timeWentAFK"] = -1;
    data["joinTime"] = now;
    if (bot.userRankDBCheck(data.rank)) {
      bot.db.run("userJoin", [data.name], function(res) {
        if (bot.cfg.moderation.notifyNewUser && res && res.rowCount > 0 && res.rows[0].joins <= 1 && !bot.userIsBot(data.name) && data.rank <= bot.RANKS.USER) {
          bot.broadcastModPM(strings.format(bot, "NEW_USER_JOIN", [data.name]));
        }
      });
    }
    let joinLog = "";
    if (data.meta) {
      if (data.meta.hasOwnProperty("aliases")) {
        let i = 0,
          al = data.meta.aliases,
          alreadyDisallowed = false;
        for (;i < al.length; i++) {
          if (al[i] === data.name) {
            utils.unsortedRemove(al, i);
            i--;
          } else if (bot.cfg.moderation.autoDisallow && !alreadyDisallowed && bot.disallowed(al[i])) {
            alreadyDisallowed = true;
            bot.disallowUser(data.name);
          }
        }
        if (data.meta.aliases.length > 0) {
          joinLog = strings.format(bot, "USER_JOINED_ROOM_ALIASES", [utils.colorUsername(bot, data), data.meta.aliases.join(", ")]);
        }
      }
      if (data.meta.afk) {
        data["timeWentAFK"] = now;
      }
      if (data.meta.hasOwnProperty("ip")) {
        let ipMatches = bot.matchSubnet(data.meta.ip, true);
        if (ipMatches.length > 0) {
          let msg = strings.format(bot, "SUBNET_MATCH", [data.name, ipMatches.join(", ")]);
          if (bot.cfg.moderation.notifyBannedSubnets)
            bot.broadcastModPM(msg);
          if (bot.cfg.moderation.autoShadowmuteOnSubnetMatch)
            bot.muteUser(data.name, true);
          bot.logger.mod(msg + " (" + data.meta.ip + ")");
        }
      }
    }
    if (data.name) {
      if (joinLog === "") joinLog = strings.format(bot, "USER_JOINED_ROOM", [utils.colorUsername(bot, data)]);
      if (data.meta && data.meta.ip) {
        joinLog += C.blackBright(" (ip: "+data.meta.ip+")");
      }
      bot.logger.log(joinLog);
    }
    if (data.profile) {
      let img = data.profile.image.toLowerCase();
      if (img && img.trim() !== "" && bot.cfg.moderation.notifyBlacklistedAvatar) {
        let bl = bot.cfg.misc.blacklistedAvatarHosts, i = 0,
          host = utils.getHostname(img);
        for (; i < bl.length; i++) {
          if (bl[i].toLowerCase() === host) {
            bot.sendPM(data.name, strings.format(bot, "AVATAR_BLACKLIST"));
            break;
          }
        }
      }
    }
    bot.CHANNEL.users.push(data);
    bot.setFlatSkiprate();
  });

  socket.on("announcement", function(data) {
    bot.logger.cylog(strings.format(bot, "CY_ANNOUNCEMENT", [
      data.title,
      data.text,
      data.from
    ]));
  });

  socket.on("banlist", function(data) {
    bot.CHANNEL.banlist = data;
    bot.logger.verbose(strings.format(bot, "RECV_BANLIST"));
    bot.gettingBanList = false;
  });

  socket.on("banlistRemove", function(data) {
    let bl = bot.CHANNEL.banlist,
      tb = bot.settings.timeBans[bot.CHANNEL.room],
      i = 0,
      banObj = null;
    for (; i < bl.length; i++) {
      if (bl[i].id === data.id) {
        bot.logger.mod(strings.format(bot, "UNBANNED", [bl[i].name, bl[i].id, bl[i].ip]));
        banObj = bl.splice(i,1)[0];
        break;
      }
    }
    if (!banObj) return;
    i = 0;
    let _name = banObj.name.toLowerCase(),
      changed = false;
    for (;i < tb.length && !changed;i++) {
      if (_name === tb[i].name.toLowerCase()) {
        tb.splice(i,1);
        changed = true;
      }
    }
    if (changed) bot.writeSettings();
  });

  socket.on("cancelNeedPassword", function() {
    bot.logger.verbose(strings.format(bot, "PWD_ACCEPTED"));
  });

  socket.on("changeMedia", function(media) {
    bot.leadFinishingMedia = false;
    clearTimeout(bot.timeouts.playingNext);
    if (!media) {
      bot.logger.media(strings.format(bot, "NO_VIDEO"));
      bot.CHANNEL.currentMedia = null;
    } else {
      bot.CHANNEL.currentMedia = media;
      bot.notifyVideoState();
      if (bot.leader) {
        bot.stopLeadTimer();
        let timers = bot.timeouts;
        clearTimeout(timers.changeMediaLead);
        timers.changeMediaLead = setTimeout(()=>{
          bot.startLeadTimer();
        }, 2000);
      }
    }
    cleanUpcomingUIDsFromBumpList();
    bot.resetCurrentVidData();
    if (bot.cfg.advanced.automaticChannelLog) bot.readChanLog();
    bot.setProgTitle();
  });

  socket.on("channelRanks", function(data) {
    if (!bot.first.grabbedChannelRanks) return;
    bot.first.grabbedChannelRanks = false;
    bot.logger.verbose(strings.format(bot, "RECV_RANKS"));
    let ranks = [],
      i = 0,
      room = bot.CHANNEL.room.toLowerCase();
    for (;i < data.length; i++) {
      if (data[i].channel.toLowerCase() === room)
        ranks.push({name: data[i].name, rank: data[i].rank});
    }
    bot.CHANNEL.rankList = ranks;
  });

  /*data: Object
  {
    meta: Object (can have modflair: int...)
    msg: String
    time: int (uses cytube's time which can be off a bit)
    username: String
  }*/
  socket.on("chatMsg", function(data) {
    //prevent backlogging messages
    if (data.time < bot.started) return;
    var username = data.username;
    let isInvalidUsername = !utils.isValidUserName(username);
    let me = data.meta.action;
    let user = null;
    let isServer = false;
    var decodedMsg = ent.decode(data.msg),
      cleanMsg = ent.decode(utils.removeExcessWhitespace(utils.removeHtmlTags(data.msg))).trim(),
      outputMsg = cleanMsg;
    if (username === "[server]") { //ignore server join msg (sym)
      isServer = true;
      if (/[\w-]{1,20} joined/i.test(cleanMsg)) {
        return
      }
      let split = cleanMsg.split(" ");
      if (split.length > 1 && ~split[1].indexOf("banned")) {
        bot.getBanList();
      }
      //<[voteskip]> Voteskip passed: 12/36 skipped; eligible voters: 36 = total (95) - AFK (50) - no permission (9); ratio = 0.325
    } else if (username === "[voteskip]") {
      bot.logger.media(data.msg);
      return;
    } else if (!isInvalidUsername) {
      user = bot.getUser(username);
    }

    let isMuted = (user && (user.meta.muted || user.meta.smuted) && bot.cfg.chat.ignoreMutedUsers);
    let cmdPart = "";

    if (!isMuted && !bot.userIsBot(data.username)) {
      if (cleanMsg.substr(0,1) === bot.trigger)
        cmdPart = cleanMsg.substr(1);
      else if (bot.cfg.chat.allowInlineCmd)
        cmdPart = utils.inlineCmdCheck(bot.trigger, cleanMsg);

      if (!me
          && cmdPart !== ""
          && user
          && cmdPart.length > 0) {
        if (/^(((?:user)?emotecount)|(?:u?ec)|(?:top5emotes)|(?:top5emoteusers))/i.test(cmdPart)) {
          outputMsg = utils.execEmotes(bot, cleanMsg);
        } else {
          outputMsg = utils.execEmotes(bot, cleanMsg, username);
        }
        try {
          bot.logger.verbose(strings.format(bot, "COMMAND_ATTEMPT", [
            utils.colorUsername(bot, user),
            cmdPart
          ]));
          chatcmd.exec(bot, user, cmdPart, false);
        } catch (e) {
          bot.logger.error(e.stack);
          bot.sendPM(username, strings.format(bot, "COMMAND_RUNTIME_ERROR"));
          return
        }
      } else if (username === bot.username) {
        outputMsg = utils.execEmotes(bot, cleanMsg);
      } else {
        outputMsg = utils.execEmotes(bot, cleanMsg, username);
      }
      if (cmdPart === ""
          && !bot.getSavedUserData(username).quoteExempt
          && utils.isValidUserName(username)
          && user
          && bot.userRankDBCheck(user.rank)
          && cleanMsg.length >= bot.cfg.chat.minimumQuoteLength) {
        let msg = cleanMsg;
        if (me) msg = "/me " + msg;
        bot.db.run("addNewChat", [username, data.time/1000, msg.substr(0,320)]);
      }
    }
    if (bot.cfg.interface.colorUsernames) {
      if (user && user.rank > 1 && (!data.hasOwnProperty("meta") || !data.meta.hasOwnProperty("modflair"))) {
        username = C.whiteBright(username);
      } else {
        if (username.indexOf("[") >= 0)
          username = utils.colorUsername(bot, username);
        else if (!user)
          username = C.blackBright(username);
        else
          username = utils.colorUsername(bot, user);
      }
    }
    if (isServer) {
      bot.logger.cylog(outputMsg);
    } else {
      if (me) {
        bot.logger.log(C.blackBright("<") + username + " " + C.blackBright(outputMsg + "> "));
      } else {
        let endBracket = "> ";
        if (isMuted && bot.cfg.interface.indicateMutedUsers) endBracket = " (MUTED)" + endBracket;
        bot.logger.log(C.blackBright("<") + username + C.blackBright(endBracket) + outputMsg);
      }
    }
  });

  socket.on("channelCSSJS", function(data) {
    if (bot.cfg.advanced.automaticChannelLog) bot.readChanLog();
  });

  socket.on("channelNotRegistered", function() {
    bot.logger.info(strings.format(bot, "CHANNEL_NOT_REGISTERED"));
  });

  socket.on("channelOpts", function(opts) {
    if (bot.first.grabbedChannelOpts) {
      bot.first.grabbedChannelOpts = false;
    } else {
      var old = bot.CHANNEL.opts;
      var changed = [];
      for (var i in old) {
        if (opts.hasOwnProperty(i) && !utils.compareObjects(old[i], opts[i]) && old[i] !== opts[i]) {
          changed.push(i);
        }
      }
      if (changed.length > 0) {
        var changedStr = "";
        for (var i = 0; i < changed.length; i++) {
          var oldopt = old[changed[i]],
              newopt = opts[changed[i]];
          if (typeof(oldopt) === "object") oldopt = JSON.stringify(oldopt);
          if (typeof(newopt) === "object") newopt = JSON.stringify(newopt);
          if (changed[i].toLowerCase() === "voteskip_ratio") {
            bot.setFlatSkiprate();
            if (bot.cfg.moderation.notifySkipRateChange && !bot.settings.flatSkiprate.managing) {
              bot.sendChatMsg(strings.format(bot, "SKIPRATE_CHANGE", [(oldopt*100), (newopt*100)]));
            }
          }
          changedStr += changed[i] + " ("+oldopt+" => "+newopt+")";
          if (i < changed.length - 1) changedStr += ", ";
        }
        bot.logger.mod(strings.format(bot, "CHANNEL_OPTS_CHANGED", [changedStr]));
      }
    }
    bot.CHANNEL.opts = opts;
  });

  socket.on("closePoll", function() {
    const POLL = bot.CHANNEL.poll;
    if (!POLL.active) return;
    POLL.active = false;
    let timeOpen = Date.now() - POLL.timestamp,
      threeMins = (timeOpen >= 175000 && timeOpen < 185000 && POLL.options.length > 1 && bot.cfg.chat.announcePollResults);
    var options = "";
    var embed = null;
    var title = POLL.title;
    if (bot.DiscordBot && bot.cfg.discord.sendPollResultMessages && bot.cfg.discord.pollResultChannelID.trim() !== "") {
      embed = bot.DiscordBot.createEmbed()
        .setColor(bot.cfg.discord.pollClosedColor)
        .setAuthor(strings.format(bot, "DISCORD_EMBED_CLOSE_POLL_AUTHOR").substr(0,256), bot.cfg.discord.iconUrl, 'https://'+bot.cfg.connection.hostname+'/r/' + bot.CHANNEL.room)
        .setTitle(title.substr(0,256))
        .setDescription(strings.format(bot, "DISCORD_EMBED_POLL_TIMESTAMP", [
          POLL.initiator,
          utils.getUTCTimestamp(POLL.timestamp)
        ]).substr(0,256))
        .setTimestamp();
    }
    let bestOpt = {opt: POLL.options[0], count: POLL.counts[0]},
      total = 0,
      tie = false;
    for (var i = 0; i < POLL.options.length; i++) {
      var count = POLL.counts[i],
        option = ent.decode(POLL.options[i].trim());
      total += count;
      if (count > bestOpt.count) {
        bestOpt = {opt: option, count: count};
        tie = false;
      } else if (i > 0 && count === bestOpt.count) {
        tie = true;
      }
      if (embed) {
        var voteCount = count + " votes";
        if (count > 0) voteCount += " (" + ((count/total)*100).toFixed(2) + "%)";
        embed.addField(option.substr(0,256), voteCount, true);
      }
      options += "<[" + count + "] " + option + "> ";
    }
    if (embed) {
      bot.DiscordBot.getChannel(bot.cfg.discord.pollResultChannelID).send(embed);
    }
    if (threeMins && total > 0) {
      let resultStr = "",
        percent = ((bestOpt.count/total)*100).toFixed(2) + "%";
      if (!tie) resultStr = strings.format(bot, "POLL_CLOSED_RESULT", [title, bestOpt.opt, bestOpt.count, percent]);
      else resultStr = strings.format(bot, "POLL_CLOSED_TIE", [title, bestOpt.count, percent]);
      bot.sendChatMsg(resultStr);
    }
    bot.logger.mod(strings.format(bot, "POLL_CLOSED", [
      utils.colorUsername(bot, POLL.initiator),
      title,
      options
    ]));
  });

  socket.on("connect", function() {
    bot.hasConnectedBefore = true;
    bot.logger.log(strings.format(bot, "CONNECT_SUCCESS", [bot.cfg.connection.hostname]));
    bot.logger.info(strings.format(bot, "JOINING_ROOM", [bot.CHANNEL.room]));
    socket.emit("joinChannel", {name: bot.CHANNEL.room});
    if (!config.login.guest) {
      socket.emit("login", {
        name: config.login.username,
        pw: config.login.password
      });
    }
    bot.minuteTick();
    bot.setupReadline();
  });

  socket.on("connect_error", function() {
    if (bot.hasConnectedBefore) return;
    bot.socketConnErrors++;
    if (bot.socketConnErrors >= 3) {
      bot.logger.error(strings.format(bot, "SOCKET_CONN_ERR"));
      return;
    }
  });

  socket.on("delete", function(data) {
    var media = bot.getMediaIndex(data.uid);
    if (media < 0) return false;
    removeUIDFromBumpList(data.uid);
    bot.CHANNEL.playlist.splice(media, 1);
    if (bot.CHANNEL.playlist.length <= 0) {
      bot.CHANNEL.currentMedia = null;
      bot.logger.media(strings.format(bot, "NO_VIDEO"));
    }
    //bot.logger.debug(strings.format(bot, "DBG_REMOVEUID", [data.uid]));
    bot.setProgTitle();
  });

  socket.on("deleteChatFilter", function(f) {
    bot.logger.mod(strings.format(bot, "CHATFILTER_DELETE", [f.name]));
    if (bot.cfg.advanced.automaticChannelLog) bot.readChanLog();
  });

  socket.on("disconnect", async function() {
    if (bot.KICKED) return;
    bot.logger.log(strings.format(bot, "DISCONNECTED"));
    //bot.kill(strings.format(bot, "KILL_GENERIC_DISCONNECT"));
    if (!bot.killed) {
      bot.setProgTitle("(!DISCONNECTED!) | ");
      bot.stopAllTimers(true);
      await bot.updateUserRoomTimeAll();
      bot.cleanState();
    }
  });

  socket.on("emoteList", function(data) {
    if (!bot.cfg.chat.parseEmotes) return;
    bot.CHANNEL.emotes = [];
    bot.CHANNEL.emoteMap = {};
    bot.CHANNEL.badEmotes = [];
    data.forEach(function (e) {
        if (e.image && e.name) {
            e.regex = new RegExp(e.source, "gi");
            var _emote = {name:e.name, regex:e.regex};
            bot.CHANNEL.emotes.push(_emote);
            if (/\s/g.test(e.name)) {
                // Emotes with spaces can't be hashmapped
                bot.CHANNEL.badEmotes.push(_emote);
            } else {
                bot.CHANNEL.emoteMap[ent.encode(e.name)] = _emote;
            }
        } else {
          bot.logger.error(strings.format(bot, "EMOTE_REJECTED", ["emoteList", JSON.stringify(e)]));
        }
    });
  });

  socket.on("error", function(err) {
    bot.logger.error(strings.format(bot, "CONNECT_ERROR", [err]));
  });

  socket.on("kick", function(data) {
    bot.KICKED = true;
    var reason = data.reason ? " Reason: " + data.reason : "";
    bot.logger.log(C.redBright("[KICKED] " + strings.format(bot, "KICKED", [reason])));
    bot.kill("kicked", 10000);
  });

  socket.on("login", function(data) {
    if (!data.success) {
      bot.logger.error(strings.format(bot, "UNABLE_TO_LOGIN", [data.error]));
    } else {
      bot.guest = data.guest;
      bot.username = data.name;
      bot.logged_in = true;
      bot.logger.info(strings.format(bot, "LOGIN_SUCCESS", [data.name]));
      if (bot.cfg.misc.autoAFK === 1) bot.sendChatMsg("/afk", true, true);
      bot.setProgTitle();
    }
  });

  socket.on("mediaUpdate", function(data) {
    if (!bot.CHANNEL.currentMedia) return;
    bot.CHANNEL.currentMedia.currentTime = data.currentTime;
    bot.CHANNEL.currentMedia.paused = data.paused;
    bot.mediaUpdateTick(data);
  });

  socket.on("moveVideo", function(data) {
    var index = bot.getMediaIndex(data.from);
    if (index < 0) return false;
    var mediaToMove = bot.CHANNEL.playlist.splice(index, 1)[0],
      indexOfOtherMedia, otherMedia;

    let bumping = bot.bumpStats.bumpingUIDs.shift();
    let bumpedUIDs = bot.bumpStats.lastBumpedUIDs;
    let i = bumpedUIDs.length-1;
    let count = 0;
    for (; i >= 0; i--) {
      if (bumpedUIDs[i] === data.from) {
        count++;
        if ((count > 1 && bumping && bumping === data.from) || !bumping || bumping !== data.from)
          bumpedUIDs.splice(i, 1);
      }
    }

    if (data.after === "prepend") {
      indexOfOtherMedia = -1;
      otherMedia = null;
    } else {
      indexOfOtherMedia = bot.getMediaIndex(data.after);
      otherMedia = bot.CHANNEL.playlist[indexOfOtherMedia];
    }
    ++indexOfOtherMedia;
    bot.CHANNEL.playlist.splice(indexOfOtherMedia, 0, mediaToMove);
    if (indexOfOtherMedia === 0) ++indexOfOtherMedia;
    if (data.after === "prepend") {
      bot.logger.mod(strings.format(bot, "MEDIA_MOVE_TOP", [
        mediaToMove.media.title,
        (index+1),
        indexOfOtherMedia
      ]));
    } else {
      bot.logger.mod(strings.format(bot, "MEDIA_MOVE_AFTER", [
        mediaToMove.media.title,
        otherMedia.media.title,
        (index+1),
        (indexOfOtherMedia+1)
      ]));
    }
  });

  socket.on("needPassword", function(wrongpw) {
    if (wrongpw) {
      bot.logger.error(strings.format(bot, "WRONG_PWD", [bot.CHANNEL.room]));
      bot.kill(strings.format(bot, "KILL_WRONG_PWD"));
    } else {
      bot.logger.verbose(strings.format(bot, "PWD_REQUIRED", [bot.CHANNEL.room]));
      socket.emit("channelPassword", config.login.roomPassword);
    }
  });

  socket.on("newPoll", function(poll) {
    poll["active"] = true;
    bot.CHANNEL.poll = poll;
    var options = "";
    var inProgress = false;
    var embed = null;
    var title = ent.decode(utils.removeExcessWhitespace(utils.removeHtmlTags(poll.title)));
    bot.CHANNEL.poll.title = title;
    if (bot.DiscordBot && bot.cfg.discord.sendPollResultMessages && bot.cfg.discord.pollResultChannelID.trim() !== "") {
      embed = bot.DiscordBot.createEmbed()
                    .setColor(bot.cfg.discord.pollOpenedColor)
                    .setAuthor(strings.format(bot, "DISCORD_EMBED_NEW_POLL_AUTHOR").substr(0,256), bot.cfg.discord.iconUrl, 'https://'+bot.cfg.connection.hostname+'/r/' + bot.CHANNEL.room)
                    .setTitle(title.substr(0,256))
                    .setDescription(strings.format(bot, "DISCORD_EMBED_POLL_TIMESTAMP", [
                      poll.initiator,
                      utils.getUTCTimestamp(poll.timestamp)
                    ]).substr(0,256))
                    .setTimestamp();
    }
    if ((new Date()).getTime() - poll.timestamp >= 4000) inProgress = true;
    for (var i = 0; i < poll.options.length; i++) {
      var option = ent.decode(utils.removeExcessWhitespace(utils.removeHtmlTags(poll.options[i]))),
        count = poll.counts[i];
      bot.CHANNEL.poll.options[i] = option;
      if (!inProgress && ((typeof count === "string" && count !== "0?" && count !== "?") || count > 0)) inProgress = true;
      if (embed) {
        embed.addField(option.substr(0,256), count + " votes", true);
      }
      options += "<[" + count + "] " + option + "> ";
    }
    if (embed) {
      if (inProgress) {
        embed.author.name = strings.format(bot, "DISCORD_EMBED_POLL_INPROGRESS_AUTHOR").substr(0,256);
        embed.setColor(bot.cfg.discord.pollInProgressColor);
      }
      bot.DiscordBot.getChannel(bot.cfg.discord.pollResultChannelID).send(embed);
    }
    var time = utils.getTimestamp(bot.useTwentyFourHourTime, poll.timestamp);
    bot.logger.mod(strings.format(bot, "NEW_POLL", [
      utils.colorUsername(bot, poll.initiator),
      time,
      title,
      options
    ]));
  });

  socket.on("noflood", function(data) {
    bot.logger.log(strings.format(bot, "NO_FLOOD", [
      data.action,
      data.msg
    ]));
  });

  socket.on("partitionChange", function(socketConfig) {
    bot.logger.warn(strings.format(bot, "PARTITION_CHANGE"));
    bot.logger.debug("socketConfig from partitionChange: " + JSON.stringify(socketConfig));
    bot.changingPartition = true;
    bot.hardReconnect(socketConfig);
  });

  /* example playlist info
    {
      "media":{
        "id": String (vid ID),
        "title": String,
        "seconds": int,
        "duration":"00:19", time string
        "type":"yt",
        "meta":{}
      },
      "uid": int (playlist ID)
      "temp":true,
      "queueby": String (person who added the media)
    }
  */
  socket.on("playlist", function(data) {
    bot.CHANNEL.playlist = data;
    bot.bumpStats.lastBumpedUIDs = [];
    bot.bumpStats.bumpingUIDs = [];
    bot.logger.verbose(strings.format(bot, "PLAYLIST_RECEIVED"));
    if (bot.CHANNEL.playlist.length <= 0) {
      bot.logger.media(strings.format(bot, "PLAYLIST_EMPTY"));
    } else {
      bot.cleanBlacklistedMedia();
    }
    bot.setProgTitle();
  });

  /*{
     username: String, (sender)
     msg: String,
     meta: object,
     time: cytube timestamp (int),
     to: String (receiver)
    }*/
  socket.on("pm", function(data) {
    let cleanMsg = ent.decode(utils.removeExcessWhitespace(utils.removeHtmlTags(data.msg))).trim();
    if (data.to === bot.username) {
      let sender = null;
      if (~data.username.indexOf("[")) sender = data.username;
      else sender = bot.getUser(data.username);
      if (!sender) return;
      bot.logger.info(strings.format(bot, "PM_RECV", [
        utils.colorUsername(bot, sender),
        cleanMsg
      ]));
      let username = data.username;
      let isInvalidUsername = !utils.isValidUserName(username);

      let isMuted = (sender && (sender.meta.muted || sender.meta.smuted) && bot.cfg.chat.ignoreMutedUsers);
      if (!isMuted && !bot.userIsBot(data.username)) {
        let cmdPart = "";

        if (cleanMsg.substr(0,1) === bot.trigger)
          cmdPart = cleanMsg.substr(1);
        else if (bot.cfg.chat.allowInlineCmd)
          cmdPart = utils.inlineCmdCheck(bot.trigger, cleanMsg);

        if (cmdPart !== "" && username !== bot.username && !isInvalidUsername && cmdPart.length > 0) {
          try {
            bot.logger.verbose(strings.format(bot, "COMMAND_ATTEMPT", [
              utils.colorUsername(bot, sender),
              cmdPart
            ]));
            chatcmd.exec(bot, sender, cmdPart, true);
          } catch (e) {
            bot.logger.error(e.stack);
            bot.sendPM(username, strings.format(bot, "COMMAND_RUNTIME_ERROR"));
            return
          }
        }
      }

    } else {
      bot.logger.info(strings.format(bot, "PM_SENT", [
        utils.colorUsername(bot, data.to),
        cleanMsg
      ]));
    }
  });

  socket.on("queue", function(data) {
    var media = data.item,
      username = media.queueby;
    if (username === "") username = "(anon)";
    username = utils.colorUsername(bot, username);
    if (data.after === "prepend") {
      bot.CHANNEL.playlist.splice(0, 0, media);
      bot.logger.media(strings.format(bot, "MEDIA_ADD_TOP", [
        username,
        media.media.title
      ]));
    } else if (data.after === "append") {
      bot.CHANNEL.playlist.push(media);
      bot.logger.media(strings.format(bot, "MEDIA_ADD_BOTTOM", [
        username,
        media.media.title
      ]));
    } else {
      var after = bot.getMediaIndex(data.after);
      if (after < 0) return;
      bot.CHANNEL.playlist.splice(after+1, 0, media);
      bot.logger.media(strings.format(bot, "MEDIA_ADD_POS", [
        username,
        media.media.title,
        (after+2)
      ]));
    }
    if (bot.mediaIsBlacklisted(media)) {
      if (bot.deleteVideo(media.uid)) {
        let mediaStr = utils.formatLink(media.media.id, media.media.type, true);
        if (media.queueby !== "")
          bot.sendPM(media.queueby, strings.format(bot, "BLACKLIST_MSG", [mediaStr]));
        //if (mediaStr !== "") bot.sendChatMsg("Deleted blacklisted video: " + mediaStr);
      }
    } else if (~bot.settings.userBlacklist.indexOf(media.queueby.toLowerCase())) {
      bot.purgeUser(media.queueby);
      bot.sendPM(media.queueby, strings.format(bot, "BLACKLIST_USER"));
    }
  });

  socket.on("queueFail", function(data) {
    bot.logger.error(strings.format(bot, "QUEUE_FAIL", [data]));
  });

  socket.on("queueWarn", function(data) {
    bot.logger.warn(strings.format(bot, "QUEUE_WARN", [data]));
  });

  socket.on("rank", function(data) {
    bot.rank = data;
    bot.logger.verbose(strings.format(bot, "RANK_SET", [data]));
    bot.getBanList();
    bot.requestChannelRanks();
    bot.setFlatSkiprate();
    bot.setProgTitle();
  });

  socket.on("readChanLog", function(data) {
    bot.logger.log(strings.format(bot, "CHANLOG_READING"));
    if (data.success) {
      var streamOpts = {
        flags: 'w',
        encoding: 'utf8',
        fd: null,
        mode: 0o660,
        autoClose: true
      };
      var chanStream = fs.createWriteStream(path.join(bot.ROOTPATH, "logs", bot.CHANNEL.room, "chan.log"), streamOpts);
      chanStream.end("" + data.data);
      bot.logger.log(strings.format(bot, "CHANLOG_WRITTEN"));
    } else {
      bot.logger.error(strings.format(bot, "CHANLOG_ERROR"));
    }
  });

  //https://github.com/calzoneman/sync/blob/a53f65a1d5529a592d7d1bd760f3cd70e157ec8b/www/js/callbacks.js#L1082
  socket.on("removeEmote", function(data) {
    bot.logger.mod(strings.format(bot, "EMOTE_REMOVE", [data.name]));
    var found = -1;
    for (var i = 0; i < bot.CHANNEL.emotes.length; i++) {
        if (bot.CHANNEL.emotes[i].name === data.name) {
            found = i;
            break;
        }
    }

    if (found !== -1) {
        bot.CHANNEL.emotes.splice(i, 1);
        delete bot.CHANNEL.emoteMap[data.name];
        for (var i = 0; i < bot.CHANNEL.badEmotes.length; i++) {
            if (bot.CHANNEL.badEmotes[i].name === data.name) {
                bot.CHANNEL.badEmotes.splice(i, 1);
                break;
            }
        }
    }
  });

  //https://github.com/calzoneman/sync/blob/a53f65a1d5529a592d7d1bd760f3cd70e157ec8b/www/js/callbacks.js#L1030
  socket.on("renameEmote", function(data) {
    bot.logger.mod(strings.format(bot, "EMOTE_RENAME", [data.old, data.name]));
    var badBefore = /\s/g.test(data.old);
    var badAfter = /\s/g.test(data.name);
    var oldName = data.old;

    data.regex = new RegExp(data.source, "gi");

    data = {name:data.name, regex:data.regex};

    for (var i = 0; i < bot.CHANNEL.emotes.length; i++) {
        if (bot.CHANNEL.emotes[i].name === oldName) {
            bot.CHANNEL.emotes[i] = data;
            break;
        }
    }

    // Now bad
    if(badAfter){
        // But wasn't bad before: Add it to bad list
        if(!badBefore){
            bot.CHANNEL.badEmotes.push(data);
            delete bot.CHANNEL.emoteMap[oldName];
        }
        // Was bad before too: Update
        else {
            for (var i = 0; i < bot.CHANNEL.badEmotes.length; i++) {
                if (bot.CHANNEL.badEmotes[i].name === oldName) {
                    bot.CHANNEL.badEmotes[i] = data;
                    break;
                }
            }
        }
    }
    // Not bad now
    else {
        // But was bad before: Drop from list
        if(badBefore){
            for (var i = 0; i < bot.CHANNEL.badEmotes.length; i++) {
                if (bot.CHANNEL.badEmotes[i].name === oldName) {
                    bot.CHANNEL.badEmotes.splice(i, 1);
                    break;
                }
            }
        } else {
            delete bot.CHANNEL.emoteMap[oldName];
        }
        bot.CHANNEL.emoteMap[data.name] = data;
    }
  });

  socket.on("setCurrent", function(uid) {
    clearTimeout(bot.timeouts.playingNext);
    if (bot.CHANNEL.currentUID === uid) return;
    bot.CHANNEL.currentUID = uid;
  });

  socket.on("setLeader", function(name) {
    bot.leader = false;
    bot.stopLeadTimer();
    if (name === "") {
      bot.logger.mod(strings.format(bot, "LEADER_REMOVED", [bot.CHANNEL.leader]));
    } else {
      bot.logger.mod(strings.format(bot, "LEADER_GIVEN", [name]));
      if (name === bot.username) {
        bot.leader = true;
        if (bot.seek.time >= 0) {
          bot.sendVideoUpdate(bot.seek.time);
          bot.seek.time = -1;
          if (bot.seek.autoUnassign) {
            bot.assignLeader("");
            bot.seek.autoUnassign = false;
          }
        } else {
          bot.startLeadTimer();
        }
      }
    }
    bot.CHANNEL.leader = name;
  });

  socket.on("setMotd", function(motd) {
    if (bot.first.motdChange) {
      bot.first.motdChange = false;
    } else {
      bot.logger.mod(strings.format(bot, "MOTD_CHANGED"));
    }
  });

  socket.on("setPermissions", function(perms) {
    if (!bot.first.grabbedPermissions)
      bot.logger.mod(strings.format(bot, "CHANNEL_PERMS_UPDATED"));
    bot.first.grabbedPermissions = false;
    bot.CHANNEL.perms = perms;
    bot.setFlatSkiprate();
  });

  socket.on("setPlaylistLocked", function(locked) {
    bot.CHANNEL.playlistIsLocked = locked;
    if (bot.first.playlistLock) {
      bot.first.playlistLock = false;
      if (locked)
        bot.logger.media(strings.format(bot, "PLAYLIST_IS_LOCKED"));
      else
        bot.logger.media(strings.format(bot, "PLAYLIST_IS_UNLOCKED"));
    } else {
      if (locked)
        bot.logger.media(strings.format(bot, "PLAYLIST_LOCKED"));
      else
        bot.logger.media(strings.format(bot, "PLAYLIST_UNLOCKED"));
    }
    bot.setProgTitle();
  });

  socket.on("setPlaylistMeta", function(data) {
    bot.CHANNEL.playlistMeta = data;
    if (bot.cfg.moderation.notifyLowPlaylistTime) {
      let now = Date.now();
      if (!bot.notifiedLowPlaylistTime && (now - bot.lastLowPlaylistNotification >= 300000) && bot.cfg.misc.lowPlaylistTime > data.rawTime) {
        bot.notifiedLowPlaylistTime = true;
        bot.lastLowPlaylistNotification = now;
        bot.sendChatMsg(strings.format(bot, "PLAYLIST_LOW"));
      } else if (bot.cfg.misc.lowPlaylistTime <= data.rawTime){
        bot.notifiedLowPlaylistTime = false;
      }
    }
    bot.logger.media(data.count + " videos in the playlist. [" + data.time + "]");
    bot.setProgTitle();
  });

  socket.on("setTemp", function(data) {
    var media = bot.getMedia(data.uid);
    if (!media) return;
    media.temp = data.temp;
  });

  socket.on("setUserMeta", function(data) {
    var user = bot.getUser(data.name);
    if (!user) return;
    if (data.meta.hasOwnProperty("smuted") && data.meta.smuted !== user.meta.smuted) {
      bot.logger.mod(data.name + " has been " + (!data.meta.smuted ? "un" : "") + "shadowmuted");
    } else if (data.meta.hasOwnProperty("muted") && data.meta.muted !== user.meta.muted) {
      bot.logger.mod(data.name + " has been " + (!data.meta.muted ? "un" : "") + "muted");
    }
    var now = new Date();
    user["meta"] = data.meta;
    if (data.meta) {
      let setSkipRate = ()=>{
        if ((bot.cfg.misc.autoAFK === 0 && user.name === bot.username) || user.name !== bot.username) {
          bot.setFlatSkiprate();
        }
      };
      if (data.meta.afk) {
        user["timeWentAFK"] = now;
        if (bot.cfg.misc.autoAFK === 2 && user.name === bot.username) {
          bot.sendChatMsg("/afk", true, true);
        } else {
          setSkipRate();
        }
      } else {
        if (bot.cfg.misc.autoAFK === 1 && user.name === bot.username) {
          bot.sendChatMsg("/afk", true, true);
        } else {
          setSkipRate();
        }
        if (user["timeWentAFK"] > 0) {
          var delta = now - user.timeWentAFK;
          user.timeWentAFK = -1;
          if (delta >= 3000 && bot.userRankDBCheck(user.rank)) {
            bot.db.run("updateUserAfkTime", [delta, user.name]);
          }
        }
      }
    }
    bot.setProgTitle();
  });

  socket.on("setUserProfile", function(data) {
    var user = bot.getUser(data.name);
    if (!user) return;
    user.profile = data.profile;
  });

  socket.on("setUserRank", function(data) {
    var user = bot.getUser(data.name),
      oldRank = -1,
      changedByUser = data.hasOwnProperty("userrank");
    if (user) {
      if (user.rank === data.rank) return;
      oldRank = user.rank;
      user.rank = data.rank;
    }
    if (data.name === bot.username) {
      bot.handlePermissionChange();
    }
    var rankstr = data.rank;
    if (changedByUser) {
      var oldLabel = oldRank, newLabel = data.rank;
      if (bot.cfg.rankNames.hasOwnProperty(oldRank))
        oldLabel += " [" + bot.cfg.rankNames[oldRank] + "]";
      if (bot.cfg.rankNames.hasOwnProperty(data.rank))
        newLabel += " [" + bot.cfg.rankNames[data.rank] + "]";
      rankstr += " (" + oldLabel + " -> " + newLabel + ")"
    }
    let i = 0,
      nameFound = false,
      rl = bot.CHANNEL.rankList;
    for (;i < rl.length && !nameFound; i++) {
      if (rl[i].name === data.name) {
        nameFound = true;
        if (data.rank < 2) {
          rl.splice(i,1);
        } else {
          rl[i].rank = data.rank;
        }
      }
    }
    if (!nameFound) {
      rl.push({name: data.name, rank: data.rank});
    }
    if (rankstr === data.rank) return;
    if (changedByUser) {
      let _name = user ? utils.colorUsername(bot, user) : data.name;
      bot.logger.mod(strings.format(bot, "RANK_SET_USER", [
        _name,
        rankstr
      ]));
    }
  });

  socket.on("spamFiltered", function(data) {
    var reason = data.reason;
    if (reason !== "NEW_USER_CHAT" && reason !== "NEW_USER_CHAT_LINK") reason = "SPAM_FILTERED";
    bot.logger.error(strings.format(bot, reason));
  });

  socket.on("updateChatFilter", function(f) {
    bot.logger.mod(strings.format(bot, "CHATFILTER_UPDATE", [f.name]));
    if (bot.cfg.advanced.automaticChannelLog) bot.readChanLog();
  });

  //https://github.com/calzoneman/sync/blob/a53f65a1d5529a592d7d1bd760f3cd70e157ec8b/www/js/callbacks.js#L998
  socket.on("updateEmote", function(data) {
    bot.logger.mod(strings.format(bot, "EMOTE_UPDATE", [data.name]));
    data.regex = new RegExp(data.source, "gi");
    data = {name:data.name, regex:data.regex};
    var found = false;
    for (var i = 0; i < bot.CHANNEL.emotes.length; i++) {
        if (bot.CHANNEL.emotes[i].name === data.name) {
            found = true;
            bot.CHANNEL.emotes[i] = data;
            break;
        }
    }
    for (var i = 0; i < bot.CHANNEL.badEmotes.length; i++) {
        if (bot.CHANNEL.badEmotes[i].name === data.name) {
            bot.CHANNEL.badEmotes[i] = data;
            break;
        }
    }

    if (!found) {
        bot.CHANNEL.emotes.push(data);
        if (/\s/g.test(data.name)) {
            bot.CHANNEL.badEmotes.push(data);
        } else {
            bot.CHANNEL.emoteMap[data.name] = data;
        }
    } else {
        bot.CHANNEL.emoteMap[data.name] = data;
    }
  });

  socket.on("updatePoll", function(poll) {
    bot.CHANNEL.poll.counts = poll.counts;
  });

  socket.on("usercount", function(count) {
    bot.CHANNEL.usercount = count;
    bot.logger.verbose(count + " users online.");
    bot.setFlatSkiprate();
    bot.setProgTitle();
  });

  socket.on("userLeave", function(data) {
    var username = data.name;
    var coloredName = utils.colorUsername(bot, username);
    var duel = bot.getUserDuel(data.name, true);
    var now = Date.now();
    if (duel) {
      let other = duel[0];
      if (other === data.name) other = duel[1];
      bot.sendChatMsg(strings.format(bot, "DUEL_USER_LEFT", [data.name, other]));
    }
    let idx = bot.getUserIndex(data.name);
    let rank = bot.CHANNEL.users[idx].rank;
    if (bot.userRankDBCheck(rank))
      bot.updateUserRoomTime(username, true);
    utils.unsortedRemove(bot.CHANNEL.users, idx);
    let dupe = bot.getUser(data.name);
    if (dupe) {
      if (dupe.timeWentAFK > 0)
        dupe.timeWentAFK = now;
      if (dupe.joinTime > now)
        dupe.joinTime = now;
      dupe.lastRoomtimeCheck = now;
    }
    bot.logger.log(strings.format(bot, "USER_LEFT_ROOM", [coloredName]));
    bot.setFlatSkiprate();
  });

  socket.on("userlist", function(userlist) {
    bot.logger.verbose(strings.format(bot, "RECV_USERLIST"));
    bot.CHANNEL.users = userlist;
    var now = Date.now();
    let users = bot.CHANNEL.users;
    let end = users.length;
    let newUsers = [];
    for (var i = 0; i < users.length; i++) {
      let _USER = users[i],
        j = i;
      _USER["lastRoomtimeCheck"] = now;
      _USER["timeWentAFK"] = _USER.meta.afk ? now : -1;
      _USER["joinTime"] = now;
      if (bot.userRankDBCheck(_USER.rank)) {
        bot.db.run("addNewUser", [_USER.name], function(res) {
          if (bot.cfg.moderation.notifyNewUser) {
            if (res && res.rowCount > 0 && res.rows[0].joins <= 1 && _USER.name !== bot.username) {
              newUsers.push(_USER.name);
            }
            if (j >= end-1 && newUsers.length > 0) {
              bot.broadcastModPM(strings.format(bot, "NEW_USERS", [newUsers.join(", ")]));
            }
          }
        });
      }
    }
    bot.getBanList();
    bot.setProgTitle();
  });

  socket.on("voteskip", function(data) {
    bot.CHANNEL.voteskip.count = data.count;
    bot.CHANNEL.voteskip.need = data.need;
    bot.setProgTitle();
  });


  function removeUIDFromBumpList(uid) {
    let uids = bot.bumpStats.lastBumpedUIDs,
      i = uids.length-1;
    for (; i >= 0; i--) {
      if (uids[i] === uid) uids.splice(i, 1);
    }
  }

  function cleanUpcomingUIDsFromBumpList() {
    let i = 0;
    for (; i < bot.CHANNEL.playlist.length && i < bot.cfg.media.bumpCap-1; i++) {
      removeUIDFromBumpList(bot.CHANNEL.playlist[i].uid);
    }
  }
}

module.exports = {
  "setHandlers": setHandlers
}
