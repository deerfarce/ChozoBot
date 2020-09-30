"use strict";

const path = require("path");
const fs = require("fs");
const sio = require("socket.io-client");
const C = require("cli-color");
const fetch = require("node-fetch");
const ent = require("html-entities").AllHtmlEntities;

const EventHandlers = require("./eventhandlers.js");
const clicmd = require("./clicommands.js");
const utils = require("./utils.js");
const chatcmd = require("./chatcommands.js");
const strings = require("./strings.js");
const classes = require("./classes.js");

const PLATFORM = ((process && process.platform) ? process.platform : "win32");

/**
 * class for Bot object.
 * @constructor
 * @param  {Object} config   Configuration object. Read from config.js
 * @param  {Object} readline Readline interface object
 * @param  {String} ROOT     Root filepath (absolute) of the bot.
 */
function Bot(config, readline, ROOT) {

  this.rl = readline;
  this.readlineInitialized = false;

  this.ROOTPATH = ROOT;

  this.DiscordBot = null;

  if (config.discord.use) {
    if (config.discord.token.trim() !== "") {
      this.DiscordBot = require("./discordbot.js").init(this, config.discord.token);
    } else {
      this.logger.error(strings.format(this, "DISCORD_ERR_INIT", ["no token given"]));
    }
  }

  const ROOM = config.login.room;
  this.settingsFile = config.advanced.useChannelSettingsFile ? "settings-" + ROOM + ".json" : "settings.json";

  var streamOpts = {
    flags: 'a',
    encoding: 'utf8',
    fd: null,
    mode: 0o660,
    autoClose: true
  };
  var logStream = fs.createWriteStream(path.join(ROOT, "logs", ROOM, "bot.log"), streamOpts),
      errStream = fs.createWriteStream(path.join(ROOT, "logs", ROOM, "err.log"), streamOpts),
      modStream = fs.createWriteStream(path.join(ROOT, "logs", ROOM, "mod.log"), streamOpts),
      mediaStream = fs.createWriteStream(path.join(ROOT, "logs", ROOM, "media.log"), streamOpts),
      serverStream = fs.createWriteStream(path.join(ROOT, "logs", ROOM, "server.log"), streamOpts),
      debugStream = config.interface.logDebug ? fs.createWriteStream(path.join(ROOT, "logs", ROOM, "debug.log"), streamOpts) : null;

  this.getLogStream = function() {return logStream;}

  let commonLog = (label, message, stream, consolidate)=>{
    if (!message) return;
    this.write(C.blackBright(utils.getTimestamp(config.interface.useTwentyFourHourTime)) + " " + label + message, stream, consolidate);
  }

  this.logger = {
    log: (message) => { if (!message) return;
      commonLog("", message, logStream, false);
    },
    verbose: (message) => { if (!message) return;
      if (config.interface.logVerbose)
        commonLog(C.magentaBright("* "), C.blueBright(message), logStream, false);
    },
    debug: (message) => { if (!message) return;
      if (config.interface.logDebug)
        commonLog(C.magenta("[DEBUG] "), C.magentaBright(message), debugStream, config.interface.logConsolidation);
    },
    info: (message) => { if (!message) return;
      commonLog(C.blue("[INFO] "), C.blueBright(message), logStream, false);
    },
    media: (message) => { if (!message) return;
      commonLog(C.yellowBright("[MEDIA] "), message, mediaStream, config.interface.logConsolidation);
    },
    error: (message) => { if (!message) return;
      commonLog(C.red("[ERROR] "), C.redBright(message), errStream, (config.interface.logConsolidation && !this.cfg.interface.excludeErrorsFromLog));
    },
    warn: (message) => { if (!message) return;
      commonLog(C.yellow("[WARN] "), C.yellowBright(message), logStream, false);
    },
    mod: (message) => { if (!message) return;
      commonLog(C.green("[MOD] "), C.greenBright(message), modStream, config.interface.logConsolidation);
    },
    cylog: (message) => { if (!message) return;
      commonLog(C.cyan("[SERVER] "), C.cyanBright(message), serverStream, config.interface.logConsolidation);
    }
  }

  this.killed = false;
  this.botName = "ChozoBot";
  this.version = "0.992a";

  this.RANKS = config.RANKS;
  this.RANKS["SITEADMIN"] = 255;

  this.actionQueue = new classes.AutoFnQueue(config.misc.queueInterval);
  this.afk = false;
  this.broadcastPMQueue = new classes.AutoFnQueue(config.misc.broadcastPMQueueInterval);
  this.bumpStats = {
    lastBumpedUIDs: [],
    users:{},
    bumpingUIDs:[]
  };
  this.changingPartition = false;
  this.CHANNEL = {
    badEmotes: [],
    banlist: [],
    currentMedia: null,
    currentUID: -1,
    emoteMap: {},
    emotes: [],
    leader: "",
    opts: {},
    perms: {},
    playlist: [],
    playlistIsLocked: false,
    playlistMeta: { count: 0, rawTime: 0, time: 0 },
    poll: {
      active: false,
      title: '',
      options: [],
      counts: [],
      initiator: '',
      timestamp: -1
    },
    rankList: [],
    room: ROOM,
    usercount: 0, //includes anons, updated with usercount event
    users: [],
    voteskip: { count: 0, need: 0 }
  };
  this.cfg = {
    api: config.api,
    connection: config.connection,
    db: config.db,
    discord: config.discord,
    interface: config.interface,
    chat: config.chat,
    media: config.media,
    misc: config.misc,
    moderation: config.moderation,
    advanced: config.advanced,
    rankNames: config.rankNames
  };
  this.currentVideoData = {
    id: null,
    comments: null,
    commentsDisabled: false,
    views: -1,
    likes: 0,
    dislikes: 0,
    ratingsDisabled: false,
    noStats: false
  }
  this.db = require("./db.js");
  this.duels = [];
  //This is for runonce things such as requesting the rank list.
  this.first = {
    grabbedChannelOpts: true,
    grabbedChannelRanks: true,
    grabbedPermissions: true,
    motdChange: true,
    playlistLock: true
  };
  this.largeDataReqQueue = new classes.AutoFnQueue(config.misc.largeDataQueueInterval);
  this.leadFinishingMedia = false;
  this.gettingBanList = false;
  this.gettingComments = false;
  this.gettingVideoMeta = false;
  this.guest = false;
  this.handlingChatCommands = false;
  this.hasConnectedBefore = false;
  this.KICKED = false;
  this.lastLowPlaylistNotification = Date.now();
  this.leader = false;
  this.leadTimer = null;
  this.logged_in = false;
  //Used with minuteTick for half-hours and such to avoid multiple timers
  this.minutesPassed = 0;
  this.notifiedLowPlaylistTime = false;
  this.pendingLanguageChange = null;
  this.rank = 0;
  this.seek = {
    time: -1,
    autoUnassign: true
  };
  this.socketConnErrors = 0;
  this.started = Date.now(); //let's timestamp when the bot started because that's useful
  this.userCooldowns = {};
  this.username = "";
  this.timeouts = {
    changeMediaLead: null,
    minuteTick: null,
    playingNext: null,
  },
  this.trigger = this.validateTrigger(config.chat.trigger);

  this.settings = {
    muted: false,
    disallow: [],
    timeBans: {},
    minRankOverrides: {},
    rankMatchOverrides: {},
    userCooldownOverrides: {},
    cmdCooldownOverrides: {},
    cmdStateOverrides: {},
    userData: {},
    mediaBlacklist:[],
    userBlacklist:[],
    lucky:{},
    flatSkiprate: {
      managing: false,
      target: -1,
      original_rate: -1
    },
  };

  this.logger.info(strings.format(this, "INIT", [this.botName, this.version]));
  this.logger.verbose(strings.format(this, "ACTIONQUEUE_INIT_INTERVAL", [config.misc.queueInterval]));

  //read settings.json and if there was an error (file doesn't exist) then write a new one
  //also, initializes chat commands
  this.readSettings(hasErr => {
    if (!hasErr) {
      if (this.getOpt("muted", false)) {
        this.logger.warn(strings.format(this, "BOT_MUTED_INIT"));
      }
      if (!this.getOpt("timeBans", {}).hasOwnProperty(ROOM)) {
        this.settings.timeBans[ROOM] = [];
      }
      chatcmd.init(this);
    }
  });

  /**
   *  Takes socket server config and attempts to establish a connection. Sets event handlers.
   *  @function
   *  @name connectToServer
   *  @param {Object} server Socket server config object
   */
  let connectToServer = (server)=>{
    this.logger.debug(strings.format(this, "DBG_FOUND_SOCKET", [server.url]));
    var fn = (()=>{
      if (utils.getHostname(server.url).toLowerCase() !== config.connection.hostname.toLowerCase()) {
        this.logger.error(strings.format(this, "SERVER_BAD_HOSTNAME", [config.connection.hostname]));
        this.kill("bad server hostname");
      } else {
        this.socket = sio(server.url, {secure: server.secure});
        EventHandlers.setHandlers(this, this.socket, config);
      }
    });
    this.actionQueue.enqueue([this, fn, []]);
  }


  this.getSocketConfig(this.CHANNEL.room, config.connection.secureSocket, connectToServer);

  //for use with partitionChange
  //NOT TESTED FULLY! could work though
  this.hardReconnect = function(socketConfig) {
    if (this.socket && this.socket.connected && !this.changingPartition) {
      this.socket.disconnect();
    }
    this.hasConnectedBefore = false;
    this.logger.log(strings.format(this, "CONNECTING"));
    let i = 0,
      server = null,
      servers = socketConfig.servers;
    for (;i < servers.length; i++) {
      if (servers[i].secure === config.connection.secureSocket) {
        server = servers[i];
        break;
      }
    }
    if (!server && servers.length >= 1) {
      server = servers[0];
    } else if (!server) {
      this.kill("No socket config handed over during partition change", 2000, 0);
      return;
    }
    this.changingPartition = false;
    connectToServer(server);
  }
}

