#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "${SCRIPT_DIR}/.." && pwd)"

python -m pip install honcho

cd "${REPO_ROOT}/covfee/shared"
npm install

cd "${REPO_ROOT}/store"
npm install

cd "${REPO_ROOT}/covfee/client"
npm install
