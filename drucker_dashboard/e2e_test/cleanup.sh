#!/usr/bin/env bash

echo "Start cleanup.sh!"

# Delete clusters
TEST_FILE_DIRECTORY=$(dirname "$0")

minikube delete -p drucker-test1
minikube delete -p drucker-test2

rm -f ${KUBE_CONFIG_PATH1:-/tmp/kube-config-path1}
rm -f ${KUBE_CONFIG_PATH1:-/tmp/kube-config-path2}
rm -f ${TEST_FILE_DIRECTORY}/db.test.sqlite3


# Done
echo "Finish cleanup.sh!"
