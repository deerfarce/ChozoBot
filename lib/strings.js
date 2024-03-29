"use strict";

const C = require("cli-color");

//Define strings here, with the string ID as the key and the actual string as the value.
//Positional params are notated by %s# and begin at 0.
//Use the exported "format" function to retrieve these strings.

//e.g. "UNKNOWN_COMMAND" : "Unknown command %s0."
var strings = {
  ACTIONQUEUE_INIT_INTERVAL:"Action queue interval set to %s0ms.",
  ANAGRAM_BAD_LENGTH:"Anagram: Input must be between %s0-%s1 characters",
  ANAGRAM_RESULT:"[%s0] => %s1",
  API_ERROR:"APIcall error with %s0: %s1",
  API_NOT_FOUND:"Tried to call an undefined API %s0",
  API_NOT_OK:"API %s0 returned status code %s1: %s2",
  API_PLAIN_RESPONSE:"[%s0] %s1",
  API_TIMEOUT:"API request to \"%s0\" timed out.",
  API_WR_RESPONSE: "[wolfram] %s0: %s1",
  API_YT_COMMENTSDISABLED: "Comments are disabled on this video.",
  API_YT_ERROR:"Error with YouTube API (%s0, status %s1): %s2",
  API_YT_NOCOMMENTS: "No comments found on this video.",
  AVATAR_BLACKLIST:"Your profile picture is hosted by a blacklisted domain. Please use a different host for it.",
  BLACKLIST_FAIL:"%s0 is already blacklisted, or the input was invalid.",
  BLACKLIST_MSG:"%s0 is a blacklisted video.",
  BLACKLIST_REMOVE_FAIL:"%s0 was not found in the blacklist.",
  BLACKLIST_REMOVE_SUCCESS:"%s0 successfully removed from the blacklist.",
  BLACKLIST_SUCCESS:"%s0 successfully blacklisted.",
  BLACKLIST_USER:"You are currently blacklisted from adding videos.",
  BUMP_LOG:"%s0: %s1 added by %s2, bumped by %s3 (%s4 => %s5)",
  BOT_MUTED:"%s0 muted the bot.",
  BOT_MUTED_INIT:"Bot is starting muted!",
  BOT_UNMUTED:"%s0 unmuted the bot.",
  CALLBACK_INVALID:"%s0: callback is not a function!",
  CHAT_BLANK_MESSAGE:"Tried to send a blank message",
  CHAT_EC_USED: "<EC> %s0 has been used %s1 %s2.",
  CHAT_EC_NOTUSED: "<EC> %s0 has not been used before.",
  CHAT_EIGHTBALL: "[8ball: %s0] %s1",
  CHAT_LS_INROOM: "%s0 is in the room right now.",
  CHAT_LS_LASTSEEN: "%s0 was last seen at %s1.",
  CHAT_LS_NOTSEEN: "%s0 has not been seen in the room yet.",
  CHAT_QUOTE: "[%s0] <%s1> %s2",
  CHAT_QUOTE_ME: "[%s0] <%s1 %s2>",
  CHAT_ROOMTIME: "%s0: First seen at %s1. Total room time: %s2; active time: %s3 (%s4\%)",
  CHAT_ROOMTIME_ONLYSEEN: "%s0: First seen at %s1. No room time recorded, most likely due to a reset.",
  CHAT_UEC_USED: "<UserEC> %s0 has used %s1 %s2 %s3.",
  CHAT_UEC_USEDTOTAL: "<UserEC> %s0 has used %s1 %s2.",
  CHAT_UEC_NONEUSED: "<UserEC> %s0 has not used any emotes.",
  CHAT_UEC_NOTUSED: "<UserEC> %s0 has not used %s1 before.",
  CHAT_UPTIME: "Uptime: %s0",
  CLI_INPUT: "[CLI] %s0",
  CLI_NOT_ACCEPTING_INPUT:"Bot is not yet accepting CLI input, please wait",
  CLI_ACCEPTING_INPUT:"Now accepting CLI input",
  CHANNEL_NOT_REGISTERED:"This channel is not registered to a CyTube account. Some of CyTube's features within this channel will not be available. You can claim channels on CyTube via the Channels page of your account. If this was unexpected, make sure the correct channel is set within the bot's config.",
  CHANNEL_OPTS_CHANGED:"Channel options changed: %s0",
  CHANNEL_PERMS_UPDATED:"Channel permissions updated.",
  CHANLOG_ERROR:"Error reading channel log.",
  CHANLOG_READING:"Reading channel log...",
  CHANLOG_WRITTEN:"Channel log written to chan.log.",
  CHATFILTER_UPDATE:"Chat filter \"%s0\" has been added/updated.",
  CHATFILTER_DELETE:"Chat filter \"%s0\" has been deleted.",
  COLORNAME_NONAME:"utils.colorUsername called without a username",
  COMMAND_ATTEMPT:"%s0 attempted chat command: %s1",
  COMMAND_CHANPERM_FAIL:"Could not execute chat command \"%s0\" due to either an invalid permission name or insufficient permissions for \"%s1\". If this should have worked, double check the permission name.",
  COMMAND_CREATING:"Creating chat commands...",
  COMMAND_DISABLED:"Chat command \"%s0\" disabled.",
  COMMAND_DISABLED_FAIL:"Tried to disable chat command \"%s0\" but it is already disabled.",
  COMMAND_ENABLED:"Chat command \"%s0\" enabled.",
  COMMAND_ENABLED_BROKEN:"Tried to enable chat command \"%s0\" but it is broken. Make sure it is correctly written.",
  COMMAND_ENABLED_FAIL:"Tried to enable chat command \"%s0\" but it is already enabled.",
  COMMAND_INACTIVE:"Chat command \"%s0\" is starting inactive.",
  COMMAND_INVALID:"Chat command \"%s0\" has invalid properties and will not work.",
  COMMAND_INVALID_UNEQUAL_ID:"Chat command \"%s0\"'s key name does not match its cmdName (make it lowercase!) and it will be considered broken!",
  COMMAND_LISTENING:"Chat commands created, now listening for commands",
  COMMAND_USED_BEFOREHANDLING:"Chat command \"%s0\" was used before handling commands",
  COMMAND_USED_BROKEN:"Chat command \"%s0\" was used, but it is broken. Make sure the command has valid properties.",
  COMMAND_USED_INACTIVE:"Chat command \"%s0\" was used, but it is inactive.",
  COMMAND_USED_NOPM:"Chat command \"%s0\" was used in private, but that command cannot be used in PM.",
  CONNECT_ERROR:"Unable to connect: %s0",
  CONNECT_SUCCESS:C.greenBright("Successfully connected to %s0!"),
  CONNECTING:C.yellowBright("Connecting..."),
  CURRENTLY_PLAYING:C.cyan("Currently playing via ") + "%s0" + C.cyan(":") + " %s1 %s2 %s3 %s4",
  CUSTOMCOMMANDS_ALIASES_NOT_OBJ:"Could not load custom command aliases: expected the aliases in an object.",
  CUSTOMCOMMANDS_ALIASES_OVERWRITE:"Overwriting existing command alias with custom alias: %s0",
  CUSTOMCOMMANDS_CMDS_NOT_OBJ:"Could not load custom commands: expected the commands in an object.",
  CUSTOMCOMMANDS_LOAD_ERROR:"Error loading custom commands: %s0",
  CUSTOMCOMMANDS_NOT_FOUND:"Could not load custom commands: customchatcommands.js not found. Rename customchatcommands-example.js in the lib folder to use the template. Ignore if not using custom commands.",
  CUSTOMCOMMANDS_OVERWRITE:"Overwriting existing command with custom definition: %s0",
  CY_ANNOUNCEMENT:"%s0 :: %s1 \u2014%s2",
  DB_BAD_INFO:"Error creating database pool. Check your credential configuration.",
  DB_EMOTES_CLEANED:"%s0: Emote records have been cleaned of unused emotes.",
  DB_EMOTES_CLEANED_NONE:"%s0: No unused emotes were found in the database.",
  DB_EMOTES_ERASED:"Emotes erased. You may also use \"%s0quotes off\" to exempt yourself from quotes and emote records. Keep in mind that this bot may still log chat among other room events.",
  DB_QUOTES_ERASED:"Quotes erased. You may also use \"%s0quotes off\" to exempt yourself from quotes and emote records. Keep in mind that this bot may still log chat among other room events.",
  DB_QUOTES_ERASED_OTHER:"%s0's quotes erased.",
  DISCIPLINE_LOG:"%s0 used %s1 on %s2. Reason: %s3",
  DISCONNECTED:C.redBright("Disconnected from server."),
  DISCORD_ERR_INIT:"Error initiating Discord bot: %s0.",
  DISCORD_EMBED_CLOSE_POLL_AUTHOR:":: poll closed ::",
  DISCORD_EMBED_NEW_POLL_AUTHOR:":: poll opened ::",
  DISCORD_EMBED_POLL_INPROGRESS_AUTHOR:":: poll in progress ::",
  DISCORD_EMBED_POLL_TIMESTAMP:"Started by %s0 at %s1 UTC",
  DISCORD_READY:"Discord Bot ready!",
  DUEL_BEGIN:"%s0: %s1 challenged you to a duel! Type \`%s2%s3\`, or \`%s2%s4\` like a pussy...",
  DUEL_DECLINE:"%s0 declined %s1's duel! What a bitch! %s2",
  DUEL_EXPIRED:"%s0's duel request has expired due to %s1 being a little bitch.",
  DUEL_PM_INDUEL:"That user is already in a duel.",
  DUEL_PM_CALLERWAITING:"You're waiting for %s0 to respond to your duel request!",
  DUEL_PM_TARGETWAITING:"%s0 is waiting for you to respond to their duel request!",
  DUEL_RECORD:"%s0's duel record: %s1W-%s2L, win rate: %s3",
  DUEL_RESULT_LOSS:"%s1 WINS against %s0! [%s3 vs %s2] %s4",
  DUEL_RESULT_WIN:"%s0 WINS against %s1! [%s2 vs %s3] %s4",
  DUEL_USER_LEFT:"%s0 left the room; pending duel with %s1 has ended.",
  EMOTE_REMOVE:"Emote \"%s0\" removed.",
  EMOTE_RENAME:"Emote \"%s0\" renamed to \"%s1\".",
  EMOTE_REJECTED:"%s0: Rejecting invalid emote: %s1",
  EMOTE_UPDATE:"Emote \"%s0\" added/updated.",
  EXIT:"Bot stopped, exiting in %s0. Reason: %s1",
  FILE_READ_ERROR:"Error reading from %s0: %s1",
  FILE_WRITE_ERROR:"Error writing to %s0: %s1",
  INIT:"-- Initializing %s0 v%s1 --",
  INVALID_USERNAME:"That username is invalid.",
  JOINING_ROOM:"Joining %s0",
  KICKED:"You have been kicked.%s0",
  KILL_GENERIC_DISCONNECT:"disconnected",
  KILL_WRONG_PWD:"wrong password",
  LEADER_GIVEN:"Leader given to %s0",
  LEADER_NOPERM:"The bot does not have permission to make itself a leader. Make it one before using this command.",
  LEADER_REMOVED:"Leader removed from %s0",
  LOGIN_SUCCESS:"Successfully logged in as: %s0",
  MEDIA_ADD_BOTTOM:"%s0 added %s1 to the bottom of the playlist",
  MEDIA_ADD_POS:"%s0 added %s1 to #%s2",
  MEDIA_ADD_TOP:"%s0 added %s1 to the top of the playlist",
  MEDIA_MOVE_AFTER:"%s0 moved after %s1 (#%s2 -> #%s3)",
  MEDIA_MOVE_TOP:"%s0 moved to the top of the playlist (#%s1 -> #%s2)",
  MEMORY_USAGE:"Memory usage: %s0%s1",
  MOTD_CHANGED:"The channel's MOTD has been changed.",
  NEW_POLL:"%s0 opened a poll at %s1: %s2 %s3",
  NEW_USER_CHAT:"Your account is too new to chat in this channel. Please wait a while and try again.",
  NEW_USER_CHAT_LINK:"Your account is too new to post links in this channel. Please wait a while and try again.",
  NEW_USER_JOIN:"New user: %s0",
  NEW_USERS:"New users: %s0",
  NO_ABORT:"Type /exit instead of using CTRL-C to exit the bot.",
  NO_FLOOD:C.redBright("%s0: %s1"),
  NO_USERNAME:"NO_USERNAME",
  NO_VIDEO:"No video is playing.",
  NOW_PLAYING:C.yellowBright("Now playing via ") + "%s0" + C.yellowBright(":") + " %s1 %s2 %s3",
  PARTITION_CHANGE:"Reconnecting due to a partition change...",
  PERMISSION_INSUFFICIENT:"Insufficient permission (rank %s2) for %s0; need rank %s1.",
  PERMISSION_NOT_FOUND:"Tried to check permission %s0 but it wasn't found!",
  PLAYLIST_EMPTY:"The playlist is empty.",
  PLAYLIST_IS_LOCKED:"The playlist is currently " + C.redBright("locked") + ".",
  PLAYLIST_INVALID_POSITION:"Invalid playlist position.",
  PLAYLIST_LOCKED:"Playlist locked.",
  PLAYLIST_LOW:"Playlist time is running low. Add videos!",
  PLAYLIST_RECEIVED:"Playlist data received.",
  PLAYLIST_IS_UNLOCKED:"The playlist is currently " + C.greenBright("unlocked") + ".",
  PLAYLIST_UNLOCKED:"Playlist unlocked.",
  PLAYLIST_VIDEONOTFOUND:"Video not found.",
  PM_RECV:"Received PM from %s0: %s1",
  PM_SENT:"Sent PM to %s0: %s1",
  POLL_CLOSED:"%s0's poll closed: %s1 %s2",
  POLL_CLOSED_RESULT:"\"%s0\": %s1 had the most votes with %s2 vote(s) (%s3)",
  POLL_CLOSED_TIE:"\"%s0\": Some options tied with %s1 vote(s) each (%s2)",
  POLL_CLOSED_CMD:"%s0 ended the poll via chat command.",
  PWD_ACCEPTED:"Room password accepted!",
  PWD_REQUIRED:"Room %s0 requires a password, attempting to join...",
  QUEUE_FAIL:"Queue failure: %s0",
  QUEUE_WARN:"Queue warning: %s0",
  QUOTE_NO_ARG_PM:"Currently %s0 from quotes and chat/emote storage (does not include channel logs). Type \"%s1%s2 on\" or \"%s1%s2 off\" to control this, or \"%s1clearquotes\" or \"%s1clearemotecount\" to erase your stored messages or emote records respectively (except those in logs).",
  QUOTE_OFF_PM:"You're now exempt from %s0quote and any further messages and emotes will not be stored (except normal channel logging). Type \"%s0quotes on\" to enable this again, or \"%s0clearquotes\" or \"%s0clearemotecount\" to erase any of your stored messages or emote records respectively (again, does not erase logs).",
  QUOTE_ON_PM:"Your chat messages and emotes may now be stored and then retrieved when users use %s0quote and emote count commands. Type \"%s0quotes off\" to exempt yourself from this.",
  RANK_SET:"Rank set to %s0.",
  RANK_SET_USER:"Rank for %s0 set to %s1",
  SAVEPOLL_ERR_NOACTIVE:"There must be a poll active with at least a title or some options.",
  SAVEPOLL_ERR_STARTSWITHTIME:"Poll name cannot begin with \"time:\", because loadpoll uses this for the timer.",
  SAVEPOLL_ERR_NAMELENGTH:"Poll name must be %s0-%s1 characters.",
  SAVEPOLL_ERR_OPTLENGTH:"Poll must have %s0 or less options.",
  SAVEPOLL_ERR_NOTUNIQUE:"Could not save the poll. There may be a poll with the same name, or the same title and options.",
  SAVEPOLL_SUCCESS:"Poll saved as: %s0",
  SEEK_TOOFAR:"Can't seek past the length of the video.",
  SELFPURGE_NOARG:"Did you mean \"%s0selfremove\"? If not, try \"%s0selfpurge\" again with nothing after it.",
  SELFPURGE_SEMISUCCESS:"Your videos have been purged. However, the current video was not deleted.",
  SELFPURGE_SUCCESS:"Your videos have been purged.",
  SELFREMOVE_ERR_ACTIVE:"You may not remove your video if it is playing.",
  SELFREMOVE_ERR_NOTYOURS:"Did not remove %s0: You may only remove videos that you have added.",
  SELFREMOVE_SUCCESS:"Removed %s0",
  SELFREMOVE_USAGE:"%s0%s1 <video position number|first|last> - removes the video at the given position (or first or last video found if specified) if added by you",
  SERVER_BAD_HOSTNAME:"Server found, but it was not on %s0. Stopping.",
  SERVER_INSECURE:"config.connection.secureServer is false! Bot will use an INSECURE and UNENCRYPTED server!",
  SERVER_REQUEST_ERROR:"Failure requesting socket configuration: %s0",
  SERVER_ROOM_NOT_FOUND:"getSocketConfig: unable to find a server for room %s0",
  SETTINGS_PROPERTY_MISSING:"Loaded settings file does not have property %s0, updating",
  SETTINGS_READ:"Reading persistent settings",
  SETTINGS_WRITE:"Writing persistent settings",
  SHUFFLE_ERR:"The shuffle command can only be used without any other text in the message. Did you mean \"%s0shuffleuser\"?",
  SKIPRATE_CHANGE:"Skip ratio changed from %s0\% to %s1\%",
  SOCKET_CONN_ERR:"Unable to connect to the socket server.",
  SPAM_FILTERED:"Spam filtered.",
  STOPALLTIMERS_FAIL:"stopAllTimers cannot be called if the bot has not been killed, unless forcefully done so!",
  SUBNET_MATCH:"%s0's subnet matches banned IPs: %s1",
  TARGETUSER_EXEMPT: "That user does not allow chat record retrieval.",
  TIMEBAN_NONE:"A timeban was not found for %s0.",
  TIMEBAN_SOON:"%s0 is timebanned but will be automatically unbanned within a minute or so.",
  TIMEBAN_TIME:"%s0 has %s1 left on their ban.",
  TIMECODE_BADFORMAT:"Invalid time. Must be in [H:]M:S format.",
  TRIGGER_INVALID:"Invalid trigger found. Valid triggers are: !#$%^&*()_+-=`~.,?£ Reverted trigger to \"%s0\"",
  UNABLE_TO_LOGIN:"Unable to login. Check your credentials. Error: %s0",
  UNBAN_FAIL_TIMEBANNED:"%s0 is timebanned. Use %s1untimeban instead, or %s1gettimeban to see the ban length.",
  UNBANNED:"%s0 unbanned (id: %s1, ip: %s2)",
  UNKNOWN_CHAT_COMMAND:"Unknown chat command: %s0",
  UNKNOWN_CLI_COMMAND:"Unknown console command \"%s0\".",
  USER_ALLOWED:"Allowed %s0",
  USER_ALLOWED_FAIL:"Tried to allow %s0 but they are not disallowed.",
  USER_DISALLOWED:"Disallowed %s0",
  USER_DISALLOWED_FAIL:"Tried to disallow %s0 but they are already disallowed.",
  USER_JOINED_ROOM:C.green("+ ") + "%s0" + C.green(" joined the room."),
  USER_JOINED_ROOM_ALIASES:C.green("+ ") + "%s0" + C.green(" joined the room. ") + C.blackBright("(aliases: %s1)"),
  USER_LEFT_ROOM:C.red("- ") + "%s0" + C.red(" left the room."),
  USER_PURGED:"Purged %s0's videos.",
  WRONG_PWD:"Wrong password for room %s0! If not done already, please set the room password within the config.",

  COMMAND_RANK_CHANGED:"Rank for chat command %s0 changed from %s1=>%s2 by %s3.",
  COMMAND_RANKMATCH_CHANGED:"Rank match for chat command %s0 changed from %s1 to %s2 by %s3.",
  COMMAND_REQUIRED_RANK:"Required rank for %s0: %s2%s1",
  COMMAND_RUNTIME_ERROR:"That command encountered a runtime error. Tell the bot maintainer.",
  COOLDOWN_C_ACTIVE:"Command cooldown for %s0 is still active. %s1 seconds remaining.",
  COOLDOWN_U_ACTIVE:"User cooldown for %s0 is still active. %s1 seconds remaining.",

  DBG_CMD_CHECKOVERRIDE:"Checking for chat command property overrides",
  DBG_CMD_FOUNDCDOVERRIDE:"Found user cooldown override for chat command %s0 (%s1 => %s2)",
  DBG_CMD_FOUNDGCDOVERRIDE:"Found global cooldown override for chat command %s0 (%s1 => %s2)",
  DBG_CMD_FOUNDRANKOVERRIDE:"Found rank override for chat command %s0 (%s1 => %s2)",
  DBG_CMD_FOUNDRANKOVERRIDE_NOTALLOWED:"Found rank override for chat command %s0 but it does not allow rank changes. Skipping.",
  DBG_CMD_FOUNDRANKMATCHOVERRIDE:"Found rankmatch override for chat command %s0 (%s1 to %s2)",
  DBG_CMD_FOUNDRANKMATCHOVERRIDE_NOTALLOWED:"Found rankmatch override for chat command %s0 but it does not allow rankmatch changes. Skipping.",
  DBG_CMD_FOUNDSTATEOVERRIDE:"Found active state override for chat command %s0 (%s1 => %s2)",
  DBG_CMD_SETCDPROP:"Setting %s0 property in cooldown obj",
  DBG_FOUND_SOCKET:"Found socket config info, connecting to %s0",
  DBG_REMOVEUID:"Removed uid:%s0",
  DBG_SETCURRENT:"setCurrent called with uid:%s0",
  DBG_SETTING_HANDLERS:"Setting socket event handlers",

  RECV_BANLIST:"Ban list received.",
  RECV_RANKS:"Rank list received.",
  RECV_USERLIST:"User list received."
}

