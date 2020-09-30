#!/bin/bash
starts=0
while true; do
  starts=$((starts+1))
  clear
  echo Times started: $starts
  node . "$@"
  exitcode=$?
  if [ $exitcode -eq 1 ]; then
    echo "An unhandled error was thrown. If there was no error stack logged, run the bot without this script to see what the error is. Exit code: 1"
    read -p "Press a key to exit."
    exit 1
  elif [ $exitcode -eq 3 ]; then
    echo "Bot killed without restarting."
    exit 3
  elif [ $exitcode -ne 0 ]; then
    echo "Unhandled exit code was returned: ${exitcode}"
    read -p "Press a key to exit."
    exit $exitcode
  else
    echo "Process closed with exit code 0."
  fi
  echo "Restarting in 2 seconds."
  sleep 2
done
