# Rekcurd-dashboard
Rekcurd dashboard is the project for managing ML model and deploying ML module. Any Rekcurd service is manageable. It can deploy the Rekcurd service to Kubernetes cluster.


## Parent Project
https://github.com/rekcurd/drucker-parent


## Components
- [Rekcurd](https://github.com/rekcurd/drucker): Project for serving ML module.
- [Rekcurd-dashboard](https://github.com/rekcurd/drucker-dashboard) (here): Project for managing ML model and deploying ML module.
- [Rekcurd-client](https://github.com/rekcurd/drucker-client): Project for integrating ML module. 


## Architecture
- [Backend](./app)
- [Frontend](./frontend)


## Environment
- Python 3.6
- flask 1.0.x
- [Node.js](https://nodejs.org/) 8.x
- [yarn](https://yarnpkg.com/)


## Download
```
$ git clone https://github.com/rekcurd/drucker-dashboard.git drucker-dashboard
```


## Run it!
### General users
```
# For dev
$ docker-compose -f docker-compose/docker-compose.develop.yaml up
# For prod
$ docker-compose -f docker-compose/docker-compose.production.yaml up
```

### For AWS users
If you run this on AWS (such as EKS), you need to configure aws-cli setting.  
Follow the [official document](https://docs.aws.amazon.com/streams/latest/dev/kinesis-tutorial-cli-installation.html).  

**Rekcurd-dashboard docker container will mount the configuration files,  
so the IAM account used by configuration needs to have enough permissions to access to Kubernetes resources on AWS.**

```
# For dev
$ docker-compose -f docker-compose/aws/docker-compose.develop.yaml up
# For prod
$ docker-compose -f docker-compose/aws/docker-compose.production.yaml up
```


## How to use
See [docs](./docs/README.md).


## Unittest
```
$ python -m unittest
```

## Kubernetes support
Rekcurd can be run on Kubernetes. See [here](https://github.com/rekcurd/drucker-parent).
