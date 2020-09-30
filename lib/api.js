const fetch = require("node-fetch");

const strings = require("./strings.js");
const utils = require("./utils.js");

/*
  Each API item must be a function with the follow parameters:
    bot: Bot object
    msg: A message from a chat command or something similar. Nullable.
    apiKey: A string containing an API key if needed. Nullable.
    callback: A function that does something with the status and data returned,
      see below. When it comes to chat commands, the command provides the callback
      here.

  Once the request is done, the callback given to sendRequest is called if present,
    and it should have the following parameters:
      status: Status code of the request. Some of these API methods here change
        the actual status code if it's not OK (yeah it's strange but some
        commands use this).
      data: The data. If json is true, this will be a proper object.
      ok: A boolean determining if the status was OK.

  Inside the callback in sendRequest, the callback for the API method is then called.

*/

var APIs = {

  "anagram": function (bot, msg, apiKey, callback) {
      var url = "https://anagramgenius.com/server.php?source_text=" + encodeURIComponent(msg) + "&vulgar=1";
      var json = false;
      var options = {
          method: "GET",
          timeout: 1000
      }
      sendRequest(bot, url, json, options, "anagram", function (status, data, ok) {
          var _data = data.match(/anagrams to\<br\>\<span class=\"black\-18\">\'(.+?)\'\<\/span\>/);
          if (!(_data && _data[1])) _data = null;
          callback(status, _data, ok);
      })
  },

  //Make sure you change the schedule ID for each new event. This will be outdated
  "gdq": function(bot, msg, apiKey, callback) {
    var url = "https://horaro.org/-/api/v1/schedules/3011nzb4yh71id7a63";
    var json = true;
    var options = {
      method: "GET",
      timeout: 1000
    };
    sendRequest(bot, url, json, options, "gdq", function(status, data, ok) {
      callback(status, data, ok);
    })
  },

  "saltybet": function (bot, msg, apiKey, callback) {
    var url = "https://saltybet.com/state.json";
    var json = true;
    var options = {
      method: "GET",
      timeout: 1000
    }
    sendRequest(bot, url, json, options, "saltybet", function(status, data, ok) {
      callback(status, data, ok);
    })
  },

  //(not really a public API but valid endpoint)
  "urbandictionary": function (bot, msg, apiKey, callback) {
      var url = "https://api.urbandictionary.com/v0/define?term=" + encodeURIComponent(msg);
      var json = true;
      var options = {
          method: "GET",
          timeout: 2000
      }
      sendRequest(bot, url, json, options, "urbandictionary", function (status, data, ok) {
          if (!ok) data = null;
          callback(status, data, ok);
      })
  },

  //YouTube v3: Comments
  "youtubecomments": function (bot, videoId, apiKey, callback) {
      if (apiKey.trim() === "") {
        callback(-1, null, false);
        return;
      }
      var url = "https://www.googleapis.com:443" +
        "/youtube/v3/commentThreads?" +
        "part=snippet&videoId=" + videoId + "&key=" + apiKey + "&maxResults=100&order=relevance";
      var json = true;
      var options = {
          method: "GET",
          timeout: 1500
      }
      sendRequest(bot, url, json, options, "youtubecomments", function (status, data, ok) {
          if (status !== 200) {
            if (status === 403) callback(status, data, ok);
            else callback(status, null, ok)
            return;
          }
          callback(true, data, ok);
      });
  },

  //YouTube v3: PlaylistItems
  //Returns a list of videos from a playlist
  //Untested
  /*
  "youtubeplaylist": function (bot, data, apiKey, callback) {
    let playlistId = data.playlistId,
      maxResults = data.maxResults;
    if (apiKey.trim() === "" || !playlistId || !maxResults) {
      callback(-1, null);
      return;
    }
    var url = "https://www.googleapis.com:443" +
      "/youtube/v3/playlistItems?" +
      "part=contentDetails&id=" + playlistId + "&key=" + apiKey + "&maxResults=" + maxResults;
    var json = true;
    var options = {
        method: "GET",
        timeout: 1500
    }
    sendRequest(bot, url, json, options, "youtubeplaylist", function(status, data, ok) {
      if (status !== 200) {
        if (status === 403) callback(status, data, ok);
        else callback(status, null, ok)
        return;
      }
      callback(true, data, ok);
    });
  },*/

  //YouTube v3: Statistics
  //Returns a statistic object with views, likes, etc
  "youtubestatistics": function (bot, videoId, apiKey, callback) {
    if (apiKey.trim() === "") {
      callback(-1, null);
      return;
    }
    var url = "https://www.googleapis.com:443" +
      "/youtube/v3/videos?" +
      "part=statistics&id=" + videoId + "&key=" + apiKey;
    var json = true;
    var options = {
        method: "GET",
        timeout: 1500
    }
    sendRequest(bot, url, json, options, "youtubestatistics", function(status, data, ok) {
      if (status !== 200) {
        if (status === 403) callback(status, data, ok);
        else callback(status, null, ok)
        return;
      }
      callback(true, data, ok);
    });
  },

  /*
    RETURNS:
      status - Request status code. Can also be <0 for certain situations
        -1: don't do anything. Invalid input or similar issue.
        -2: Blocked input.
        -3: Error or blocked output. Just log the data, don't send it
      data - Response from wolfram, or error info. Empty if bad input.
  */
  "wolfram": function (bot, query, apiKey, callback) {
      if (apiKey.trim() === "" || !query || query.trim() === "") {
        return callback(-1, null, false);
      }
      if (/nearme|ipv4|ipv6|latlong|latitude|longitude|rot13|base64|geoip|coordinat|whoami|whereami|ipaddress|location|myip|geograph|fromcharactercode|tocharactercode|bytearraytostring|characterrange|fromletternumber|alphabet|charactername|characterencoding|encod|decod|parse/i.test(query.replace(/\W/g, "")))
        return callback(-2, "That query is not allowed", false);

      var url = "https://api.wolframalpha.com/v1/result?i=" +
        encodeURIComponent(query) + "&appid=" + apiKey;
      var json = false;
      var options = {
          method: "GET",
          timeout: 2000
      }

      sendRequest(bot, url, json, options, "wolfram", function(status, data, ok) {
        if (utils.looseIPTest(data) || /.+, united states/i.test(data)) {
          callback(-3, "Response blocked.", ok);
        } else if (/error [\d\w]+\:/i.test(data)) {
          callback(-3, data, ok);
        }
        else callback(status, data, ok);
      });
  }
}


/**
 * Sends a fetch request to the desired endpoint.
 *
 * @param  {!Bot} bot      Bot object
 * @param  {!string} url    Full url of the desired endpoint
 * @param  {?boolean} json     Whether or not the data will be JSON. Data returned will automatically be converted from JSON if needed.
 * @param  {?Object} options  Object of options, which should contain a HTTP request method and timeout at the very least.
 * @param  {!type} apiName  Name of the API to use. Must match one of the keys of the APIs object
 * @param  {?type} callback Function to call after the request
 */
function sendRequest(bot, url, json, options, apiName, callback) {
  if (!options.hasOwnProperty("headers")) options["headers"] = {};
  if (json) {
    options.headers["Content-Type"] = "application/json";
  }
  var body = "";
  var status = -1;
  var ok = false;
  var fn = ()=>{
    fetch(url, options)
      .then(res=>{
        status = res.status;
        ok = res.ok;
        if (!ok) {
          bot.logger.error(strings.format(bot, "API_NOT_OK", [apiName, status, JSON.stringify(res.statusText)]))
        }
        return json ? res.json() : res.text();
      })
      .then(data=>{
        if (callback)
          callback(status, data, ok);
      })
      .catch(e=>{
        if (apiName === "youtubestatistics") {
          bot.gettingVideoMeta = false;
        } else if (apiName === "youtubecomments") {
          bot.gettingComments = false;
        }
        if (e.type === "request-timeout") {
          bot.sendChatMsg(strings.format(bot, "API_TIMEOUT", [apiName]));
        } else
          bot.logger.error(strings.format(bot, "API_ERROR", [apiName, e.stack]));
      });
  }
  bot.actionQueue.enqueue([this, fn, []]);
}

module.exports = {
  APIs: APIs,
  APIcall: function(bot, API, data, apiKey, callback) {
    if (this.APIs.hasOwnProperty(API)) {
      this.APIs[API](bot, data, apiKey, callback);
    } else {
      bot.logger.error(strings.format(bot, "API_NOT_FOUND", [API]));
    }
  }
}
