"use strict";

const reset = require("cli-color/reset");
const pg = require("pg");
var pool = {};
var schema_init_ran = false;

module.exports["active"] = false;
module.exports["pool"] = pool;
module.exports["endPool"] = function(){return Promise.resolve(false)};
module.exports["run"] = function(){return Promise.resolve(false)};

/*
  Excuse the mess in here
  someone please rewrite all this
*/

var initialized = false;

function init(bot) {
  if (initialized) return;
  initialized = true;
  var active = bot.cfg.db.use,
  schema = bot.CHANNEL.room;
  module.exports["active"] = active;

  if (active && schema.trim() !== "") {
    if (!bot.cfg.db.use) return false;
    try {
      pool = new pg.Pool(bot.cfg.db.connectionInfo);
      if (!schema_init_ran)
        initSchema();
    } catch (e) {
      bot.logger.error(e.stack);
      bot.logger.error(strings.format(bot, "DB_BAD_INFO"));
      module.exports["active"] = false;
      return;
    }

    module.exports["pool"] = pool;
    module.exports["endPool"] = pool.end.bind(pool);

    /*
      Define queries here.
      Typically, you should call these like:
        bot.db.run("queryName", [values], cb(res){})
      Values is an array, and is used for parameterized values in most cases
      cb is the callback carrying the database's response
    */

    var queries = {
      addNewChat: function(values, cb) {
        //Check the required tables for each query
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.chat) {
          //Return the Promise from runQuery
          return runQuery(`INSERT INTO ${schema}.chat (uname, time, msg)
            VALUES ($1, TO_TIMESTAMP($2), $3)
            ON CONFLICT (uname, msg)
            DO NOTHING;`, values, cb);
        }
        //Return false to reject the promise if one of the tables are not active
        return false;
      },
      addNewUser: function(values, cb) {
        if (bot.cfg.db.useTables.users) {
          return runQuery(`INSERT INTO ${schema}.users (uname)
            VALUES ($1)
            ON CONFLICT (uname)
            DO NOTHING
            RETURNING joins;`, values, cb);
        }
        return false;
      },
      bumpCount: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.bump_stats) {
          return runQuery(`INSERT INTO ${schema}.bump_stats (uname, ${values[1]})
            VALUES($1, 1)
            ON CONFLICT (uname)
            DO
            UPDATE SET
            ${values[1]} = ${schema}.bump_stats.${values[1]} + 1`, [values[0]], cb);
        }
        return false;
      },
      cleanUnusedEmotes: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
          return runQuery(`DELETE FROM ${schema}.emote_data
            WHERE
            emote = ANY($1)`, values, cb);
        }
        return false;
      },
      deleteUserChat: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.chat) {
          return runQuery(`DELETE FROM ${schema}.chat
            WHERE
            LOWER(uname)=LOWER($1)`, values, cb);
        }
        return false;
      },
      deleteUserEmotes: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
          return runQuery(`DELETE FROM ${schema}.emote_data
            WHERE
            LOWER(uname)=LOWER($1)`, values, cb);
        }
        return false;
      },
      deletePoll: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.saved_polls) {
          return runQuery(`DELETE FROM ${schema}.saved_polls
            WHERE
            LOWER(savedby)=LOWER($1) AND poll_name=LOWER($2)`, values, cb);
        }
        return false;
      },
      insertDuelRecord: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.duel_stats) {
          return runQuery(`INSERT INTO ${schema}.duel_stats (uname, wins, losses)
          VALUES ($1, 1, 0), ($2, 0, 1)
          ON CONFLICT (uname)
          DO
          UPDATE SET
          wins = excluded.wins + ${schema}.duel_stats.wins,
          losses = excluded.losses + ${schema}.duel_stats.losses`, values, cb);
        }
        return false;
      },
      insertPoll: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.saved_polls) {
          return runQuery(`INSERT INTO ${schema}.saved_polls (savedby, poll_name, title, obscured, options)
          VALUES ($1, LOWER($2), $3, $4, $5)
          ON CONFLICT
          DO NOTHING`, values, cb);
        }
      },
      getPoll: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.saved_polls) {
          return runQuery(`SELECT * FROM ${schema}.saved_polls
          WHERE
          poll_name=LOWER($1)`, values, cb);
        }
      },
      getDuelRecord: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.duel_stats) {
          return runQuery(`SELECT uname, wins, losses FROM ${schema}.duel_stats
            WHERE
            LOWER(uname)=LOWER($1);`, values, cb);
        }
        return false;
      },
      getRandomChat: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.chat) {
          return runQuery(`WITH quotes as (
              SELECT * FROM ${schema}.chat
              WHERE LOWER(uname)=LOWER($1)
              AND LENGTH(msg) > 20
              AND msg NOT LIKE '/%'
              AND msg NOT LIKE '$%'
              AND msg NOT LIKE '<%'
            )

            SELECT * FROM quotes
              OFFSET
                floor(random()*(
                  SELECT count(*)
                  FROM quotes
                ))
              LIMIT 1;`, values, cb);
        }
        return false;
      },
      getUserRoomTime: function(values, cb) {
        if (bot.cfg.db.useTables.users) {
          return runQuery(`SELECT first_seen, room_time, afk_time FROM ${schema}.users
            WHERE
            LOWER(uname)=LOWER($1);`, values, cb);
        }
        return false;
      },
      getUserEmoteCount: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
          return runQuery(`SELECT uname, count FROM ${schema}.emote_data
            WHERE
            LOWER(uname)=LOWER($1) AND emote=$2`, values, cb);
        }
        return false;
      },
      getUserTotalEmoteCount: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
          return runQuery(`SELECT uname, sum(count) FROM ${schema}.emote_data
            WHERE
            LOWER(uname)=LOWER($1)
            GROUP BY uname`, values, cb);
        }
        return false;
      },
      getEmoteTotalCount: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
          return runQuery(`SELECT sum(count) FROM ${schema}.emote_data
            WHERE
            emote=$1`, values, cb);
        }
        return false;
      },
      getTopFiveEmotes: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
          var query = {
            name: "topfiveemotes",
            text:`SELECT emote, SUM(count) FROM ${schema}.emote_data
              GROUP BY emote
              ORDER BY sum
              DESC
              LIMIT 5`
          };
         return runQuery(query, values, cb);
        }
        return false;
      },
      getTopFiveEmoteUsers: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
          return runQuery(`SELECT uname, sum(count) FROM ${schema}.emote_data
            GROUP BY uname
            ORDER BY sum
            DESC
            LIMIT 5;`, values, cb);
        }
        return false;
      },
      getUserMostUsedEmotes: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
          return runQuery(`SELECT uname, emote, sum(count) FROM ${schema}.emote_data
            WHERE
            LOWER(uname)=LOWER($1)
            GROUP BY emote,uname
            ORDER BY sum
            DESC
            LIMIT 5;`, values, cb);
        }
        return false;
      },
      getStoredEmotes: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
          return runQuery(`SELECT DISTINCT emote FROM ${schema}.emote_data`, values, cb);
        }
        return false;
      },
      getLastSeen: function(values, cb) {
        if (bot.cfg.db.useTables.users) {
          var query = {
            text:`SELECT uname, last_seen FROM ${schema}.users
            WHERE LOWER(uname)=LOWER($1)`
          };
         return runQuery(query, values, cb);
        }
        return false;
      },
      updateEmoteCounts: function(values, cb) {
        if (bot.cfg.db.useTables.users && bot.cfg.db.useTables.emote_data) {
          var query = {
            text: `INSERT INTO ${schema}.emote_data (uname, emote, count)
              VALUES ($1, $2, $3)
              ON CONFLICT (uname, emote)
              DO
              UPDATE SET
              count = $3 + ${schema}.emote_data.count`
          }
          for (var i = 0; i < values.length; i++) {
            if (values[i].length === 3 && values[i][2] > 0) {
              var _cb = i >= values.length - 1 ? cb : null;
              runQuery(query, values[i], _cb);
            }
          }
        }
        return false;
      },
      updateUserRoomTime: function(values, cb) {
        if (bot.cfg.db.useTables.users) {
          runQuery(`UPDATE ${schema}.users
            SET
            room_time = $1 + ${schema}.users.room_time,
            afk_time = $2 + ${schema}.users.afk_time,
            last_seen = NOW()
            WHERE
            uname = $3`, values, cb);
        }
        return false;
      },
      updateUserAfkTime: function(values, cb) {
        if (bot.cfg.db.useTables.users) {
          values[0] /= 1000;
          runQuery(`UPDATE ${schema}.users
            SET
            afk_time = $1 + ${schema}.users.afk_time
            WHERE
            uname = $2`, values, cb);
        }
        return false;
      },
      updateUserRoomTimeAll: function(values, cb) {
        if (bot.cfg.db.useTables.users) {
          //[username, roomtime, afktime]
          var query = {
            text: `UPDATE ${schema}.users
              SET
              room_time = $2 + ${schema}.users.room_time,
              afk_time = $3 + ${schema}.users.afk_time,
              last_seen = NOW()
              WHERE
              uname = $1`
          }
          for (var i = 0; i < values.length; i++) {
            var _cb = i >= values.length - 1 ? cb : null;
            runQuery(query, values[i], _cb);
          }
        }
        return false;
      },
      updateUserLastSeen: function(values, cb) {
        if (bot.cfg.db.useTables.users) {
          return runQuery(`UPDATE ${schema}.users
            SET
            last_seen = NOW()
            WHERE
            uname = ANY ($1);`, [values], cb);
        }
        return false;
      },
      updateUserBlacklistState: function(values, cb) {
        if (bot.cfg.db.useTables.users) {
          return runQuery(`UPDATE ${schema}.users
            SET
            blacklisted = $2
            WHERE
            LOWER(uname) = LOWER($1);`, values, cb);
        }
        return false;
      },
      userJoin: function(values, cb) {
        if (bot.cfg.db.useTables.users) {
          return runQuery(`INSERT INTO ${schema}.users (uname)
            VALUES ($1)
            ON CONFLICT (uname)
            DO UPDATE SET joins = ${schema}.users.joins + 1, last_seen = NOW()
            RETURNING joins;`, values, cb);
        }
        return false;
      },
      testQuery: function(values, cb) {
        if (bot.cfg.db.use) {
          return runQuery(`SELECT 1;`, values, cb);
        }
        return false;
      }
    }

    function initSchema() {
      pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`, (err, res) => {
        genericHandler(err, res, function() {
    
          //Define new tables here
    
              if (!bot.cfg.db.useTables.users) return false;
              pool.query(`
                CREATE TABLE IF NOT EXISTS ${schema}.users
                (
                  "uname"       varchar(20) PRIMARY KEY,
                  "first_seen"  timestamp DEFAULT NOW(),
                  "last_seen"   timestamp NOT NULL DEFAULT NOW(),
                  "room_time" decimal(13,3) NOT NULL DEFAULT 0.000,
                  "afk_time"    decimal(13,3) NOT NULL DEFAULT 0.000,
                  "joins"       integer NOT NULL DEFAULT 1
                );`, (err, res)=>{genericHandler(err,res)});
    
              if (bot.cfg.db.useTables.emote_data)
              pool.query(`
                CREATE TABLE IF NOT EXISTS ${schema}.emote_data
                (
                  "uname" varchar(20) REFERENCES ${schema}.users(uname),
                  "emote" varchar(320) NOT NULL,
                  "count" integer NOT NULL DEFAULT 1,
                  UNIQUE (uname, emote)
                );`, (err, res)=>{genericHandler(err,res)});
    
              if (bot.cfg.db.useTables.duel_stats)
              pool.query(`
                CREATE TABLE IF NOT EXISTS ${schema}.duel_stats
                (
                  "uname"  varchar(20) REFERENCES ${schema}.users(uname),
                  "wins"   integer NOT NULL,
                  "losses" integer NOT NULL,
                  UNIQUE (uname)
                );`, (err, res)=>{genericHandler(err,res)});
    
              if (bot.cfg.db.useTables.chat)
              pool.query(`
              CREATE TABLE IF NOT EXISTS ${schema}.chat
              (
                "uname" varchar(20) REFERENCES ${schema}.users(uname),
                "time"  timestamp NOT NULL,
                "msg"   varchar(320) NOT NULL,
                UNIQUE (uname, msg)
              );`, (err, res)=>{genericHandler(err,res)});
    
              if (bot.cfg.db.useTables.bump_stats)
              pool.query(`
              CREATE TABLE IF NOT EXISTS ${schema}.bump_stats
              (
                "uname" varchar(20) REFERENCES ${schema}.users(uname),
                "others"  integer NOT NULL DEFAULT 0,
                "self"   integer NOT NULL DEFAULT 0,
                "vidya_self"  integer NOT NULL DEFAULT 0,
                "vidya_others" integer NOT NULL DEFAULT 0,
                UNIQUE (uname)
              );`, (err, res)=>{genericHandler(err,res)});
    
              if (bot.cfg.db.useTables.saved_polls)
              pool.query(`
              CREATE TABLE IF NOT EXISTS ${schema}.saved_polls
              (
                "savedby" varchar(20) REFERENCES ${schema}.users(uname),
                "poll_name" varchar(30) NOT NULL PRIMARY KEY,
                "title"   varchar(255) NOT NULL,
                "obscured" boolean NOT NULL,
                "options" text NOT NULL,
                UNIQUE (title, obscured, options)
              );`, (err, res)=>{genericHandler(err,res)});
    
              /*if (bot.cfg.db.useTables.video_play_data)
              pool.query(`
              CREATE TABLE IF NOT EXISTS ${schema}.video_play_data
              (
                "uname" varchar(20) REFERENCES ${schema}.users(uname),
                "mediaID" text NOT NULL,
                "date_played" timestamp DEFAULT NOW() NOT NULL,
                "skip_percent_needed" boolean,
                "duration_percent" text,
                UNIQUE (mediaID, date_played)
              );`, (err, res)=>{genericHandler(err,res)});*/
    
              if (!err)
                schema_init_ran = true;
        })
      })
    }

    function isEnded() {
      return !pool || pool.ending || pool.ended;
    }

    function run(query, values, cb) {
      if (!bot.cfg.db.use || isEnded() || !bot.db.active) return Promise.resolve(false);
      return new Promise((resolve)=>{
        if (queries.hasOwnProperty(query)) {
          resolve(queries[query](values, cb));
        } else resolve(false);
      });
    }

    run("testQuery", null, function(res) {
      if (res && res.rowCount >= 1) {
        bot.logger.info("Database connection OK!");
      } else {
        bot.logger.error("Database connection failed.");
      }
    })

    function onConnectionError(err) {
      if (err.code === "ECONNREFUSED")
        bot.logger.error("Query failed, connection to PostgreSQL server was refused (ECONNREFUSED)");
      else if (err.code === "57P01")
        bot.logger.error( "A PostgreSQL query failed, error: admin_shutdown (57P01)");
      else if (err.code === "57P03")
        bot.logger.error("A PostgreSQL query failed, error: cannot_connect_now (57P03)");
      else if (err.code === "42P01") {
        bot.logger.error("A PostgreSQL query failed, error: undefined_table (42P01). Ensure everything is set up properly and restart the bot.");
      } else
        bot.logger.error(err.stack);
    }

    module.exports.onConnError = function(err) {
      onConnectionError(err);
    }

    function genericHandler(err, res, cb) {
      if (err) {
        bot.logger.error(err.stack);
        onConnectionError(err);
      } else if (cb) cb();
    }

    function runQuery(query, values, cb) {
      var released = false;
      return pool.connect().then(client=>{
        return client.query(query, values).then(res=>{
          client.release();
          released = true;
          if (cb) cb(res);
          return res;
        })
        .catch(e=>{
          if (!released) client.release();
          onConnectionError(e);
          return false;
        })
      })
      .catch(e=>{
        onConnectionError(e);
        return false;
      })
    }

    module.exports.run = run;

  }
}


async function disableDB(bot, errText) {
  await module.exports.endPool();
  module.exports["endPool"] = function(){};
  if (module.exports["active"])
    bot.logger.error(errText);
  module.exports["active"] = false;
  module.exports["run"] = function(){return Promise.resolve(false)};
  bot.cfg.db.use = false;
}

module.exports["init"] = init;