module.exports = {
  //format: Takes a stringID (the string key) and an array of strings as parameters.
  //params may be left null if the requested string does not take parameters.
  "format":function(bot, stringID, params) {
    if (bot && bot.pendingLanguageChange) {
      try {
        if (bot.pendingLanguageChange.length < 2 || bot.pendingLanguageChange.length > 3) {
          if (bot.pendingLanguageChange === "reset") {
            let file = require("./strings.js");
            strings = file._strings;
          } else
            throw new Error("Language code must be 2-3 chars!");
        } else {
          let file = require("./strings-" + bot.pendingLanguageChange + ".js");
          strings = file._strings;
        }
      } catch (e) {
        if (e.code === "MODULE_NOT_FOUND"){}
        else
          bot.logger.error(e.stack);
      }
      bot.pendingLanguageChange = null;
    }
    if (strings.hasOwnProperty(stringID)) {
      if (params === null || params === undefined) return strings[stringID];
      return strings[stringID].replace(/\%s(\d+)/g, function(match, capture) {
        var num = parseInt(capture);
        if (!isNaN(num) && num < params.length)
          return params[num];
        else
          return match;
      });
    } else {
      bot.logger.error("strings.format: Requested stringID " + stringID + " but it is not defined!");
      return false;
    }
  },
  "_strings":strings
}
