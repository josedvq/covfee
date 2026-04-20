#!/bin/sh
set -eu

. "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/common.sh"

resolve_project_dir
set_dev_defaults

cd "${REPO_ROOT}/store"

if [ "${COVFEE_STORE_WATCH:-true}" = "true" ] || [ "${COVFEE_STORE_WATCH:-true}" = "1" ]; then
    exec npx nodemon \
        --watch reduxStore.ts \
        --watch types.ts \
        --watch ../covfee/client/tasks \
        --ext ts,tsx,js \
        --exec "npx ts-node reduxStore.ts ${COVFEE_REDUX_STORE_PORT}"
fi

exec npx ts-node reduxStore.ts "${COVFEE_REDUX_STORE_PORT}"