/**
 * Tries to set leader to the given user.
 *
 * @param  {string} name A username. Can be blank ("") to remove the current leader.
 * @return {boolean}     True if the given user is in the room; false if not, or no leaderctl permissions.
 */
Bot.prototype.assignLeader = function(name) {
  if (!this.checkChannelPermission("leaderctl")) {
    this.logger.error("Tried to assign a leader to " + name + ", but bot doesn't have leaderctl perms");
    if (!this.leader && name.toLowerCase() === this.username.toLowerCase()) {
      this.seek.time = -1;
    }
    return false;
  }
  let usr = (name === "" ? {name: ""} : this.getUser(name));
  if (usr) {
    let fn = ()=>{this.socket.emit("assignLeader", {name:usr.name})};
    this.actionQueue.enqueue([this, fn, []]);
    return true;
  }
  return false;
}

/**
 * Removes a given user from the disallowed list.
 *
 * @param  {string} username Username.
 * @return {boolean}         True if the user was previously disallowed. False otherwise.
 */
Bot.prototype.allowUser = function(username) {
  if (!username || username.trim() === "") return;
  username = username.toLowerCase().trim();
  var da = this.getOpt("disallow", []);
  let i = 0;
  for (; i < da.length; i++) {
    if (da[i] === username) {
      this.logger.info(strings.format(this, "USER_ALLOWED", [username]));
      utils.unsortedRemove(da, i);
      this.writeSettings();
      return true;
    }
  }
  this.logger.info(strings.format(this, "USER_ALLOWED_FAIL", [username]));
  return false;
}

/**
 * Sends a private message to multiple users at once.
 *
 * @param  {string[]} users   Users to send messages to.
 * @param  {string} message   The message.
 */
Bot.prototype.broadcastPM = function(users, message) {
  if (this.settings.muted) return;
  var fn = ((username, message)=>{
    this.socket.emit("pm", {
      "to":C.strip(username),
      "msg":C.strip(message)
    });
  });
  let i = 0;
  for(;i < users.length; i++) {
    this.broadcastPMQueue.enqueue([this, fn, [users[i], message]])
  }
}

/**
 * Sends a private message to all online mods.
 *
 * @param  {string} message Message to send.
 */
Bot.prototype.broadcastModPM = function(message) {
  this.broadcastPM(this.getOnlineMods(true, true), message);
}

/**
 * Check if the bot has a given channel permission.
 *
 * @param  {string} perm Permission to check against. See bottom of bot.js for a list
 * @return {boolean}     True if bot has permission, otherwise false.
 */
Bot.prototype.checkChannelPermission = function(perm) {
  return this.userHasChannelPermission(perm, this.rank);
}

/**
 * Check if bot has multiple channel permissions.
 *
 * @param  {string[]} perms Array of permissions to check.
 * @return {boolean}       True if bot has every permission, otherwise false.
 */
Bot.prototype.checkChannelPermissions = function(perms) {
  let i = 0;
  for (;i < perms.length;i++) {
    if (!this.userHasChannelPermission(perms[i], this.rank)) return false;
  }
  return true;
}

/**
 * Unbans all timebanned users if their times have expired.
 *
 * @return {boolean}  False if bot cannot ban or banlist is empty, otherwise true.
 */
Bot.prototype.checkTimeBans = function() {
  let bl = this.CHANNEL.banlist,
    tb = this.settings.timeBans[this.CHANNEL.room];
  if (bl.length <= 0 || !this.checkChannelPermission("ban")) return false;
  let i = 0;
  for (;i < tb.length; i++) {
    if (Date.now() >= tb[i].unbanTime) {
      this.unbanUser(tb[i].name);
    }
  }
  return true;
}

/**
 * Purges blacklisted users, and deletes blacklisted media from the playlist.
 *
 * @return {boolean}  False if bot cannot delete media, otherwise true.
 */
Bot.prototype.cleanBlacklistedMedia = function() {
  if (!this.checkChannelPermission("playlistdelete")) return false;
  let pl = this.CHANNEL.playlist,
    bu = this.getOpt("userBlacklist", []),
    bm = this.getOpt("mediaBlacklist", []),
    i = 0,
    purge = [],
    del = [];
  for (;i < pl.length;i++){
    let usr = pl[i].queueby.toLowerCase();
    let userIsBlacklisted = ~bu.indexOf(usr);
    if (!~purge.indexOf(usr) && userIsBlacklisted) {
      purge.push(pl[i].queueby);
    } else if (!userIsBlacklisted && this.mediaIsBlacklisted(pl[i])) {
      del.push(pl[i].uid);
    }
  }
  for (i = 0;i < purge.length; i++) {
    this.purgeUser(purge[i]);
  }
  for (i = 0;i < del.length; i++) {
    this.deleteVideo(del[i]);
  }
  return true;
}

/**
 * Cleans bot state. Dangerous: Only use if disconnected!
 */
Bot.prototype.cleanState = function() {
  let room = this.CHANNEL.room;
  this.CHANNEL = {
      badEmotes: [],
      banlist: [],
      currentMedia: null,
      currentUID: -1,
      emoteMap: {},
      emotes: [],
      leader: "",
      opts: {},
      perms: {},
      playlist: [],
      playlistIsLocked: false,
      playlistMeta: { count: 0, rawTime: 0, time: 0 },
      poll: {
        active: false,
        title: '',
        options: [],
        counts: [],
        initiator: '',
        timestamp: -1
      },
      rankList: [],
      room: room,
      usercount: 0,
      users: [],
      voteskip: { count: 0, need: 0 }
  };
  this.afk = false;
  this.first = {
    grabbedChannelOpts: true,
    grabbedChannelRanks: true,
    grabbedPermissions: true,
    loadedBlacklist: true,
    motdChange: true,
    playlistLock: true
  };
  this.leadFinishingMedia = false;
  this.gettingBanList = false;
  this.guest = false;
  this.leader = false;
  this.leadTimer = null;
  this.logged_in = false;
  this.rank = 0;
  this.socketConnErrors = 0;
  this.username = "";
}

/**
 * Carries out a duel (the given object).
 *
 * @param  {Object} duel Object containing duel info.
 * @return {boolean}     False if duel is null, otherwise true.
 */
Bot.prototype.commenceDuel = function(duel) {
  if (!duel) return false;
  let A = 0,
  B = 0;
  //Setting the min/max to the same number will cause an infinite loop
  function roll() {
    A = Math.floor((Math.random() * 100) + 1);
    B = Math.floor((Math.random() * 100) + 1);
  }
  while (A === B) {
    roll();
  }
  let strArgs = [duel[0], duel[1], A, B, "/tinyrekt"];
  if (A > B) {
    this.sendChatMsg(strings.format(this, "DUEL_RESULT_WIN", strArgs));
    this.db.run("insertDuelRecord", [duel[0], duel[1]]);
  } else {
    this.sendChatMsg(strings.format(this, "DUEL_RESULT_LOSS", strArgs));
    this.db.run("insertDuelRecord", [duel[1], duel[0]]);
  }
  return true;
}

