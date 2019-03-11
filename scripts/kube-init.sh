#!/bin/bash

set -x
CDIR=$PWD

function clean_exit(){
    local error_code="$?"
    local spawned=$(jobs -p)
    if [ -n "$spawned" ]; then
        sudo kill $(jobs -p)
    fi
    return $error_code
}

trap "clean_exit" EXIT

# Switch off SE-Linux
setenforce 0

# Mount root to fix dns issues
# Define $HOME since somehow this is not defined
HOME=/home/travis
sudo mount --make-rshared /

# Install docker if needed
path_to_executable=$(which docker)
if [ -x "$path_to_executable" ] ; then
    echo "Found Docker installation"
else
    curl -sSL https://get.docker.io | sudo bash
fi
docker --version

# Get the latest stable version of kubernetes
K8S_VERSION=$(curl -sS https://storage.googleapis.com/kubernetes-release/release/stable.txt)
echo "K8S_VERSION : ${K8S_VERSION}"

echo "Starting docker service"
sudo systemctl enable docker.service
sudo systemctl start docker.service --ignore-dependencies
echo "Checking docker service"
sudo docker ps

echo "Download Kubernetes CLI"
wget -O kubectl "http://storage.googleapis.com/kubernetes-release/release/${K8S_VERSION}/bin/linux/amd64/kubectl"
sudo chmod +x kubectl
sudo mv kubectl /usr/local/bin/

echo "Download minikube from minikube project"
wget -O minikube "https://storage.googleapis.com/minikube/releases/v0.30.0/minikube-linux-amd64"
sudo chmod +x minikube
sudo mv minikube /usr/local/bin/

echo "Download helm"
wget "https://storage.googleapis.com/kubernetes-helm/helm-v2.13.0-linux-amd64.tar.gz"
sudo tar -zxvf helm-v2.13.0-linux-amd64.tar.gz
sudo chmod +x linux-amd64/helm
sudo mv linux-amd64/helm /usr/local/bin/

echo "Download Istio"
wget "https://github.com/istio/istio/releases/download/1.0.6/istio-1.0.6-linux.tar.gz"
sudo tar -zxvf istio-1.0.6-linux.tar.gz
export ISTIO_HOME=$PWD/istio-1.0.6

# L68-100: Set up minikube within Travis CI
# See https://github.com/kubernetes/minikube/blob/master/README.md#linux-continuous-integration-without-vm-support
echo "Set up minikube"
export MINIKUBE_WANTUPDATENOTIFICATION=false
export MINIKUBE_WANTREPORTERRORPROMPT=false
export CHANGE_MINIKUBE_NONE_USER=true
sudo mkdir -p $HOME/.kube
sudo mkdir -p $HOME/.minikube
sudo touch $HOME/.kube/config
export KUBECONFIG=$HOME/.kube/config
export MINIKUBE_HOME=$HOME
export MINIKUBE_DRIVER=${MINIKUBE_DRIVER:-none}
export MINIKUBE_BOOTSTRAPPER=${MINIKUBE_BOOTSTRAPPER:-kubeadm}

echo "Starting minikube"
TEST_FILE_DIRECTORY=$(dirname "$0")
cd $TEST_FILE_DIRECTORY
sudo ../e2e_test/startup.sh

echo "Running tests..."
cd $CDIR
set -x -e
# Yield execution to venv command
$*
