# Drucker-dashboard
Drucker is a framework of serving machine learning module. Drucker makes it easy to serve, manage and integrate your ML models into your existing services. Moreover, Drucker can be used on Kubernetes.

## Parent Project
https://github.com/drucker/drucker-parent

## Components
- [Drucker](https://github.com/drucker/drucker): Serving framework for a machine learning module.
- [Drucker-dashboard](https://github.com/drucker/drucker-dashboard) (here): Management web service for the machine learning models to the drucker service.
- [Drucker-client](https://github.com/drucker/drucker-client): SDK for accessing a drucker service.
- [Drucker-example](https://github.com/drucker/drucker-example): Example of how to use drucker.

## Components
- [Backend](./app)
- [Frontend](./frontend)

## Environment
- Python 3.6
- flask 1.0.x
- [Node.js](https://nodejs.org/) 8.x
- [yarn](https://yarnpkg.com/)

## Download
```
$ git clone https://github.com/drucker/drucker-dashboard.git drucker-dashboard
```

## Run it!
### For non-AWS users

```
# For dev
$ docker-compose -f docker-compose/docker-compose.develop.yaml up
# For prod
$ docker-compose -f docker-compose/docker-compose.production.yaml up
```

### For AWS users
If you run Drucker on Kubernetes on AWS (such as EKS), you need to configure aws-cli setting.  
Follow the [official document](https://docs.aws.amazon.com/streams/latest/dev/kinesis-tutorial-cli-installation.html).  

**Drucker-Dashboard docker container will mount the configuration files,  
so the IAM account used by configuration needs to have enogh permissions to access to Kubernetes resources on AWS.**

```
# For dev
$ docker-compose -f docker-compose/aws/docker-compose.develop.yaml up
# For prod
$ docker-compose -f docker-compose/aws/docker-compose.production.yaml up
```



## Drucker on Kubernetes
You must read followings.
1. https://github.com/drucker/drucker-parent/tree/master/docs/Installation.md