/**
 * Attempts to delete the video with the given UID.
 *
 * @param  {number} uid UID of the desired video
 * @return {boolean}     True if UID is a number and bot can delete media, otherwise false.
 */
Bot.prototype.deleteVideo = function(uid) {
  if (typeof uid === "number" && this.checkChannelPermission("playlistdelete")) {
    let fn = ()=>{this.socket.emit("delete", uid)};
    this.actionQueue.enqueue([this, fn, []]);
    return true;
  }
  return false;
}

/**
 * Takes a media object and deletes all occurrences of media with the same type and ID.
 *
 * @param  {Object} media Media object.
 * @return {boolean}      False if bot cannot delete media or see the playlist, otherwise true.
 */
Bot.prototype.deleteVideoAndDupes = function(media) {
  if (!this.checkChannelPermissions(["playlistdelete", "seeplaylist"])) return false;
  let _media = media.hasOwnProperty("media") ? media.media : media;
  if (_media && _media.id && _media.type) {
    let vids = this.getMediaAll(_media.id, _media.type),
      i = vids.length-1;
    for (;i>=0;i--) {
      this.deleteVideo(vids[i].uid);
    }
  }
  return true;
}

/**
 * Check if a user is disallowed.
 *
 * @param  {string} username Username.
 * @return {boolean}         True if given user is disallowed, otherwise false.
 */
Bot.prototype.disallowed = function(username) {
  return ~this.settings.disallow.indexOf(username.toLowerCase().trim());
}

/**
 * Disallows a user.
 *
 * @param  {string} username Username.
 * @return {boolean}         True if user is not already disallowed, false otherwise.
 */
Bot.prototype.disallowUser = function(username) {
  if (!username || username.trim() === "") return false;
  username = username.toLowerCase().trim();
  if (!~this.getOpt("disallow", []).indexOf(username)) {
    this.settings.disallow.push(username);
    this.writeSettings();
    this.logger.info(strings.format(this, "USER_DISALLOWED", [username]));
    return true;
  } else
    this.logger.info(strings.format(this, "USER_DISALLOWED_FAIL", [username]));
  return false;
}

/**
 * Check if an emote exists in the channel's emote list.
 *
 * @param  {string} emote Name of emote as it would be used normally in chat.
 * @return {boolean}      True if emote exists, false if not.
 */
Bot.prototype.emoteExists = function(emote) {
  return (this.CHANNEL.emoteMap.hasOwnProperty(emote) || ~this.CHANNEL.badEmotes.indexOf(emote));
}

/**
 * Get number of AFK users in the room.
 *
 * @return {number}  Number of AFK users.
 */
Bot.prototype.getAFKCount = function() {
  var users = this.CHANNEL.users;
  var afk = 0;
  let i = 0;
  for (; i < users.length; i++) {
    if (users[i].meta.afk)
      afk++;
  }
  return afk;
}

/**
 * Send socket request to retrieve the ban list. Can be quite heavy, use with care.
 */
Bot.prototype.getBanList = function() {
  if (this.checkChannelPermission("ban")) {
    if (!this.gettingBanList) {
      this.gettingBanList = true;
      let fn = ()=>{this.socket.emit("requestBanlist")};
      this.largeDataReqQueue.enqueue([this, fn, []]);
    }
  } else {
    this.CHANNEL.banlist = [];
  }
}

//WARNING! Only works if the bot is rank >= 3, so be careful
/**
 * Get rank of user from the actual rank list. Must be rank >= 3 to retrieve the list.
 *
 * @param  {string} name Username.
 * @return {number}     Rank of the user if they are moderator+. -1 if user is not a mod, or the bot cannot see the rank list.
 */
Bot.prototype.getChanRank = function(name) {
  name = name.toLowerCase();
  let i = 0,
    rl = this.CHANNEL.rankList;
  for (;i < rl.length; i++) {
    if (rl[i].name === name) {
      return rl[i].rank;
    }
  }
  return -1;
}

/**
 * Gets the currently active poll as an object that can be used to create another poll. Does not include initiator or timestamp.
 *
 * @return {Object|null}  Poll object, null if no poll active or blank poll
 */
Bot.prototype.getCurrentPollFrame = function() {
  let poll = this.CHANNEL.poll;
  if (!poll || !poll.active || (poll.options.length <= 0 && poll.title.trim() === "")) return null;
  let obscured = (poll.counts.length >= 1 && (typeof poll.counts[0] === "string") && poll.counts[0].indexOf("?") >= 0);
  return {
    title: poll.title,
    opts: poll.options,
    obscured: obscured
  }
}

/**
 * Gets the full media object from a media's UID
 *
 * @param  {number} uid Media UID
 * @return {Object|null}     Media object matching the given UID, or null if not found.
 */
Bot.prototype.getMedia = function(uid) {
  var index = this.getMediaIndex(uid);
  if (~index) return this.CHANNEL.playlist[index];
  return null;
}

/**
 * Get a list of all media objects matching an ID and Type. Good for duplicates if allowed.
 *
 * @param  {string} id   Media ID, such as Video ID of YouTube videos.
 * @param  {string} type Host type abbreviation (yt, vi, dm, etc.)
 * @return {Object[]}      An array containing any matching media objects.
 */
Bot.prototype.getMediaAll = function(id, type) {
  if (!id || !type) return [];
  let vids = [],
    i = 0,
    pl = this.CHANNEL.playlist;
  for (;i < pl.length; i++) {
    if (pl[i].media && pl[i].media.id === id && pl[i].media.type === type) {
      vids.push(pl[i]);
    }
  }
  return vids;
}

/**
 * Gets the first index of a media object within the playlist matching the provided UID.
 *
 * @param  {number} uid Media UID.
 * @return {number}     Index of media object within the playlist. -1 if not found.
 */
Bot.prototype.getMediaIndex = function(uid) {
  var i = 0;
  for (; i < this.CHANNEL.playlist.length; i++) {
    if (this.CHANNEL.playlist[i]["uid"] === uid) {
      return i;
    }
  }
  return -1;
}

/**
 * Gets a list of all mods (users with rank >= 2) online.
 *
 * @param  {boolean} excludeSelf If true, excludes bot from the resulting array.
 * @return {string[]}       Array of usernames.
 */
Bot.prototype.getOnlineMods = function(excludeSelf, excludeBots) {
  let mods = [],
    users = this.CHANNEL.users,
    i = 0;
  for (;i<users.length;i++) {
    if (!(excludeSelf && users[i].name === this.username) && !(excludeBots && ~this.cfg.misc.bots.indexOf(users[i].name)) && users[i].rank >= this.RANKS.MOD) {
      mods.push(users[i].name);
    }
  }
  return mods;
}

/**
 * Gets an option from settings.json, setting a default value if not found.
 *
 * @param  {string} opt Option name.
 * @param  {*} def Default value if the option was not found.
 * @return {*}     Value of the option, or the default value given.
 */
Bot.prototype.getOpt = function(opt, def) {
  if (this.settings.hasOwnProperty(opt)) return this.settings[opt];
  this.logger.warn("getOpt: could not find " + opt + ", setting default value");
  this.settings[opt] = def;
  this.writeSettings();
  return def;
}

/**
 * Gets saved user data from settings.json.
 *
 * @param  {string} username A username.
 * @return {Object}          User data object. Empty if not found.
 */
Bot.prototype.getSavedUserData = function(username) {
  username = username.toLowerCase();
  if (this.settings.userData.hasOwnProperty(username))
    return this.settings.userData[username];
  return {};
}

/**
 * Queries CyTube for room socket info.
 *
 * @param  {string} room     Room name.
 * @param  {boolean} secure   If true, select a secure server.
 * @param  {connectToServer} callback Callback to send the socket server object to.
 */
