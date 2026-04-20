#!/bin/sh
set -eu

. "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/common.sh"

resolve_project_dir
set_dev_defaults

exec python3 -m http.server "${COVFEE_WWW_SERVER_PORT}" \
    --bind "${COVFEE_WWW_SERVER_HOST}" \
    --directory "${COVFEE_PROJECT_WWW_PATH}"
