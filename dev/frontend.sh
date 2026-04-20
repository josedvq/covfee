#!/bin/sh
set -eu

. "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/common.sh"

resolve_project_dir
set_dev_defaults

cd "${REPO_ROOT}/covfee/client"
exec npx webpack serve --config ./webpack.dev.js --host "${COVFEE_WEBPACK_DEVSERVER_HOST:-localhost}"