Bot.prototype.getSocketConfig = function(room, secure, callback) {
  if (typeof callback !== "function") {
    return this.logger.error(strings.format(this, "CALLBACK_INVALID", ["getSocketConfig"]));
  }
  if (!secure) {
    this.logger.warn(strings.format(this, "SERVER_INSECURE"))
  }
  var fn = (()=>{
    fetch("https://"+this.cfg.connection.hostname+"/socketconfig/" + room + ".json")
      .then((res)=>{
        if (!res.ok) {
          this.logger.error(strings.format(this, "SERVER_ROOM_NOT_FOUND", [room]));
          this.logger.warn("The server may be having issues, or the room was not found.");
          this.logger.info("Retrying connection in 60 seconds. Use CTRL+C to exit.");
          setTimeout(()=>{
            this.getSocketConfig(room, secure, callback);
          }, 60000);
          throw new Error(res.statusText);
        } else {
          return res.json();
        }
      })
      .then((json)=>{
        var servers = json.servers;
        let i = 0;
        for (; i < servers.length; i++) {
          if (servers[i]["secure"] === secure) {
            return servers[i];
          }
        }
        return "";
      })
      .then((server)=>{
        if (server && server.url && server.url.trim() !== "") {
          callback(server);
          return true;
        } else {
          this.logger.error(strings.format(this, "SERVER_ROOM_NOT_FOUND", [room]));
          return false;
        }
      })
      .catch((error)=>{
        this.logger.error(strings.format(this, "SERVER_REQUEST_ERROR", [error.stack]));
        this.logger.warn("The server may be down. Check to see if you can connect to it using a browser. Use CTRL+C to exit.");
      });
  });
  this.actionQueue.enqueue([this, fn, []]);
}

/**
 * Get user object from a username.
 *
 * @param  {string} username Username.
 * @return {Object|null} User object if the given user is in the room, or null if not.
 */
Bot.prototype.getUser = function(username) {
  var i = 0;
  username = username.toLowerCase();
  for (; i < this.CHANNEL.users.length; i++) {
    if (this.CHANNEL.users[i].name.toLowerCase() === username) {
      return this.CHANNEL.users[i];
    }
  }
  return null;
}

/**
 * Get duel object that the given username is in.
 *
 * @param  {string} username A username.
 * @param  {boolean=} remove Optional, but if true, removes the object from the duel pool.
 * @return {Object|null}     Duel object if found, null otherwise.
 */
Bot.prototype.getUserDuel = function(username, remove) {
  let i = 0;
  for (;i < this.duels.length; i++) {
    if (~this.duels[i].indexOf(username)) {
      let duel = this.duels[i];
      if (remove) {
        clearTimeout(duel[2]);
        utils.unsortedRemove(this.duels, i);
      }
      return duel;
    }
  }
  return null;
}

/**
 * Gets the index of a user object in the userlist with the given username.
 *
 * @param  {string} username A username.
 * @return {number}          Index in the userlist of the user object if found, otherwise -1.
 */
Bot.prototype.getUserIndex = function(username) {
  var i = 0;
  username = username.toLowerCase();
  for (; i < this.CHANNEL.users.length; i++) {
    if (this.CHANNEL.users[i].name.toLowerCase() === username) {
      return i;
    }
  }
  return -1;
}

/**
 * Gets the amount of users in the room that are both not AFK and able to voteskip.
 *
 * @return {number}          Count of users who can skip
 */
Bot.prototype.getUsersWithSkipPerms = function() {
  let min = this.CHANNEL.perms.voteskip,
    users = this.CHANNEL.users,
    i = 0,
    count = 0;
  for (; i < users.length; i++) {
    if (!users[i].meta.afk && users[i].rank >= min) {
      count++;
    }
  }
  return count;
}

/**
 * Gets a list of videos added by the specified user.
 *
 * @param  {string} username A username.
 * @return {Object[]}        Array of media objects added by the specified user.
 */
Bot.prototype.getUserVideos = function(username) {
  username = username.toLowerCase();
  let vids = [],
    pl = this.CHANNEL.playlist,
    i = 0;
  for (;i < pl.length;i++) {
    if (pl[i].queueby.toLowerCase() === username) {
      vids.push(pl[i]);
    }
  }
  return vids;
}

/**
 * Resets some things depending on the bot's rank and permissions.
 */
Bot.prototype.handlePermissionChange = function() {
  if (!this.checkChannelPermission("ban")) {
    this.CHANNEL.banlist = [];
  }

  if (!this.checkChannelPermission("seeplaylist")) {
    this.CHANNEL.playlist = [];
  }

  if (!this.checkChannelPermission("voteskip")) {
    this.CHANNEL.voteskip.count = 0;
    this.CHANNEL.voteskip.need = 0;
  }

  if (this.rank < 2) {
    //get our options first just to be able to log that we're disabling it
    let skipopts = this.getOpt("flatSkiprate", {
        managing: false,
        target: -1,
        original_rate: -1
    });
    if (skipopts.managing) {
      this.logger.warn("Disabling automatic flat skiprate. Rank is too low.");
    }
    this.setOpt("flatSkiprate", {
        managing: false,
        target: -1,
        original_rate: -1
    })
  }

  this.setProgTitle();
}

/**
 * Stops the bot and prepares the process to end.
 *
 * @param  {string} reason   Reason for killing the bot. Mostly for logging purposes.
 * @param  {number} timeout  Amount of time in milliseconds to wait until setting the exit code. Minimum is 1000.
 * @param  {number=} exitCode Defaults to 0. Sets the process's exit code to something else if needed. An exitcode of 3 is considered safe but prevents restarting.
 */
Bot.prototype.kill = async function(reason, timeout, exitCode) {
  if (this.killed) return;
  this.killed = true;
  this.stopAllTimers();
  this.handlingChatCommands = false;
  this.setProgTitle();
  if (this.DiscordBot) {
    this.DiscordBot.client.destroy();
  }
  if (!timeout || timeout < 1000) timeout = 1000;
  if (!reason) reason = "none given";
  var sectext = timeout === 1000 ? " second" : " seconds";
  this.logger.warn(strings.format(this, "EXIT", [(timeout/1000) + sectext, reason]));

  await this.updateUserRoomTimeAll();
  await this.db.endPool();

  this.logger.debug("Reached end of await block in bot.kill");

  if (this.socket && this.socket.connected)
    this.socket.disconnect();
  this.writeSettings();
  this.rl.close();

  setTimeout(function() {
    process.stdin.destroy();
    process.exitCode = 0;
  }, timeout);

}

/**
 * Searches the banlist and finds usernames associated with subnets that match the given IP's subnet.
 *
 * @param  {string} ip         A user's IP
 * @param  {boolean=} mergeDupes If true, will shorten the output by including the amount of times each username occurs and excluding duplicate names from the output.
 * @return {string[]}            Returns array of usernames that were found. If mergeDupes is true, usernames that occurred twice or more will appear like: username (x) where x is the occurrence count
 */
Bot.prototype.matchSubnet = function(ip, mergeDupes) {
  ip = ip.match(/.*\./);
  let matches = [],
    i = 0,
    bl = this.CHANNEL.banlist,
    counts = {};
  for (;i < bl.length;i++){
    if (~bl[i]["ip"].indexOf(ip)) {
      if (mergeDupes) {
        if (!counts.hasOwnProperty(bl[i].name)) {
          matches.push(bl[i].name);
          counts[bl[i].name] = 1;
        }
        else counts[bl[i].name]++;
      } else {
        matches.push(bl[i].name);
      }
    }
  }

  if (mergeDupes) {
    i = 0;
    for(;i < matches.length;i++) {
      let count = counts[matches[i]];
      if (count && count > 1) {
        matches[i] += " (" + count + ")";
      }
    }
  }

  return matches;
}

/**
 * Checks if the given media object is blacklisted.
 *
 * @param  {Object} media Media object.
 * @return {boolean}      True if media is blacklisted, false if not found or invalid object.
 */
Bot.prototype.mediaIsBlacklisted = function(media) {
  let _media = media.hasOwnProperty("media") ? media.media : media;
  if (_media && _media.id && _media.type) {
    return ~this.settings.mediaBlacklist.indexOf(utils.formatLink(_media.id, _media.type, true));
  }
  return false;
}

/**
 * DO NOT CALL MANUALLY. Called whenever a mediaUpdate frame is received. Determines, if the bot is leader, if the current video is finished and the next video should play.
 *
 * @param  {Object} data mediaUpdate frame data, usually containing current media states such as current time and paused state
 */
Bot.prototype.mediaUpdateTick = function(data) {
  if (this.leader) {
    let media = this.CHANNEL.currentMedia;
    if (media && media.seconds > 0) {
      let duration = media.seconds;
      let diff = duration - data.currentTime;
      if (diff < 1 && !this.leadFinishingMedia) {
        this.leadFinishingMedia = true;
        clearTimeout(this.timeouts.playingNext);
        let next = ()=>{if (this.leader) this.socket.emit("playNext");}
        if (diff === 0) next(); //avoid setting a timeout with 0ms delay
        else this.timeouts.playingNext = setTimeout(next.bind(this), 1000);
      }
    }
  }
}

