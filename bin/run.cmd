@echo off

set SFDX_BINARY=false&set BIN_NAME=run
REM @OVERRIDES@
if "%SFDX_BINARY%" == "true" (
    REM installer/update that shipped its own node binary
    set CLI_BINPATH=%~dp0%BIN_NAME%.cmd
    "%~dp0node.exe" "%~dp0%BIN_NAME%.cmd" %*
) else (
    REM npm install or local dev
    node "%~dp0run" %*
)
