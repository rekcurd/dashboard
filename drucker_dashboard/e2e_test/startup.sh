#!/bin/bash

echo "Start startup.sh!"

set -e
TEST_FILE_DIRECTORY=$(dirname "$0")
cd $TEST_FILE_DIRECTORY
export MINIKUBE_DRIVER=${MINIKUBE_DRIVER:-virtualbox}
export MINIKUBE_BOOTSTRAPPER=${MINIKUBE_BOOTSTRAPPER:-localkube}

configure_cluster () {
    cluster_name=$1
    timeout=60
    ready=false
    echo "Start to configure $cluster_name"
    minikube start --vm-driver $MINIKUBE_DRIVER -p $cluster_name --kubernetes-version v1.9.4 --bootstrapper $MINIKUBE_BOOTSTRAPPER --logtostderr

    MINIKUBE_OK=false
    echo "Waiting for minikube to start..."
    # this for loop waits until kubectl can access the api server that Minikube has created
    for i in {1..90}; do # timeout for 3 minutes
        if [[ ( $(kubectl get nodes) ) && ( -z "$(kubectl get nodes | grep " Ready ")" ) ]]; then
            MINIKUBE_OK=true
            break
        fi
        sleep 2
    done

    # Shut down CI if minikube did not start and show logs
    if [ MINIKUBE_OK ]; then
        echo "  minikube start successfully: $cluster_name"
        echo "  Dump Kubernetes Objects..."
        kubectl get componentstatuses
        kubectl get configmaps
        kubectl get daemonsets
        kubectl get deployments
        kubectl get events
        kubectl get endpoints
        kubectl get horizontalpodautoscalers
        kubectl get ingress
        kubectl get jobs
        kubectl get limitranges
        kubectl get nodes
        kubectl get namespaces
        kubectl get pods
        kubectl get persistentvolumes
        kubectl get persistentvolumeclaims
        kubectl get quota
        kubectl get resourcequotas
        kubectl get replicasets
        kubectl get replicationcontrollers
        kubectl get secrets
        kubectl get serviceaccounts
        kubectl get services
        minikube addons enable ingress -p $cluster_name
        kubectl label nodes --all host=development --overwrite
        kubectl create namespace development
    else
        echo "  minikube did not start: $cluster_name"
        minikube logs
        die $LINENO "minikube did not start"
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
echo "Generating ML model..."
python generate_constant_model.py


# Done
echo "Finish startup.sh!"