/**
 * Minute-long timeout loop that continously runs. Calling this will reset the currently active timer. Checks timebans every minute.
 *
 */
Bot.prototype.minuteTick = function() {
  clearTimeout(this.timeouts.minuteTick);
  if (this.KILLED) return;

  this.minutesPassed++;

  if (this.CHANNEL.banlist.length > 0) {
    this.checkTimeBans();
  }

  if (this.minutesPassed >= 30) {
    this.minutesPassed = 0;
    let bumpCd = this.cfg.media.bumpCooldown,
      bumpUsers = this.bumpStats.users;
      i = 0;

    //Clean up bump cooldowns
    for (var i in bumpUsers) {
      if (Date.now() - bumpUsers[i] >= bumpCd) {
        delete bumpUsers[i];
      }
    }
    this.updateUserRoomTimeAll();
  }

  this.timeouts.minuteTick = setTimeout(()=>{
    this.minuteTick();
  }, 1*60*1000);
}

/**
 * Mutes a given user.
 *
 * @param  {!string} username Username to mute
 * @param  {?boolean=} shadow   If true, shadowmutes instead
 * @return {boolean}          True if all conditions to mute succeed, otherwise false
 */
Bot.prototype.muteUser = function(username, shadow) {
  if (this.checkChannelPermission("mute") && username && username.toLowerCase() !== this.username.toLowerCase()) {
    let user = this.getUser(username);
    if (user && ((!shadow && !user.meta.muted) || (shadow && !user.meta.smuted)) && this.rank > user.rank) {
      let cmd = "/mute ";
      if (shadow) cmd = "/smute ";
      this.sendChatMsg(cmd + user.name, false, true);
      return true;
    }
  }
  return false;
}

/**
 * Tries to move one media item after another using UIDs.
 * @see {@link Bot#putMediaAtTop}
 * @see {@link Bot#putMediaAtBottom}
 * @param  {number} fromUID  UID of the media item to move.
 * @param  {number|string} afterUID UID of the item to move the media after. Can also be "prepend" or "append" to move the media to the very top/bottom of the playlist, respectively.
 * @return {boolean}       Returns false if fromUID is not given or both UIDs are the same, otherwise true.
 */
Bot.prototype.moveMedia = function(fromUID, afterUID) {
  if (undefined == fromUID || fromUID === afterUID) {
    return false;
  }

  let fn = (()=>{
    this.socket.emit("moveMedia", {
      from: fromUID,
      after: afterUID
    });
  });
  this.actionQueue.enqueue([this, fn, []]);
  return true;
}

/**
 * Logs the currently playing video and time if in progress, and sends a Discord embed if enabled.
 *
 */
Bot.prototype.notifyVideoState = function() {
  let _media = this.CHANNEL.currentMedia;
  if (_media) {
    let meta = this.getMedia(this.CHANNEL.currentUID);
    if (meta) {
      if (meta.media.id === _media.id && meta.media.type === _media.type) {
        let link = utils.formatLink(_media.id, _media.type, true);
        let username = meta.queueby === "" ? "(anon)" : meta.queueby;
        let _args = [
          utils.colorUsername(this, username),
          utils.colorMediaTitle(this, _media.type, _media.title),
          C.blackBright("[" + link + "]"),
          C.blackBright("[t: " + _media.duration + "]")
        ];
        let string = "NOW_PLAYING";
        if (_media.currentTime > 5) {
          _args.push(C.blackBright("[ct: " + utils.secsToTime(Math.floor(_media.currentTime)) + "]"));
          string = "CURRENTLY_PLAYING";
        }
        this.logger.media(strings.format(this, string, _args));
        if (this.DiscordBot && this.cfg.discord.sendNowPlayingMessages && this.cfg.discord.nowPlayingChannelID.trim() !== "") {
          var color = "#00AD53";
          if (this.DiscordBot.lastNowPlayingWasGreen)
            color = "#A4479A";
          this.DiscordBot.lastNowPlayingWasGreen = !this.DiscordBot.lastNowPlayingWasGreen;
          this.DiscordBot.getChannel(this.cfg.discord.nowPlayingChannelID).send(
            this.DiscordBot.createEmbed()
              .setColor(color)
              .setAuthor(':: now playing ::', this.cfg.discord.iconUrl, 'https://'+bot.cfg.connection.hostname+'/r/' + this.CHANNEL.room)
              .setTitle(ent.decode(_media.title))
              .setDescription(link)
              .addField("Added by", username, true)
              .addField("Media Duration", _media.duration, true)
              .setTimestamp()
          );
        }
      } else {
        this.logger.error("UID mismatch!");
      }
    }
  }
}

/**
 * Opens a poll with the given poll data object.
 *
 * @param  {Object} pollData An object with poll data.
 */
Bot.prototype.openPoll = function(pollData) {
  if (this.checkChannelPermission("pollctl") && pollData.hasOwnProperty("title") && pollData.hasOwnProperty("opts")) {
    let fn = ()=>{this.socket.emit("newPoll", pollData)};
    this.actionQueue.enqueue([this, fn, []]);
  }
}

/**
 * Cleans the playlist of any videos added by the given user.
 * @see {@link Bot#purgeUsers}
 * @param  {string} username Username to purge.
 * @param  {boolean=} touch  If true, will check to see if the user has at least one video before trying to purge.
 * @return {boolean}  True if bot can delete videos and if touch conditions pass, otherwise false.
 */
Bot.prototype.purgeUser = function(username, touch) {
  if (this.checkChannelPermission("playlistdelete") && username.trim() !== "") {
    if (!touch || (touch && this.touchUserVideos(username))) {
      this.sendChatMsg("/clean " + username, false, true);
      this.logger.mod("Attempted to purge " + username + ".");
      return true;
    }
  }
  return false;
}

/**
 * Cleans the playlist of any videos added by the given users.
 * @see {@link Bot#purgeUser}
 * @param  {string[]} users Users to purge.
 * @param  {boolean=} touch If true, will check to see if the user has at least one video before trying to purge.
 */
Bot.prototype.purgeUsers = function(users, touch) {
  if (this.checkChannelPermission("playlistdelete")) {
    let i = 0;
    for (;i < users.length; i++) {
      this.purgeUser(users[i], touch);
    }
  }
}

/**
 * Moves a given media item to the very bottom of the playlist
 * @see {@link Bot#moveMedia}
 * @param  {number} uid UID of media to move
 */
Bot.prototype.putMediaAtBottom = function(uid) {
  this.moveMedia(uid, "append");
}

/**
 * Moves a given media item to the very top of the playlist
 * @see {@link Bot#moveMedia}
 * @param  {number} uid UID of media to move
 */
Bot.prototype.putMediaAtTop = function(uid) {
  this.moveMedia(uid, "prepend");
}

/**
 * Emits a request to receive the channel log. MUST be Rank >=3 or it will kick you
 */
Bot.prototype.readChanLog = function() {
  if (this.rank >= 3) { //ALWAYS PERFORM THIS CHECK! this rank is also hardcoded on CyTube
    var fn = (()=>{this.socket.emit("readChanLog");});
    this.largeDataReqQueue.enqueue([this, fn, []]);
  }
}

/**
 * Reads settings.json, looks for missing properties, and stores it
 *
 * @param  {Function} callback Callback function to feed the read data into
 * @return {*}          Returns data returned by the callback
 */
Bot.prototype.readSettings = function(callback) {
  var data;
  try {
    data = fs.readFileSync(path.join(this.ROOTPATH, this.settingsFile), "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      this.writeSettings();
    } else {
      this.logger.error(strings.format(this, "FILE_READ_ERROR", [this.settingsFile, err.stack]));
      this.kill("error in settings file", 5000, 1);
      return callback(true);
    }
  }
  var oldSettings = this.settings;
  var newSettings = !data ? {} : JSON.parse(data);
  for (var i in oldSettings) {
    if (!newSettings.hasOwnProperty(i)) {
      this.logger.debug(strings.format(this, "SETTINGS_PROPERTY_MISSING", [i]));
      newSettings[i] = oldSettings[i];
    }
  }
  this.settings = newSettings;
  this.logger.verbose(strings.format(this, "SETTINGS_READ"));
  return callback(false);
}

