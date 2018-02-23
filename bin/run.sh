#!/usr/bin/env bash
set -e

export SFDX_INSTALLER="false" BIN_NAME="run"
# @OVERRIDES@

NO_FORWARD=false
DEV_FLAGS=()
NODE_FLAGS=()
CLI_ARGS=()

# Process only cli flags that must be handled before invoking node
while [[ "$#" -gt 0 ]]; do
    case "$1" in
        --dev-suspend) NODE_FLAGS+=("--inspect-brk"); DEV_FLAGS+=("$1"); shift;;
         --no-forward) CLI_ARGS+=("$1"); NO_FORWARD=true;                shift;;
                    *) CLI_ARGS+=("$1");                                 shift;;
    esac
done

get_script_dir () {
    SOURCE="${BASH_SOURCE[0]}"
    # While $SOURCE is a symlink, resolve it
    while [[ -h "$SOURCE" ]]; do
        DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
        SOURCE="$( readlink "$SOURCE" )"
        # If $SOURCE was a relative symlink (so no "/" as prefix, need to resolve it relative to the symlink base directory
        [[ "$SOURCE" != /* ]] && SOURCE="$DIR/$SOURCE"
    done
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    echo "$DIR"
}
DIR=$(get_script_dir)

# Normalize home directory
CLI_HOME=$(cd && pwd)
XDG_DATA_HOME="${XDG_DATA_HOME:="$CLI_HOME/.local/share"}"
BIN_DIR="$XDG_DATA_HOME/$BIN_NAME/client/bin"

if [[ "$NO_FORWARD" != "true" && "${SFDX_INSTALLER:-}" == "true" && -x "$BIN_DIR/$BIN_NAME" && ! "$BIN_DIR" -ef "$DIR" ]]; then
    "$XDG_DATA_HOME/$BIN_NAME/client/bin/$BIN_NAME" "${DEV_FLAGS[@]}" "${CLI_ARGS[@]}"
else
    MAIN_NAME="$BIN_NAME"
    NODE_PATH="node"
    if [[ "${SFDX_INSTALLER:-}" == "true" ]]; then
        MAIN_NAME="$MAIN_NAME.js"
        NODE_PATH="$DIR/$NODE_PATH"
    fi
    CLI_BINPATH="$DIR/$BIN_NAME" "$NODE_PATH" "${NODE_FLAGS[@]}" "$DIR/$MAIN_NAME" "${CLI_ARGS[@]}"
fi
