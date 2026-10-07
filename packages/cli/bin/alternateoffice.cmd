@echo off
rem alternateoffice launcher for the packaged Windows app: <install>\resources\cli\alternateoffice.cmd
setlocal
set ELECTRON_RUN_AS_NODE=1
"%~dp0..\..\AlternateOffice.exe" "%~dp0alternateoffice.cjs" %*
endlocal
