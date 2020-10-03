# Changelog
  - **0.993a - October 3, 2020**
    - Changed the config option `misc.autoAFK` to a tri-state option. Must be updated in existing configs, or it will be ignored.
      - 0: Off (default)
      - 1: Always AFK
      - 2: Always active
    - `ipban` reason will be padded if it begins with `wrange` or `range`
    - Actually use the `exitCode` passed to `bot.kill` (lol)
    - DB features will be disabled if the connection to the database is refused
