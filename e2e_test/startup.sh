#!/bin/bash

echo "Start startup.sh!"

set -e
TEST_FILE_DIRECTORY=$(dirname "$0")
cd $TEST_FILE_DIRECTORY
export MINIKUBE_DRIVER=${MINIKUBE_DRIVER:-virtualbox}
export MINIKUBE_BOOTSTRAPPER=${MINIKUBE_BOOTSTRAPPER:-localkube}
export ISTIO_HOME=${ISTIO_HOME:-istio-1.0.6}
export PATH=$ISTIO_HOME/bin:$PATH

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
        kubectl label nodes --all host=development --overwrite
        kubectl create namespace development
    else
        echo "  minikube did not start: $cluster_name"
        minikube logs
        die $LINENO "minikube did not start"
    fi
}

# Run test minikube clusters
configure_cluster rekcurd-test1
kubectl config view --flatten --minify > ${KUBE_CONFIG_PATH1:-/tmp/kube-config-path1}
export KUBE_IP1=$(minikube ip -p rekcurd-test1)


# Setup Istio
kubectl apply -f $ISTIO_HOME/install/kubernetes/helm/istio/templates/crds.yaml
helm template $ISTIO_HOME/install/kubernetes/helm/istio --name istio --namespace istio-system --set gateways.istio-ingressgateway.type=NodePort --set gateways.istio-egressgateway.type=NodePort > $HOME/istio.yaml
kubectl create namespace istio-system
kubectl apply -f $HOME/istio.yaml
kubectl label namespace development istio-injection=enabled
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: ServiceEntry
metadata:
  name: rekcurd-egress-service-entry
spec:
  hosts:
  - "*.local"
  - "*.com"
  - "*.jp"
  - "*.org"
  - "*.net"
  - "*.io"
  - "*.edu"
  - "*.me"
  ports:
  - number: 80
    name: http
    protocol: HTTP
  - number: 443
    name: https
    protocol: HTTPS
  - number: 20306
    name: tcp
    protocol: TCP
  resolution: NONE
  location: MESH_EXTERNAL
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: rekcurd-egress-virtual-service
spec:
  hosts:
  - "*.local"
  - "*.com"
  - "*.jp"
  - "*.org"
  - "*.net"
  - "*.io"
  - "*.edu"
  - "*.me"
  tls:
  - match:
    - port: 443
      sni_hosts:
      - "*.local"
    route:
    - destination:
        host: "*.local"
        port:
          number: 443
      weight: 100
  - match:
    - port: 443
      sni_hosts:
      - "*.com"
    route:
    - destination:
        host: "*.com"
        port:
          number: 443
      weight: 100
  - match:
    - port: 443
      sni_hosts:
      - "*.jp"
    route:
    - destination:
        host: "*.jp"
        port:
          number: 443
      weight: 100
  - match:
    - port: 443
      sni_hosts:
      - "*.org"
    route:
    - destination:
        host: "*.org"
        port:
          number: 443
      weight: 100
  - match:
    - port: 443
      sni_hosts:
      - "*.net"
    route:
    - destination:
        host: "*.net"
        port:
          number: 443
      weight: 100
  - match:
    - port: 443
      sni_hosts:
      - "*.io"
    route:
    - destination:
        host: "*.io"
        port:
          number: 443
      weight: 100
  - match:
    - port: 443
      sni_hosts:
      - "*.edu"
    route:
    - destination:
        host: "*.edu"
        port:
          number: 443
      weight: 100
  - match:
    - port: 443
      sni_hosts:
      - "*.me"
    route:
    - destination:
        host: "*.me"
        port:
          number: 443
      weight: 100
---
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: rekcurd-ingress-gateway
  namespace: development
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "*"
EOF


# Done
echo "Finish startup.sh!"
