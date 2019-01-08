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
    while [ $timeout -gt 0 ];
    do
        # The first kubectl check API server is ready
        # The second one check minikube node is ready
        if [[ ( $(kubectl get nodes) ) && ( -z "$(kubectl get nodes | grep " Ready ")" ) ]]
        then
            ready=true
            break
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    if [ ready ];
    then
        minikube addons enable ingress -p $cluster_name
        kubectl label nodes $cluster_name host=development --overwrite
        kubectl create namespace development
    else
        echo "The cluster fails to start. Please check the log of minikube."
        exit 1
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
