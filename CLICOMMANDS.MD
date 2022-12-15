## CLI Commands
Here is a list of all vanilla CLI commands! Not to be confused with [chat commands](CHATCOMMANDS.MD). These are to be entered into the bot itself.
<br />Note that many of these commands are mostly only for debugging.

###### Last updated Dec 15, 2022

| Command | Usage | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Description&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Notes |
| ----------- | ----------- | ----------- | ----------- |
| exit | `/exit` | Closes the bot. | Gives an exit code of 3. |
| restart | `/restart` | Closes the bot. If using one of the provided start scripts, the bot will restart. | Gives an exit code of 0. |
| say | `/say message` | Sends a chat message. | Bypasses the bot's mute state. |
| users | `/users` | Displays a sorted list of online users. ||
| readchanlog | `/readchanlog` | Manually requests the channel log from CyTube and saves the result into `logs/roomname/chan.log`, if successful. | Requires rank 3+. |
| setname | `/setname name` | Sets your name to the one given if you are not logged in. | Not fully tested. |
| subnet | `/subnet user` | Checks the given user's IP's subnet against IPs in the ban list. | Requires ban permissions to retrieve the banlist. |
| setluck | `/setluck user luck_number` | Sets a user's amount of luck to the given number and saves it. | Used by the `roll` chat command, where it determines the amount of lucky rerolls the user gets. Luck is naturally set by the `fortune` chat command. |
| disablecommands | `/disablecommands` | Disables all chat commands. ||
| enablecommands | `/enablecommands` | Enables chat commands. ||
| mute | `/mute` | Mutes the bot, which silences most chat messages except those sent with `/say` ||
| unmute | `/unmute` | Unmutes the bot. ||
| trigger | `/trigger char` | Temporarily sets the bot's chat command trigger, which will reset once the bot restarts. | Valid triggers are: !#$%^&*()_+-=`~.,?£ |

### Debug Commands

| Command | Usage | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Description&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Notes |
| ----------- | ----------- | ----------- | ----------- |
| testdb | `/testdb` | Sends `SELECT 1` to the DB server and tells you if it was successful. ||
| userinfo | `/userinfo user` | Displays the properties of the given user's userlist object. ||
| videolist | `/videolist` | Displays properties of each video item in the entire playlist. | I probably wouldn't use this on giant playlists. |
| currentmedia | `/currentmedia` | Displays object properties of the currently playing video. ||
| showbumpstats | `/showbumpstats` | Displays current bump memory information. ||
| memory | `/memory` | Displays current heap usage in KB. ||
| testalllogs | `/testalllogs` | Prints a test message in all available loggers. ||