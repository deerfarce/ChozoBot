var config = {
  //api related stuff
  api: {
    //YouTube API v3 key
    youtube_key: "",
    //Wolfram API key
    wolfram_key:""
  },
  //Connection and socket options...
  connection: {
    /* If true, will connect to a secure cytu.be server using an encrypted
     * connection. If false, will use an unsecure server. You should ONLY ever
     * set this to false if you cannot connect to a secure server.
     */
    secureSocket: true,
    //Hostname of the server to connect to. https://cytu.be/ becomes "cytu.be"
    hostname: "cytu.be",
    //If true, will only allow socket connections that are on the same domain as
    // the hostname above. Only disable this if you need to and know what you're
    // doing.
    sameDomainSocketOnly: true
  },
  db: {
    //If true, will use database stuff
    use: false,
    //Tables to use in the database. Comments with each table describe what they
    //  handle and what will be subsequently disabled if false
    useTables: {
      users: true, //user activity time, visits
      //Disabling the "users" table will disable the child tables below
      emote_data: true, //Emote counts
      duel_stats: true, //Dueling stats, will also disable duels
      chat: true, //Chat logging, quotes
      bump_stats: true, //Bump counts for moderators
      saved_polls: true, //Storage of poll info for reuse
      video_play_data: true //Not implemented
    },
    /*
      Database connection info. Change these options as needed.
    */
    connectionInfo: {
      user: 'username',
      host: 'localhost',
      database: 'dbname',
      password: 'password',
      port: '5432',
      client_encoding: 'utf8'
    },
    //If true, will allow statistic and quote collection of unregistered users
    allowGuestData: false
  },
  //options relating to the Discord Bot feature
  discord: {
    //if true, will use the token below to log into a discord bot
    use: false,
    token: "",
    //if true, will send Now Playing notifications to the given channel ID
    sendNowPlayingMessages: true,
    nowPlayingChannelID: "",
    //if true, will send poll open/close notifications to the given channel ID
    sendPollResultMessages: true,
    pollResultChannelID: "",
    //url to the icon to use for rich embed messages (20x20 is best)
    iconUrl: "",
    //hex colors for rich embed messages
    pollClosedColor: "#FF2222", //color of Poll Closed messages
    pollInProgressColor: "#22AAFF", //color of Poll In Progress messages
    pollOpenedColor: "#22FF22" //color of Poll Opened messages
  },
  //Interface options...
  interface: {
    //If true, usernames will be colored in the terminal.
    //  Disabling this will cut down a few operations, but there will be
    //  a negligible performance boost if any at all.
    colorUsernames: true,
    //Same thing but for titles of media items.
    colorMediaTitles: true,
    //Rank colors. If colorUsernames is true, usernames will be colored
    //  by rank. Uses color names from the cli-color package.
    rankColors: {
      anonymous: "blackBright",
      unregistered: "white",
      server: "cyanBright",
      1: "whiteBright",
      1.5: "yellowBright",
      2: "blueBright",
      3: "greenBright",
      4: "redBright",
      5: "red",
      255: "magentaBright"
    },
    /* If true, chat messages may be sent from the CLI Interface
     * without using the /say command. Otherwise, if false,
     * the /say command must be used to send a chat message.
     * False is recommended to prevent accidental chat messages.
     */
    allowQuickCLIChat: false,
    //If true, debug logs will be shown and logged into debug.log.
    logDebug: true,
    //If true, much more info will be logged. Not necessary, but can be helpful.
    //  Verbose logs contain a magentaBright asterisk after the timestamp.
    logVerbose: true,
    //If true, non-generic logs will still be put into the regular log file.
    //  Can be helpful for having full log context in one file, but will result
    //  in a larger bot.log
    logConsolidation: true,
    //If true, excludes errors from the main log if consolidation is enabled.
    //  Highly recommended as errors might include sensitive information.
    excludeErrorsFromLog: true,
    //If true, logged times will use a 24-hour format. If false, will
    //  use 12-hour time along with am/pm. Doesn't affect anything else.
    useTwentyFourHourTime: true,
    //If true, title of the terminal/prompt will be populated with various
    //  bits of info. Turn this off if you will never see it.
    fancyTitle: true,
    //If true, muted users will be clearly indicated in chat message logs.
    indicateMutedUsers: true
  },
  //Login options...
  //Hidden from Bot.cfg object
  login: {
    //If true, bot will not log into an account.
    guest: false,
    //Room to connect to.
    room: "",
    //Room password, if required.
    roomPassword: "",
    //Username and password. Not needed if logging in as a guest.
    username: "",
    password: ""
  },
  //Use this to enumerate ranks for your room.
  //  Be absolutely sure these ranks are correct.
  //  If changed, make sure you refactor any occurrences in the entire bot.
  //  Found in Bot.RANKS, not Bot.cfg
  RANKS: {
    GUEST: 0,
    USER: 1,
    LEADER: 1.5,
    MOD: 2,
    ADMIN: 3,
    OWNER: 4,
    FOUNDER: 5,
    SITEOWNER: 10,
    SUPERADMIN: 255
  },
  //Define proper names for ranks. Used when a user doesn't have permission
  //for a command, for example.
  rankNames: {
    unregistered: "Guest",
    1: "User",
    1.5: "Leader",
    2: "Moderator",
    3: "Room Admin",
    4: "Room Owner",
    5: "Room Founder",
    10: "Site Owner",
    255: "Superadmin"
  },
  chat: {
    //If true, emotes will be colored. Must be true for emote data to be recorded
    //  in the database.
    parseEmotes: true,
    //Max emotes per message. This is essentially infinite in vanilla rooms, you'd
    //  have to edit execEmotes in your room script to limit emotes. Set below 0
    //  for infinite emotes (-1, for example). Set to 0 if emotes are disabled.
    maxEmotes: -1,
    //Allow using commands in the middle of a message with two colons, example: ::!cmdname
    allowInlineCmd: true,
    //The trigger character will be used to distinguish chat commands.
    //  Must be one character. Valid chars: !#$%^&*()_+-=`~.,?
    trigger: "!",
    //If true, sends chat messages using your rank color.
    useFlair: true,
    //Minimum rank to bypass both user and global cooldowns on commands.
    //  Set to -1 to enforce cooldowns for all ranks.
    minRankToBypassCooldown: 3,
    //If true, disables any chat commands.
    disableAllCommands: false,
    //Put chatfilters here if needed.
    filters: {
      //Code for img chat command.
      img: "",
      //Code for comment chat command. (excluding brackets: [code][/code] becomes just "code")
      commentAuthor: "",
      //Code for pokeroll filter
      pokeroll: "",
      //Tags for spoiler filter. Opener is the left tag, closer is the right tag.
      //Example: [spoiler] is the opener, [/spoiler] is the closer
      spoilerTagOpener: "",
      spoilerTagCloser: ""
    },
    //If true, will use ssc:#rrggbb in some chat messages which requires
    //  Xaekai's external chat color script in the room. Search the bot's code
    //  for examples where this variable is used, as it doesn't automatically
    //  remove any instances of ssc itself.
    roomHasSSC: false,
    //If true, will announce winning option of polls when they close. Requires
    //  two or more options in the poll, and will only occur if the poll
    //  ends after exactly 3 minutes.
    announcePollResults: true,
    //If true, muted users will not be able to use commands and their emotes will not
    //  be checked. However, this may make it easier for users to determine if they
    //  are muted or not.
    ignoreMutedUsers: true,
    //Minimum length a chat message must be before putting it in the database
    minimumQuoteLength: 16
  },
  //Media and playlist options...
  media: {
    //Maximum position to bump videos to. This should be according to a 1-based index,
    //  or how you'd see the playlist on the site.
    bumpCap: 5,
    //Amount of milliseconds between bumps of individual users.
    bumpCooldown: 300000
  },
  misc: {
    //Controls the bot's AFK state automatically.
    //  0 - Disabled (default)
    //  1 - Tries to stay AFK at all times
    //  2 - Tries to stay active (not AFK) at all times
    autoAFK: 0,
    //Choose a language to use. Currently does nothing, planning on
    //  implementing this in the future (also a command to change it during runtime)
    lang: "en",
    //List of bot usernames that may be in your room. Bots will not receive mod-only
    //  PM broadcasts and will not be able to execute commands. Their messages cannot
    //  be stored and/or quoted. Keep the names lowercase. This bot's name is not needed.
    //  Example: ["botname1", "botname2"]
    bots: [],
    //List of blacklisted avatar hostnames. If a user's profile picture's hostname
    //  matches one of these, they'll be notified if moderation.notifyBlacklistedAvatar
    //  is true.
    //  Example: ["maliciousdomain.gov", "wackydomainname.io"]
    blacklistedAvatarHosts: [],
    //Threshold in seconds for the total playlist time to be considered low. Each time
    //  the playlist time falls below this, the bot will send a chat message warning of
    //  a low playlist. Must also have moderation.notifyLowPlaylistTime set to true.
    lowPlaylistTime: 3600,
    //Minimum amount of time in milliseconds between queued actions.
    //  Helps to prevent flooding the server. Should stay above maybe 200ms.
    queueInterval: 200, //Generic socket event.
    broadcastPMQueueInterval: 250, //For broadcasts of private messages.
    largeDataQueueInterval: 2000 //For large data requests, like ban list or channel log.
  },
  moderation: {
    //If true, will automatically disallow users if any of their aliases are disallowed.
    autoDisallow: true,
    //If true, will broadcast a PM to online mods if a new user joins the room.
    //  Requires the user table of the database to be active.
    notifyNewUser: true,
    //If true, will broadcast a PM to online mods if a joining user's subnet
    //  matches that of any banned users.
    //  Requires rank >=3, as the banlist requirement is hardcoded that way.
    notifyBannedSubnets: true,
    //If true, will automatically shadowmute users whose subnets match those of
    //  banned users.
    autoShadowmuteOnSubnetMatch: false,
    //If true, will PM users if their avatar hostname matches one in misc.blacklistedAvatarHosts
    notifyBlacklistedAvatar: false,
    //If true, will send a low playlist time warning message in chat whenever the
    //  total playlist time falls below misc.lowPlaylistTime
    notifyLowPlaylistTime: true,
    //If true, will send a chat message whenever the skip rate is changed
    notifySkipRateChange: true
  },
  advanced: {
    //If true, will automatically grab the Channel Log and save it after certain channel events.
    // Requires Rank 3+
    automaticChannelLog: false,
    //If true, index.js will look for the scripts in .\lib\[channel name]\
    //  Probably useful for running multiple bot instances, but not very practical
    scriptsInChannelFolder: false,
    //If true, loads customchatcommands-roomname.js instead of
    //  customchatcommands.js
    useChannelCustomCommands: true,
    //If true, uses settings-roomname.json instead of settings.json
    useChannelSettingsFile: true,
    //List of command files to load. If useChannelCustomCommands is true, you
    //  do not need to include the channel name, but it won't break anything if
    //  you do. Try not to load too many command files as it might increase
    //  the bot's startup time.
    //  Command files must be named customchatcommands-NAME.js
    //  For example, if this is set to ["test", "external", "fun"], the bot will
    //  look for:
    //    customchatcommands-test.js
    //    customchatcommands-external.js
    //    customchatcommands-fun.js
    //  Be aware that this also respects the scriptsInChannelFolder option.
    //  Duplicate commands will be overwritten, with the last one loaded taking
    //  effect.
    customCommandsToLoad: []
  }
}

module.exports = config;
