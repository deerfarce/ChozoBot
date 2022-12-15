# ChozoBot 0.997a

[Changelog](CHANGELOG.md) • [Chat Commands](CHATCOMMANDS.MD) • [CLI Commands](CLICOMMANDS.MD)

ChozoBot is a Node application for emulating a CyTube client with CLI input and configurable options. It can be used as a bot for your room. It should be compatible with most CyTube forks, however only the main CyTube project is supported. Currently in Alpha state.

Please keep backups of the database and your settings and configuration files, as this
bot is in early development and may change dramatically over time.

![Preview](https://cdn.discordapp.com/attachments/571767162314686466/762081534332502056/unknown.png "Screenshot (with debug and verbose logs)")

## Requirements
  - [node.js](https://github.com/nodejs/Release) - Currently, the minimum version required is 12.20. The active LTS is recommended.
  - postgresql (tested on 14.5, optional - only if using database)

## Setup
If you would like to use features that rely on a database, refer to [this page](https://github.com/deerfarce/ChozoBot/wiki/DB-Setup-with-PostgreSQL) first.

Copy the `config.example.js` file and name it `config.js`. If you're providing a room parameter to the bot (see the [Usage](#usage) section), name it `config-roomname.js` instead.

Read through the configuration file that you just copied, and carefully make sure everything is set just right. Every option has a comment explaining what it does.

If `db.use` is set, your PostgreSQL server MUST be on or the bot will receive errors every time a query is attempted.

Open a command prompt or terminal window in the directory of the bot and install the node modules by typing:
```sh
npm install
```

## Usage
Run the bot from within a terminal window:
```sh
node .
```

You can provide a room parameter if you'd like to have different configurations for different rooms. As mentioned in the [Setup](#setup) section, this requires that your config file is named `config-roomname.js`:
```sh
node . -r roomname
```

You may also use the scripts provided to allow the bot to restart if it is killed. Replace `node .` with `./start.sh` (Linux) or `.\start.bat` (Windows).

Example:
```sh
./start.sh -r roomname
```

## Other Notes
It is recommended to have the bot at rank 3 (Admin) so it has full functionality.

When updating the bot (usually easily done with just `git pull`), you should add any new configuration options to your config file. However, most new options will automatically be set to their default values if they are not present in the config.

Run `npm install` whenever dependencies are updated.

To create custom commands, see [customcommands.example.js](lib/customchatcommands.example.js) for info on writing them and an example command, and the bottom of the [config.js](config.example.js) file for more info on including them.

## To Do
 - A lot, probably. I don't know a whole lot about psql or the node module for it, so it probably looks awful. Keep in mind this bot is in an alpha state.
 - I would also like to be able to run multiple bots in different rooms but have certain events broadcasted among all of them, such as bans. Maybe one day.

## Known Issues
 - partitionChange event is undertested, and sometimes may not work right.
 - Guest functionality is undertested as well.
 - Database may throw errors if the bot tries to access tables before they're initialized for the first time. This shouldn't happen too often.
