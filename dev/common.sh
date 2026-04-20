#!/bin/sh

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "${SCRIPT_DIR}/.." && pwd)"

resolve_project_dir() {
    : "${PROJECT_DIR:?Set PROJECT_DIR in dev/dev.env.}"

    case "${PROJECT_DIR}" in
        /*) PROJECT_DIR_ABS="${PROJECT_DIR}" ;;
        *) PROJECT_DIR_ABS="${REPO_ROOT}/${PROJECT_DIR}" ;;
    esac

    if [ ! -d "${PROJECT_DIR_ABS}" ]; then
        echo "Project directory not found: ${PROJECT_DIR_ABS}" >&2
        exit 1
    fi

    if [ ! -f "${PROJECT_DIR_ABS}/app.py" ]; then
        echo "Missing app.py in project directory: ${PROJECT_DIR_ABS}" >&2
        exit 1
    fi
}

set_dev_defaults() {
    export PYTHONUNBUFFERED="${PYTHONUNBUFFERED:-1}"
    export COVFEE_HOST="${COVFEE_HOST:-localhost}"
    export COVFEE_PORT="${COVFEE_PORT:-5001}"
    export COVFEE_BIND_HOST="${COVFEE_BIND_HOST:-0.0.0.0}"
    export COVFEE_BIND_PORT="${COVFEE_BIND_PORT:-${COVFEE_PORT}}"
    export COVFEE_REDUX_STORE_HOST="${COVFEE_REDUX_STORE_HOST:-127.0.0.1}"
    export COVFEE_REDUX_STORE_PORT="${COVFEE_REDUX_STORE_PORT:-5555}"
    export COVFEE_WWW_SERVER_HOST="${COVFEE_WWW_SERVER_HOST:-127.0.0.1}"
    export COVFEE_WWW_SERVER_PORT="${COVFEE_WWW_SERVER_PORT:-8000}"
    export COVFEE_PROJECT_WWW_PATH="${COVFEE_PROJECT_WWW_PATH:-${PROJECT_DIR_ABS}/www}"
    export COVFEE_PROJECT_WWW_URL="${COVFEE_PROJECT_WWW_URL:-http://${COVFEE_WWW_SERVER_HOST}:${COVFEE_WWW_SERVER_PORT}}"
}