/**
 * Emits a request to grab the channel ranks. Need to be rank >= 3.
 */
Bot.prototype.requestChannelRanks = function() {
  if (this.rank >= 3) {
    var fn = (()=>{this.socket.emit("requestChannelRanks");});
    this.largeDataReqQueue.enqueue([this, fn, []]);
  }
}

/**
 * Clears the current cache of stuff retrieved from the YouTube API, such as comments.
 */
Bot.prototype.resetCurrentVidData = function() {
  this.currentVideoData = {
    id: null,
    comments: null,
    commentsDisabled: false,
    views: -1,
    likes: 0,
    dislikes: 0,
    ratingsDisabled: false,
    noStats: false
  };
  this.gettingComments = false;
  this.gettingVideoMeta = false;
}

/**
 * Sends a chat message.
 *
 * @param  {!string} message     Message to send
 * @param  {?boolean=} bypassQueue If true, will not be put into the action queue and will be sent immediately instead
 * @param  {?boolean=} isCommand If false, will pad the message with a space if the first char is /. If handling commands such as /afk or /ban for example, this MUST be true
 */
Bot.prototype.sendChatMsg = function(message, bypassQueue, isCommand) {
  if (!isCommand && message.indexOf("\/") === 0) message = " " + message;
  let canChat = ()=>{
    return this.checkChannelPermission("chat") && ((this.settings.muted && message.indexOf("\/") === 0) || !this.settings.muted);
  }
  if (!canChat()) return;
  var fn = ((msg)=>{
    if (!canChat()) return;
    var data = {msg: C.strip(message), meta: {}}
    if (!data.msg) {
      this.logger.warn(strings.format(this, "CHAT_BLANK_MESSAGE"));
      return;
    }
    if (this.cfg.chat.useFlair) data.meta["modflair"] = this.rank;
    this.socket.emit("chatMsg", data);
  });
  if (bypassQueue) fn(message);
  else this.actionQueue.enqueue([this, fn, [message]]);
}

/**
 * Sends a PM to the specified user.
 *
 * @param  {!string} username Username to send the message to. Must be online
 * @param  {!string} message  Message to send to the user
 */
Bot.prototype.sendPM = function(username, message) {
  if (this.settings.muted) return;
  var fn = ((username, message)=>{
    this.socket.emit("pm", {
      "to":C.strip(username),
      "msg":C.strip(message)
    });
  });
  this.actionQueue.enqueue([this, fn, [username, message]]);
}

/**
 * Advances the current video's time 5 seconds and emits the player info. Automatically used when the bot is leader
 *
 * @param  {?number=} absoluteTime If specified (seconds), will skip to this time instead of adding 5 seconds
 */
Bot.prototype.sendVideoUpdate = function(absoluteTime) {
  if (!this.leader || !this.CHANNEL.currentMedia || this.CHANNEL.currentUID === null) return;
  let media = this.CHANNEL.currentMedia,
    currTime = media.currentTime,
    duration = media.seconds,
    newTime = currTime;
  if (media && media.seconds <= 0) return;
  if (absoluteTime !== null && absoluteTime >= 0 && absoluteTime <= duration) {
    newTime = absoluteTime;
  } else if (!media.paused) {
    newTime += 5;
    if (duration > 0 && newTime > duration) newTime = duration;
  }
  this.socket.emit("mediaUpdate", {
    id: media.id,
    currentTime: newTime,
    paused: media.paused,
    type: media.type
  });
}

Bot.prototype.setChannelOpts = function(opts) {
  if (this.rank < 2) return false;
  let changed = false;
  let temp_opts = {...this.CHANNEL.opts};
  for (var i in opts) {
    if (!temp_opts.hasOwnProperty(i)) {
      this.logger.error("setChannelOpts: Tried to change channel option " + i + " but it doesn't already exist!");
    } else if (i !== "password" && typeof temp_opts[i] !== typeof opts[i]) {
      this.logger.error("setChannelOpts: Type mismatch for: " + i);
    } else {
      changed = true;
      temp_opts[i] = opts[i];
    }
  }
  if (changed) {
    if (!temp_opts.password) temp_opts.password = "";
    let fn = ()=>{
      this.socket.emit("setOptions", temp_opts);
    }
    this.actionQueue.enqueue([this, fn, []]);
  }
  return changed;
}

Bot.prototype.setFlatSkiprate = function() {
  let skipopts = this.getOpt("flatSkiprate", {
      managing: false,
      target: -1,
      original_rate: -1
    }
  ),
    roomopts = this.CHANNEL.opts;
  if (skipopts.managing) {
    if (this.rank < 2) return false;
    if (skipopts.target <= 0 || skipopts.original_rate < 0) {
      skipopts.managing = false;
      this.logger.warn("Disabling automatic flat skiprate. Target amount is set to 0 or below, or original rate is below 0");
      this.setOpt("flatSkiprate", skipopts);
      return false;
    } else {
      let skippers = this.getUsersWithSkipPerms();
      if (skippers <= 0) return false;
      if (Math.ceil(skippers * roomopts.voteskip_ratio) !== skipopts.target) {
        return this.setChannelOpts({
          voteskip_ratio: (skipopts.target / skippers)
        });
      }
      return true;
    }
  }
  return false;
}

/**
 * Adds or removes media to/from the media blacklist.
 *
 * @param  {!Object} media Media object, containing at the very least "id" and "type" keys
 * @param  {boolean=} state If true, adds the media to the blacklist; otherwise, removes it.
 * @return {boolean}       True if the media is not already in the blacklist when adding, or it is already in the list when removing; otherwise false.
 */
Bot.prototype.setMediaBlacklistState = function(media, state) {
  let _media = media.hasOwnProperty("media") ? media.media : media;
  if (_media && _media.id && _media.type) {
    let link = utils.formatLink(_media.id, _media.type, true);
    if (link === "") return false;

    let blacklisted = this.mediaIsBlacklisted(_media);
    if (!blacklisted && state) {
      this.settings.mediaBlacklist.push(link);
    } else if (blacklisted && !state) {
      utils.unsortedRemove(this.settings.mediaBlacklist, ~blacklisted);
    } else {
      return false;
    }
    this.writeSettings();
    return true;
  }
  return false;
}

/**
 * Sets an option in bot.settings with the given data. Does not check for specific array/object type differences
 *
 * @param  {!string} opt  description
 * @param  {!*} data description
 * @return {boolean}      False if datatype mismatch, otherwise
 */
Bot.prototype.setOpt = function(opt, data) {
  if (this.settings.hasOwnProperty(opt)) {
    var dataType = typeof this.settings[opt];
    var newDataType = typeof data;
    if (dataType !== newDataType) {
      let err = "setOpt: Tried changing " + opt + " from " + dataType + " to " + newDataType + "!";
      this.logger.error(err);
      throw new TypeError(err);
      return false;
    }
  }
  this.settings[opt] = data;
  this.writeSettings();
  return true;
}

/**
 * Updates the terminal's title if interface.fancyTitle is true.
 *
 * @param  {?string=} override If specified, will set the whole title to this string instead
 */
Bot.prototype.setProgTitle = function(override) {
  if (!this.cfg.interface.fancyTitle) return;
  var title = "";
  if (override)
    title = override;
  else if (this.KICKED)
    title = "(!KICKED!) | ";
  else if (this.killed)
    title = "(!KILLED!) | ";
  else {
    if (this.username === "" || !this.logged_in)
      title = "not logged in | ";
    else
      title = this.username + " | ";
    title += this.CHANNEL.room + " | ";
    if (this.cfg.rankNames.hasOwnProperty(this.rank))
      title += this.cfg.rankNames[this.rank] + " | ";
    else if (this.rank === 0)
      title += this.cfg.rankNames["unregistered"] + " | ";
    if (this.CHANNEL.usercount > 0)
      title += this.CHANNEL.usercount + " total users (" + (this.CHANNEL.usercount-this.CHANNEL.users.length) + " anon, "+ (this.CHANNEL.users.length-this.getAFKCount()) +" active) | ";
    if (this.checkChannelPermission("seeplaylist", true))
      title += this.CHANNEL.playlistMeta.count + " videos [" + this.CHANNEL.playlistMeta.time + "] "+ (this.CHANNEL.playlistIsLocked ? "L" : "UL") +" | ";
    if (this.checkChannelPermission("viewvoteskip", true))
      title += this.CHANNEL.voteskip.count + "/" + this.CHANNEL.voteskip.need + " skips | ";
    if (this.CHANNEL.poll.active)
      title += "Poll Active | ";
  }

  title += this.botName + " " + this.version;

  if (PLATFORM === "win32")
    process.title = title;
  else
    process.stdout.write("\x1B]0;" + title + "\x07");
}

