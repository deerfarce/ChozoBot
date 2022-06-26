## Chat Commands
Here is a list of all vanilla commands! Note that many of these require certain database features and API keys.
<br />The table is very wide so you may have to scroll horizontally...
###### Last updated Jun 25, 2022

| Command | Rank | Usage | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Description&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Cooldown Per User | Global Cooldown | Accepted via PM? | Required Channel Perms | Changeable rank? | Notes |
| ----------- | ----------- | ----------- | ----------- |  ----------- |  ----------- |  ----------- |  ----------- | ----------- | ----------- |
| 8ball<br />**ask** | >= User |`!8ball question`| Gives you a random answer to your question. | 30 seconds | 0.5 seconds | no | `Chat` | yes |
| about | >= User |`!about`| Displays some info about the bot. (name, author, version) | 120 seconds | 60 seconds | no | `Chat` | yes |
| acceptduel<br />**accept** | >= User |`!acceptduel`| Accept a pending duel, if any. | - | - | yes | `Chat` | yes |
| allow | >= Mod |`!allow username `| Reallows a user if disallowed. | - | 0.5 seconds | yes | - | no |
| anagram | >= User |`!anagram words and/or phrases`| Gets an anagram for the given input (7-30 chars). | 3 seconds | 1 second | no | `Chat` | yes | Uses anagramgenius.com
| ban<br />**ipban** | >= Mod |`!ban username [reason]`| Bans a user by name and IP, and optionally provides a reason. Same as the CyTube command `/ipban` | - | - | yes | `Ban users`, `Chat` | yes | CyTube does store ban reasons and allows mods to view them, but banned users will not see them.
| blacklist | >= Mod |`!blacklist [/remove] username`| Adds a username to the blacklist and purges them. The blacklist basically just keeps certain users from adding videos. If you include `/remove`, it removes a user from the blacklist. | - | 1 second | no | `Delete playlist items` | yes |
| blacklistvid | >= Mod |`!blacklistvid [/remove] [type:id OR playlist position]`| Add a video to the blacklist. If just the command is used, it will blacklist the currently playing video and remove it immediately. /remove is the same as above. You can also specify a playlist position like `!blacklistvid 5`. type:id is the site abbreviation[^2] and the video's ID from its link. An example for a YouTube video is yt:70I2JcZHn6c. You should probably take note of the type:id of the video or at the very least the link before blacklisting it, so it can be undone later if needed. Regardless, blacklist actions are logged anyway, so it can probably be found easily. | - | 1 second | yes | `Delete playlist items`, `View the playlist` | yes |
| bump | >= Mod |`!bump [user] [position]`| Bumps a user's (if not specified, the command user's) last added video to #5, or right after the previously bumped video. If position is given, it moves the video there instead. | 10 seconds | 5 seconds | no | `View the playlist`, `Move playlist items` | yes |
| cleanemotedb | >= Admin |`!cleanemotedb`| Wipes counts of any old emotes that are no longer emotes in the room. Untested and not really recommended, but it's there. | - | 60 seconds | yes | `Chat` | yes | Requires `db.useTables.emote_data`
| clearcooldownoverrides | >= Admin |`!clearcooldownoverrides command`| Removes persistent cooldown overrides from a command, resetting its cooldowns to their default values. | - | - | yes | - | no |
| clearrankoverrides | >= Admin |`!clearrankoverrides command`| Removes persistent rank and rank match op overrides from a command, resetting its rank info to default values. | - | - | yes | - | no |
| clearemotecount | >= User |`!clearemotecount`| Erases all emote counts for the user of this command from the database. | 60 seconds | 0.5 seconds | yes | - | yes | Requires `db.useTables.emote_data`
| clearquotes | >= User |`!clearquotes`| Erases all quotes for the user of this command from the database. | 60 seconds | 0.5 seconds | yes | - | yes | Requires `db.useTables.chat`
| comment | >= User |`!comment`| Gets a random comment from the currently playing video and sends it in chat. | 3 seconds | 3 seconds | no | `Chat` | yes | Only works on YouTube videos.<br />Requires an API key in config.js
| cooldown | >= Admin |`!cooldown command (global OR cmd)\|user duration`<br />e.g. `!cooldown roll global 1000`| Changes the global/cmd or user cooldown of the given command. Duration is in milliseconds. | - | 2 seconds | yes | - | yes |
| declineduel<br />**decline** | >= User |`!declineduel`| Decline a pending duel. | - | - | yes | `Chat` | yes | Requires `db.useTables.duel_stats`
| deletepoll | >= Mod |`!deletepoll pollname`| Deletes a poll from the DB with the exact given name if you were the one who saved it. | 10 seconds | 5 seconds | yes | - | yes | Requires `db.useTables.saved_polls`
| disable | >= Admin |`!disable command`| Disables the given command from being used. | - | - | yes | - | yes |
| disallow | >= Mod |`!disallow username`| Disallows a user, preventing them from using the bot's commands. Command user and the bot must be higher than the target user in rank. | - | 0.5 seconds | yes | - | yes |
| duel | >= User |`!duel username`| Challenge a user to a duel if both users are not in pending duels. | 5 seconds | 1 second | yes | `Chat` | yes | Requires `db.useTables.duel_stats`
| duelrecord | >= User |`!duelrecord`| Displays your duel result record. | 5 seconds | 0.5 second | no | `Chat` | yes | Requires `db.useTables.duel_stats`
| echo | >= Admin |`!echo message`| Make the bot send a message. | - | 0.5 seconds | no | `Chat` | yes |
| emotecount<br />**ec** | >= User |`!emotecount emotename`| Displays how many times a valid emote has been used by all users. | 5 seconds | 1 second | no | `Chat` | yes | Requires `db.useTables.emote_data`
| enable | >= Admin |`!enable command`| Enable a command if disabled. | - | - | yes | - | yes |
| endpoll<br />**closepoll** | >= Mod |`!endpoll`| Closes the current active poll. | 1 second | 1 second | yes | `Open/Close poll` | yes |
| exit<br />**kill** | >= Admin |`!exit`| Forces the bot to close. Does not restart the bot. | - | - | yes | - | no | Provides exit code of 3.
| flatskiprate | >= Mod |`!flatskiprate skiptarget\|off`<br />e.g. `!flatskiprate 5`| desc | - | 5 seconds | yes | - | no | Experimental and not fully reliable, may be removed.
| getchanlog | >= Admin |`!getchanlog`| Requires the bot to be rank >=3. Tries to get the channel log and saves it into a local file. | - | 60 seconds | yes | - | no |
| gettimeban | >= Mod |`!gettimeban username`| Displays the amount of time a user has left on their ban if they are timebanned. | - | 0.5 seconds | yes | - | no |
| img | >= User |`!img image_link`| Requires a filter to embed images.[^1] Displays a given image in chat if the host is whitelisted. Valid hosts (jpg, png, gif, webp): discord, 4chan (probably won't work, no hotlinking but whatever), gyazo, tumblr, puush, reddit, gfycat (gif of course) | 30 seconds | 5 seconds | no | `Chat` | yes |
| isblacklisted | >= Mod |`!isblacklisted type:id OR user`<br />e.g. `!isblacklisted yt:9HZ-HIRKb2w`| Tells you if the given user or type:id (the ID is case sensitive) is blacklisted. | - | 0.5 seconds | yes | - | yes |
| kick | >= Mod |`!kick username [reason]`| Kick a user from the room with an optional reason. | - | - | yes | `Kick users`, `Chat` | yes | Unlike bans, kicks allow users to see the reason.
| lastseen<br />**seen** | >= User |`!lastseen username`| Check when a user was last seen in the room. | 2 seconds | 1 second | yes | `Chat` | yes | Requires `db.useTables.users`
| loadpoll | >= Mod |`!loadpoll [time:[H:]M:S or, just seconds as a number] pollname`<br />e.g. for timed polls: `!loadpoll time:0:30 a saved poll`| Grabs a saved poll with the exact given poll name and opens it. If time is specified, it applies a timeout to the poll. | 20 seconds | 10 second | yes | `Open/Close poll` | yes | Requires `db.useTables.saved_polls`
| memoryusage | >= Mod |`!memoryusage`| Displays the amount of memory used by the bot. | - | 0.5 seconds | no | `Chat` | yes |
| modmsg | >= Admin |`!modmsg message`| Broadcasts a private message to all online mods. Can be used in PM as well. | - | 8 seconds | yes | - | no |
| mute | >= Mod |`!mute`| Prevents the bot from sending messages and PMs until unmuted. Does not prevent CyTube chat commands from being used. | 1 second | 1 second | yes | - | yes |
| nameban | >= Mod |`!nameban user [reason]`| Bans a user by name, with an optional reason. | - | - | yes | `Ban users`, `Chat` | yes | See `ban` about ban reasons
| pick<br />**choose** | >= User |`!pick option 1;option 2;...`| Picks a random option. Separate options with `;`. | 5 seconds | 1 second | no | `Chat` | yes |
| purge | >= Mod |`!purge username`| Removes all videos added by the specified user. | - | 10 seconds | yes | `Delete playlist items` | yes |
| quote | >= User |`!quote username`| Returns a random quote from a user, if they allow it. | 20 seconds | 10 seconds | no | `Chat` | yes | Requires `db.useTables.chat`
| quotes | >= User |`!quotes [on\|off]`| Tells you whether or not the bot is collecting quotes from you if on/off is not given. Lets you turn quote collection on or off otherwise. | 0.5 seconds | - | yes | - | yes | Requires `db.useTables.chat`
| restart | >= Admin |`!restart`| Closes the bot but also lets it restart. | - | - | yes | - | no | Provides an exit code of 0.
| roll | >= User |`!roll number (can also sort of use die notation, like 2d6)`| Rolls a random number. Providing a number lets you decide how many digits the resulting number will have (valid range is 2-10). Default is 2 digits. Otherwise, you can use a somewhat limited die notation. | 10 seconds | 1 second | no | `Chat` | yes |
| roomtime | >= User |`!roomtime user`| Tells you how long you have been in the room since you were first seen, including activity time. Can also specify a user. | 20 seconds | 1 second | yes | `Chat` | yes | Requires `db.useTables.users`
| savepoll | >= Mod |`!savepoll pollname`| Saves the currently active poll with the given name (the entire message including spaces). The poll must have 10 or less options, have either a title or at least one option, and the name you provide must be 1-30 characters. | 10 seconds | 5 seconds | yes | - | yes | Requires `db.useTables.saved_polls`
| seekto | >= Mod |`!seekto [H:]M:S`| Changes the current time of the video. Bot must either be leader, or it must have permission to give itself leader (at rank 3, this isn't an issue). The time must have M:SS (even, for example, 0:20, and seconds/minutes can go over 60 I guess if you care), and the hours are optional. | - | 6 seconds | yes | `Assign/Remove leader` (only if not leader already) | yes |
| selfpurge | >= User |`!selfpurge`| Allows users to purge themselves. | 1 hour | 10 seconds | yes | `Delete playlist items`, `View the playlist` | yes | Disabled by default.
| selfremove | >= User |`!selfremove video position\|first\|last`| Removes the video at the given position (or first or last video found if specified) if added by you. | 40 seconds | 20 seconds | yes | `Delete playlist items`, `View the playlist` | yes |
| setrank | >= Admin |`!setrank command rank`| Sets a command's required rank. Be wary of its comparison operator (default for most is >=) | - | - | yes | - | no |
| setrankmatch | >= Admin |`!setrankmatch command operator`| Sets the comparison operator for a command's rank check function. `operator` must be `<=`, `==`, or `>=`. | - | - | yes | - | no |
| shuffle | >= Mod |`!shuffle`| Shuffles the whole playlist. Same as using the shuffle on CyTube. | - | 2 seconds | no | `Shuffle playlist` | yes |
| shuffleuser | >= Mod |`!shuffleuser username`| Disperses a user's videos throughout the playlist. Videos will not go behind the currently active video (which will also be ignored if it was added by the given user too). | - | 20 seconds | no | `View the playlist`, `Move playlist items` | yes |
| su-allow | >= Room Owner |`!su-allow username`| Removes a user from the disallow list. Ignores rank. | - | 0.5 seconds | yes | - | no |
| su-clearquotes | >= Room Owner |`!su-clearquotes username`| Clears all quotes of a given user. | 10 seconds | 0.5 seconds | yes | - | yes | Requires `db.useTables.chat`
| su-disallow | >= Room Owner |`!su-disallow username`| Disallows a user regardless of rank. | - | 0.5 seconds | yes | - | no |
| timeban | >= Mod |`!timeban user time`| Bans a user and unbans them once the specified time is over. Minimum time is 1 minute, and if an invalid value is given, it defaults to 1 minute. Time must be written like: #y#d#h#m#s (years, days, hours, minutes, seconds)<br />Examples of timebans: `!timeban user 6d`, `!timeban user 1h30m`, `!timeban user 1y1d1h` | - | - | yes | `Ban users`, `Chat` | yes | See `ban` about ban reasons
| top5emotes | >= User |`!top5emotes`| Displays the top 5 most used emotes so far. | 20 seconds | 15 seconds | no | `Chat` | yes | Requires `db.useTables.emote_data`
| top5emoteusers | >= User |`!top5emoteusers`| Displays the top 5 emote users. | 20 seconds | 15 seconds | no | `Chat` | yes | Requires `db.useTables.emote_data`
| unban | >= Mod |`!unban username`| Unbans the given user. This will not work if the user is timebanned (to avoid accidents), use !untimeban for that. | - | 1 second | yes | `Ban users` | no |
| untimeban | >= Mod |`!untimeban username`| Unbans a user if they are timebanned. Fundamentally does the same thing as !unban but exists so mods don't unknowingly unban someone who is meant to be banned for a while. | - | 1 second | yes | `Ban users` | no |
| unmute | >= Mod |`!unmute`| Unmute the bot if it's muted. | - | 1 second | yes | - | yes |
| uptime | >= User |`!uptime`| Displays how long the bot has been running in its current session. Restarts will reset this. | 2 seconds | 1 second | no | `Chat` | yes |
| urbandictionary<br />**ud** | >= User |`!ud phrase`| Returns the top match for the exact given phrase on urbandictionary.com. | 20 seconds | 10 seconds | no | `Chat` | yes |
| useremotecount<br />**uec** | >= User |`!uec username [emote]`| Displays how many emotes the given user has used. If an emote is given and valid, it tells you how many times the user has used that specific emote. | 5 seconds | 1 second | no | `Chat` | yes | Requires `db.useTables.emote_data`
| vidstats | >= User |`!vidstats`| Displays the currently playing video's view and like counts (YouTube only). | - | 6 seconds | no | - | yes | May not work properly due to dislikes being removed from the API.<br />Requires an API key in config.js
| wolfram | >= User |`!wolfram query`| Sends a query to WolframAlpha. | 10 seconds | 2 seconds | no | `Chat` | yes | Uses the Short Answers API, not all queries will work.<br />Requires an API key in config.js

[^1]: img requires a channel filter which replaces a link with an embedded image, such as this regex: `\b(?:https:\/\/)?([^ ]*?\.[^ ]*?)[,.](?:IMG_CODE_HERE)$` and IMG_CODE_HERE must be set in the config at `chat.filters.img`. It should preferably be a private code that no one will guess.

[^2]: see [here](https://github.com/calzoneman/sync/blob/bd63013524d06f25258aab054d150325a4b91e10/www/js/util.js#L25) for source abbreviations
