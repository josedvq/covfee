#!/bin/sh
set -eu

. "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/common.sh"

resolve_project_dir
set_dev_defaults

set -- covfee start "${PROJECT_DIR_ABS}" --dev --host "${COVFEE_BIND_HOST}" --port "${COVFEE_BIND_PORT}"

if [ "${COVFEE_DEV_SAFE:-false}" = "true" ] || [ "${COVFEE_DEV_SAFE:-false}" = "1" ]; then
    set -- "$@" --safe
fi

exec "$@"
