@echo off
REM This file was made a while ago and has not been tested since.
set starts=0
:bot
set /a starts=starts+1
cls
title ChozoBot - KeepAlive
echo Times started: %starts%
start /wait node . %*
if %errorlevel% EQU 1 (
	color 0c
	echo An unhandled error was thrown, most likely a syntax error. Run the bot without this script to see what the error is.
	echo.
	goto close
)
if %errorlevel% EQU 3 (
	color 0c
	echo The bot was killed without restarting.
	echo.
	goto close
)

timeout /t 2 /nobreak
goto bot

:close
pause
color
