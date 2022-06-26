# ChozoBot 0.9961a

[Changelog](CHANGELOG.md) • [Chat Commands](CHATCOMMANDS.MD)

ChozoBot is a Node application for emulating a CyTube client with CLI input and configurable options. It can be used as a bot for your room. It should be compatible with most CyTube forks, however only the main CyTube project is supported. Currently in Alpha state.

Please keep backups of the database and your settings and configuration files, as this
bot is in early development and may change dramatically over time.

![Preview](https://cdn.discordapp.com/attachments/571767162314686466/762081534332502056/unknown.png "Screenshot (with debug and verbose logs)")

## Requirements

  - nodejs (12+, last tested on 12.18.2)
  - postgresql (tested on 12.3, optional - only if using database. will write more setup info eventually. create a schema with the name of the room you're using the bot in and grant all perms to the user who owns the database)
    - root/admin access for setting up psql

## Setup

I'll get around to writing this readme properly, but:

Copy the config.example.js file and name it config.js. If you're providing a room parameter to the bot (see below), name it config-roomname.js instead.

Read through the configuration file and carefully make sure everything is set just right.

Install the node modules: `npm install`

## Usage

Run the bot: `node .`

You can provide a room parameter: `node . -r room` if you'd like to have different configurations for different rooms.

You may also use the scripts provided to allow the bot to restart if it is killed. Replace `node` with `./start.sh`, for example. However, the batch (Windows) script was not tested since it was last edited.

It is recommended to have the bot at rank 3 (Admin) so it has full functionality.

When updating the bot, you must make sure to add any new configuration lines every time.

To create custom commands, see customcommands.example.js for writing them, and the bottom of the config.js file for more info on including them.

## To Do

 - Of course, write this properly. There's a lot of info on commands, too.
 - A lot, probably. I don't know a whole lot about psql or the node module for it, so it probably looks awful. Keep in mind this bot is in an alpha state.
 - I would also like to be able to run multiple bots in different rooms but have certain events broadcasted among all of them, such as bans. Maybe one day.

## Known Issues

 - partitionChange event is undertested, and sometimes may not work right.
 - Guest functionality is undertested as well.
 - Bump position memory was redone and is not fully tested.
 - Bot does not check for errors if psql is not installed but the DB is enabled in the config. Same thing if the psql service is disabled.
 - Database may throw errors if the bot tries to access tables before they're initialized for the first time. This shouldn't happen too often.
