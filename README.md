# Rekcurd-dashboard

[![Build Status](https://travis-ci.com/rekcurd/drucker-dashboard.svg?branch=master)](https://travis-ci.com/rekcurd/drucker-dashboard)
[![PyPI version](https://badge.fury.io/py/rekcurd-dashboard.svg)](https://badge.fury.io/py/rekcurd-dashboard)
[![codecov](https://codecov.io/gh/rekcurd/drucker-dashboard/branch/master/graph/badge.svg)](https://codecov.io/gh/rekcurd/drucker-dashboard "Non-generated packages only")
[![pypi supported versions](https://img.shields.io/pypi/pyversions/rekcurd-dashboard.svg)](https://pypi.python.org/pypi/rekcurd-dashboard)

Rekcurd dashboard is the project for managing ML model and deploying ML module. Any Rekcurd service is manageable. It can deploy the Rekcurd service to Kubernetes cluster.


## Parent Project
https://github.com/rekcurd/drucker-parent


## Components
- [Rekcurd](https://github.com/rekcurd/drucker): Project for serving ML module.
- [Rekcurd-dashboard](https://github.com/rekcurd/drucker-dashboard) (here): Project for managing ML model and deploying ML module.
- [Rekcurd-client](https://github.com/rekcurd/drucker-client): Project for integrating ML module. 


## Environment
- Python 3.6
- flask 1.0.x
- [Node.js](https://nodejs.org/) 8.x
- [yarn](https://yarnpkg.com/)


## Installation
From source:

```bash
$ git clone --recursive https://github.com/rekcurd/drucker-dashboard.git
$ cd drucker-dashboard/frontend
$ yarn install && yarn run build && cd ..
$ pip install -e .
```

From PyPi directly:

```bash
$ pip install rekcurd-dashboard
```


## How to boot
### Preparation
You need to create [`settings.yml`](./drucker_dashboard/settings.yml).

### General users
Launched on `http://0.0.0.0:18080` as a default.

#### command line
```bash
$ rekcurdui --settings settings.yml db init
$ rekcurdui --settings settings.yml db migrate
$ rekcurdui --settings settings.yml server
```

#### docker-compose (Deprecated)
```bash
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

```bash
# For dev
$ docker-compose -f docker-compose/aws/docker-compose.develop.yaml up
# For prod
$ docker-compose -f docker-compose/aws/docker-compose.production.yaml up
```


## How to use
See [docs](./docs/README.md).


## Unittest
### Prerequisites
```bash
$ pip install -r requirements.txt
$ pip install -r test-requirements.txt
```

If you don't have VirtualBox, run it.
```bash
$ sudo yum install -y kernel-devel kernel-headers make patch gcc
$ sudo wget https://download.virtualbox.org/virtualbox/rpm/el/virtualbox.repo -P /etc/yum.repos.d
$ sudo yum install -y VirtualBox-5.2
```

### Test
```bash
$ sudo sh drucker_dashboard/e2e_test/startup.sh
$ python -m unittest
$ sudo sh drucker_dashboard/e2e_test/cleanup.sh
```


## Kubernetes support
Rekcurd can be run on Kubernetes. See [here](https://github.com/rekcurd/drucker-parent).