/**
 * Initializes the terminal's readline interface if not already done.
 */
Bot.prototype.setupReadline = function() {
  if (this.readlineInitialized) return;
  var rl = this.rl;
  if (this.cfg.interface.allowQuickCLIChat) {
    rl.setPrompt(C.green("chat") + C.greenBright(" > "), 2);
  } else {
    rl.setPrompt(C.red("cmd") + C.redBright(" $ "), 2);
  }
  rl.prompt();
  rl.on('line', input => {
    if (!this.readlineInitialized) {
      this.logger.error(strings.format(this, "CLI_NOT_ACCEPTING_INPUT"));
    } else if (input) {
      if (input.trim() !== "") {
        this.getLogStream().write(utils.getTimestamp(this.cfg.interface.useTwentyFourHourTime) + " " + strings.format(this, "CLI_INPUT", [input]) + "\r\n");
      }
      if (input.substr(0,1) === "/") {
        clicmd.exec(this, input);
      } else if (this.cfg.interface.allowQuickCLIChat) {
        this.sendChatMsg(input, false, true);
      }
    }
    rl.prompt();
  });
  rl.on("SIGINT", () => {
      this.logger.error(strings.format(this, "NO_ABORT"));
      return;
  });

  this.readlineInitialized = true;
  this.logger.verbose(strings.format(this, "CLI_ACCEPTING_INPUT"));
}

/**
 * Adds or removes a user to/from the user blacklist.
 *
 * @param  {!string} name  Username
 * @param  {?boolean=} state If true, adds the user to the blacklist; otherwise removes the user.
 * @return {boolean}       True if the user is blacklisted when removing, or if the user is not blacklisted when adding; false otherwise.
 */
Bot.prototype.setUserBlacklistState = function(name, state) {
  name = name.toLowerCase();
  let blacklistIndex = this.settings.userBlacklist.indexOf(name);
  if (!~blacklistIndex && state) {
    this.settings.userBlacklist.push(name);
  } else if (~blacklistIndex && !state) {
    utils.unsortedRemove(this.settings.userBlacklist, blacklistIndex);
  } else {
    return false;
  }
  this.writeSettings();
  return true;
}

/**
 * Sets an option within a user's persistent data (settings.json)
 *
 * @param  {!string} username Username
 * @param  {!string} opt      Key within the user's data to modify
 * @param  {!*} data     Data to store
 * @return {Object}          Returns the user's persistent data
 */
Bot.prototype.setUserDataOpt = function(username, opt, data) {
  username = username.toLowerCase();
  if (!this.settings.userData.hasOwnProperty(username)) this.settings.userData[username] = {};
  this.settings.userData[username][opt] = data;
  this.writeSettings();
  return this.settings.userData[username];
}

/**
 * Stops the lead timer and starts it again. Calls sendVideoUpdate every 5 seconds. Requires bot to be leader.
 * @see {@link Bot#sendVideoUpdate}
 */
Bot.prototype.startLeadTimer = function() {
  this.stopLeadTimer();
  this.logger.debug("startLeadTimer called");
  if (this.leader) {
    this.logger.debug("bot is leader, starting timer");
    this.leadTimer = setInterval(this.sendVideoUpdate.bind(this), 5000);
  }
}

/**
 * Stops all timers and empties the duel list and all queues. Requires the bot to be killed unless force is true.
 *
 * @param  {?boolean=} force If force, will disregard the bot's killed state
 */
Bot.prototype.stopAllTimers = function(force) {
  if (!force && !this.killed) return this.logger.error(strings.format(bot, "STOPALLTIMERS_FAIL"));
  this.stopLeadTimer();
  clearTimeout(this.timeouts.minuteTick);
  this.actionQueue.clearQueue();
  this.broadcastPMQueue.clearQueue();
  this.largeDataReqQueue.clearQueue();
  let i = 0;
  for (;i < this.duels.length; i++) {
    clearTimeout(this.duels[i][2]);
  }
  for (var j in this.timeouts) {
    clearTimeout(this.timeouts[j]);
  }
  this.duels = [];
}

/**
 * Clears the lead timer interval and sets it to null.
 */
Bot.prototype.stopLeadTimer = function() {
  this.logger.debug("stopLeadTimer called");
  if (this.leadTimer) {
    clearInterval(this.leadTimer);
    this.leadTimer = null;
  }
}

/**
 * Does not emit a ban frame, but adds a user to the bot's timeBans list with the given time. If the user is already timebanned, this will overwrite their existing time.
 *
 * @param  {!string} name Username
 * @param  {!number} time Time in seconds
 */
Bot.prototype.timeBan = function(name, time) {
  if (time < 60 || !time) time = 60;
  let delta = Date.now() + (time*1000),
    i = 0,
    bans = this.settings.timeBans[this.CHANNEL.room],
    found = false;
  for (;i < bans.length && !found; i++) {
    if (bans[i].name === name) {
      bans[i].unbanTime = delta;
      found = true;
      break;
    }
  }
  if (!found)
    bans.push({name: name, unbanTime: delta});
  this.writeSettings();
}

/**
 * Checks if the given user has at least one video in the playlist.
 *
 * @param  {!string} username Username
 * @return {boolean}          True if the user has a video in the playlist; otherwise false
 */
