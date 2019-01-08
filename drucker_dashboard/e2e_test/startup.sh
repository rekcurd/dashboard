#!/bin/bash

set -e
TEST_FILE_DIRECTORY=$(dirname "$0")
cd $TEST_FILE_DIRECTORY

configure_cluster () {
    cluster_name=$1
    timeout=60
    ready=false
    echo "Start to configure $cluster_name"
    minikube start -p $cluster_name --kubernetes-version v1.9.4

    MINIKUBE_OK="false"
    echo "Waiting for minikube to start..."
    # this for loop waits until kubectl can access the api server that Minikube has created
    for i in {1..90}; do # timeout for 3 minutes
       kubectl get po &> /dev/null
       if [ $? -ne 1 ]; then
          MINIKUBE_OK="true"
          break
       fi
       sleep 2
    done

    # Shut down CI if minikube did not start and show logs
    if [ $MINIKUBE_OK == "false" ]; then
        echo "  minikube did not start"
        sudo minikube logs
        die $LINENO "minikube did not start"
    else
        echo "  minikube start successfully"
        minikube addons enable ingress -p $cluster_name
        kubectl label nodes $cluster_name host=development --overwrite
        kubectl create namespace development
    fi
}

# Run test minikube clusters
configure_cluster drucker-test1
kubectl config view --flatten --minify > ${KUBE_CONFIG_PATH1:-/tmp/kube-config-path1}
export KUBE_IP1=$(minikube ip -p drucker-test1)

configure_cluster drucker-test2
kubectl config view --flatten --minify > ${KUBE_CONFIG_PATH2:-/tmp/kube-config-path2}
export KUBE_IP2=$(minikube ip -p drucker-test2)


# Generate test models
python generate_constant_model.py
