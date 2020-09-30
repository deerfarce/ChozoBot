const C = require("cli-color");
const Discord = require("discord.js");

const utils = require("./utils.js");
const strings = require("./strings.js");

function DiscordBot(bot, token) {
  this.client = new Discord.Client();

  this.client.on("ready", ()=>{
    bot.logger.log(C.greenBright(strings.format(bot, "DISCORD_READY")));
  });

  /*this.client.on("shardDisconnect", (ev, shardID)=>{
    bot.logger.log(C.redBright("Discord Bot disconnected! [" + shardID + "]"));
  });*/

  /*this.client.on("shardReconnecting", (shardID)=>{
    bot.logger.log(C.yellowBright("Discord Bot reconnecting... [" + shardID + "]"));
  });*/

  this.client.on("error", (err)=>{
    bot.logger.error(C.red("Discord error: " + err));
  });

  this.client.login(token);

  this.lastNowPlayingWasGreen = false;

  this.createEmbed = function() { return new Discord.MessageEmbed()
    .setFooter("https://"+bot.cfg.connection.hostname+"/r/" + bot.CHANNEL.room + " • " + utils.getUTCTimestamp() + " UTC", bot.cfg.discord.iconUrl);
  }
}

DiscordBot.prototype.getChannel = function(id) {
  return this.client.channels.cache.get(id);
}

module.exports = {
  init: function(bot, token) {
    if (token.trim() === "") {
      bot.logger.error(strings.format(bot, "DISCORD_ERR_INIT", ["no token given"]));
      return null;
    }
    return new DiscordBot(bot, token);
  }
}