Bot.prototype.touchUserVideos = function(username) {
  username = username.toLowerCase();
  let pl = this.CHANNEL.playlist,
    i = 0;
  for (;i < pl.length;i++) {
    if (pl[i].queueby.toLowerCase() === username) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a given username is associated with a known bot (list is found in the configuration file)
 *
 * @param  {!object|string} user User object or username
 * @return {boolean}      True if username found within the bot list or same as this bot; false otherwise
 */
Bot.prototype.userIsBot = function(user) {
  let name = null;
  if (utils.isObject(user) && user.name) name = user.name; //lol
  else name = user;
  name = name.toLowerCase();
  if (name === this.username.toLowerCase()) return true;
  let i = 0;
  for (;i < this.cfg.misc.bots.length; i++) {
    if (this.cfg.misc.bots[i].toLowerCase() === name) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a user is under a timeban.
 *
 * @param  {string} name Username
 * @return {boolean}      True if the user is found in the timeBans list; otherwise false
 */
Bot.prototype.userIsTimebanned = function(name) {
  name = name.toLowerCase();
  let tb = this.settings.timeBans[this.CHANNEL.room],
    i = 0;
  for (;i < tb.length;i++) {
    if (tb[i].name === name) {
      return tb[i];
    }
  }
  return false;
}

/**
 * Unbans a given user if they are found in the banlist (requires rank 3+)
 *
 * @param  {string} name Username to unban
 * @return {boolean}      True if bot has permissions and succeeds in sending an unban request; otherwise false
 */
Bot.prototype.unbanUser = function(name) {
  name = name.toLowerCase();
  let bl = this.CHANNEL.banlist,
    tb = this.settings.timeBans[this.CHANNEL.room];
  if (bl.length <= 0 || !this.checkChannelPermission("ban")) return false;
  let i = bl.length-1, foundBan = false;
  for (;i >= 0;i--) {
    if (bl[i].name.toLowerCase() === name) {
      let name = bl[i].name,
        id = bl[i].id;
      let fn = ()=>{this.socket.emit("unban", {name: name, id: id})};
      this.actionQueue.enqueue([this, fn, []]);
      foundBan = true;
    }
  }
  return foundBan;
}

/**
 * Unmutes the specified user.
 *
 * @param  {string} username Username to unmute
 * @return {boolean}          True if muting conditions pass, false otherwise
 */
Bot.prototype.unmuteUser = function(username) {
  if (this.checkChannelPermission("mute") && username && username.toLowerCase() !== this.username.toLowerCase()) {
    let user = this.getUser(username);
    if (user && (user.meta.muted || user.meta.smuted) && this.rank > user.rank) {
      this.sendChatMsg("/unmute " + user.name, false, true);
      return true;
    }
  }
  return false;
}

/**
 * Updates a user's roomtime, AFK time, and last seen in the DB
 *
 * @param  {!string} name  Username
 * @param  {?boolean=} doAfk If true, will also update AFK time
 * @param  {?function=} cb    If specified, will be called when the DB action is complete
 * @return {Promise}       Promise, resolved with false if no user found or DB is not active; otherwise true
 */
Bot.prototype.updateUserRoomTime = function(name, doAfk, cb) {
  let user = this.getUser(name);
  if (!(this.cfg.db.use && this.cfg.db.useTables.users)) return Promise.resolve(false);
  if (!user) {if (cb) cb(); return Promise.resolve(false)};
  return new Promise((res)=>{
    if (!this.db || this.CHANNEL.users.length <= 0) return res(false);
    var now = Date.now();
    var time = now - user.lastRoomtimeCheck;
    user.lastRoomtimeCheck = now;
    var afkTime = 0;
    if (doAfk) {
      if (user.timeWentAFK > 0) afkTime = now - user.timeWentAFK;
      if (user.meta.afk) user.timeWentAFK = now;
      else user.timeWentAFK = -1;
      if (afkTime < 0) afkTime = 0;
    }
    if (time < 0) time = 0;
    this.db.run("updateUserRoomTime", [time/1000, afkTime/1000, user.name], ()=> {
      if (cb) cb();
      res(true);
      })
  });
}

/**
 * Updates room and AFK times of all users in the room in the database.
 *
 * @return {Promise}  Returns a Promise, resolved with true once the DB action is finished
 */
Bot.prototype.updateUserRoomTimeAll = function() {
  return new Promise((res)=>{
    if (!(this.cfg.db.use && this.cfg.db.useTables.users)) {
      res(false);
    } else {
      //this.logger.debug("Running batch updateUserRoomTime query...");
      var users = this.CHANNEL.users;
      var now = Date.now(),
        times = [];
      let i = 0;
      for (; i < users.length; i++) {
          var data = new Array(3);
          var userObj = users[i];
          data[0] = userObj.name;
          var time = (now - userObj.lastRoomtimeCheck) / 1000;
          data[1] = time < 0 ? 0 : time;
          var afkTime = 0;
          if (userObj.timeWentAFK > 0)
            afkTime = (now - userObj.timeWentAFK) / 1000;
          data[2] = afkTime < 0 ? 0 : afkTime;
          userObj.lastRoomtimeCheck = now;
          if (userObj.meta.afk)
            userObj.timeWentAFK = now;
          else
            userObj.timeWentAFK = -1;
          if (data[1] > 0 || data[2] > 0)
            times.push(data);
        }
      this.db.run("updateUserRoomTimeAll", times, ()=>{
        this.logger.debug("Done! (batch active)");
        res(true);
      });
    }
  });
}

/**
 * Checks if a user has a channel permission.
 *
 * @param  {!string} perm     Channel permission to check
 * @param  {!number} userRank A user's rank
 * @return {boolean}         True if user has permission, false otherwise
 */
Bot.prototype.userHasChannelPermission = function(perm, userRank) {
  if (this.first.grabbedPermissions) return false;
  var userRank_ = parseInt(userRank);
  if (!this.CHANNEL.playlistIsLocked && /^playlist/.test(perm) && this.CHANNEL.perms.hasOwnProperty("o" + perm)) perm = "o" + perm;
  if (!isNaN(userRank_) && this.CHANNEL.perms.hasOwnProperty(perm)) {
    return userRank_ >= this.CHANNEL.perms[perm];
  } else if (!this.CHANNEL.perms.hasOwnProperty(perm)) {
    this.logger.error(strings.format(this, "PERMISSION_NOT_FOUND", [perm]));
  }
  return false;
}

/**
 * Checks if the given rank is equal to or above USER (default 1), or below it if allowGuestData is true.
 *
 * @param  {!number} rank User's rank
 * @return {boolean}      True if the DB is allowed to store the user's data
 */
Bot.prototype.userRankDBCheck = function(rank) {
  return rank >= this.RANKS.USER || (rank < this.RANKS.USER && this.cfg.db.allowGuestData);
}

/**
 * Checks the given string among valid trigger characters and returns ! if invalid.
 *
 * @param  {!string} trigger A string of length 1
 * @return {string}         Returns given trigger if valid, otherwise !
 */
Bot.prototype.validateTrigger = function(trigger) {
  if (typeof trigger !== "string" || trigger.length !== 1 || !~'!#$%^&*()_+-=`~.,?'.indexOf(trigger)) {
    this.logger.warn(strings.format(this, "TRIGGER_INVALID", ["!"]));
    return '!';
  } else {
    return trigger;
  }
}

/**
 * Writes text to the terminal and to a stream.
 *
 * @param  {!string} out        Text to be displayed/written
 * @param  {?fs.WriteStream} stream     WriteStream to write out to
 * @param  {?boolean=} gotoBotLog If true, will go to the standard bot.log stream (will cause duplicate lines if used with the standard log stream!)
 */
Bot.prototype.write = function(out, stream, gotoBotLog) {
  if (stream.destroyed) return;
  if (stream) {
    stream.write(C.strip(out) + "\r\n");
    if (gotoBotLog)
      this.getLogStream().write(C.strip(out) + "\r\n");
  }
  //clear the entire line, write output text, reset prompt
  process.stdout.write("\r\x1B[K"+out+"\n");
  this.rl._refreshLine();
}

/**
 * Writes bot.settings into settings.json or settings-ROOMNAME.json, depending on config. Uses fs.writeFileSync.
 */
Bot.prototype.writeSettings = function() {
  this.logger.verbose(strings.format(this, "SETTINGS_WRITE"));
  var settings = JSON.stringify(this.settings);
  try {
    fs.writeFileSync(path.join(this.ROOTPATH, this.settingsFile), settings, "utf8");
  } catch (err) {
    this.logger.error(strings.format(this, "FILE_WRITE_ERROR", [this.settingsFile, err.stack]));
  }
};


module.exports = {
  "init": function(config, readline, ROOT) {
    let bot = new Bot(config, readline, ROOT);
    bot.db.init(bot);
    return bot;
  }
}

/* "Default" (? grabbed from a clean room) permissions
  {

    //OPEN PLAYLIST
    "oplaylistadd":-1,      //Add to playlist
    "oplaylistnext":1.5,    //Add/move to next
    "oplaylistmove":1.5,    //Move playlist items
    "oplaylistdelete":2,    //Delete playlist items
    "oplaylistjump":1.5,    //Jump to video
    "oplaylistaddlist":1.5, //Queue playlist

    //GENERAL PLAYLIST
    "seeplaylist":-1,         //View the playlist
    "playlistadd":1.5,        //Add to playlist
    "playlistnext":1.5,       //Add/move to next
    "playlistmove":1.5,       //Move playlist items
    "playlistdelete":2,       //Delete playlist items
    "playlistjump":1.5,       //Jump to video
    "playlistaddlist":1.5,    //Queue playlist
    "playlistaddcustom":3,    //Embed custom media
    "playlistaddrawfile":2,   //Add raw video file
    "playlistaddlive":1.5,    //Queue livestream
    "exceedmaxlength":2,      //Exceed maximum media length
    "exceedmaxdurationperuser":2  //Exceed maximum total media length
    "addnontemp":2,           //Add nontemporary media
    "settemp":2,              //Temp/untemp playlist item
    "playlistshuffle":2,      //Shuffle playlist
    "playlistclear":2,        //Clear playlist
    "exceedmaxitems":2,       //Exceed maximum number of videos per user
    "deletefromchannellib":2, //Delete from channel library
    "playlistlock":2,         //Lock/unlock playlist

    //POLLS
    "pollctl":1.5,        //Open/Close Poll
    "pollvote":-1,        //Vote
    "viewhiddenpoll":1.5, //View hidden poll results
    "voteskip":-1,        //Voteskip
    "viewvoteskip":1.5,   //View voteskip results

    //MODERATION
    "mute":1.5,       //Mute users
    "kick":1.5,       //Kick users
    "ban":2,          //Ban users
    "motdedit":3,     //Edit MOTD
    "filteredit":3,   //Edit chat filters
    "filterimport":3, //Import chat filters
    "emoteedit":3,    //Edit chat emotes
    "emoteimport":3,  //Import chat emotes
    "leaderctl":2,    //Assign/Remove leader

    //MISC
    "drink":1000000,  //Drink calls
    "chat":0,         //Chat
    "chatclear":2,    //Clear Chat
  }
 */
