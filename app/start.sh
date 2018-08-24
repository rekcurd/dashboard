#!/usr/bin/env bash

ECHO_PREFIX="[drucker-dashboard]: "

set -e
set -u

echo "$ECHO_PREFIX Start.."

echo "$ECHO_PREFIX   Start installing libraries"
pip install -r requirements.txt
pip install -r ./drucker-grpc-proto/requirements.txt
sh ./drucker-grpc-proto/run_codegen.sh
echo "$ECHO_PREFIX   End installing libraries"

echo "$ECHO_PREFIX   Start DB migration"
python manage.py db init || true
python manage.py db migrate || true
if [ $# -ne 0 ]; then
  case $1 in
    "upgrade")
      echo "$ECHO_PREFIX     Start DB migration upgrade"
      python manage.py db upgrade || true
      echo "$ECHO_PREFIX     End DB migration upgrade"
      ;;
    *)
      echo "$ECHO_PREFIX     Invalid option: $1"
      ;;
  esac
fi
echo "$ECHO_PREFIX   End DB migration"

echo "$ECHO_PREFIX   Start Drucker dashboard service"
python app.py