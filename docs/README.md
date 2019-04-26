# How to use
After booting Rekcurd dashboard, you can manage your [Rekcurd](https://github.com/rekcurd/rekcurd-python) service using dashboard. If you have a Kubernetes, you can deploy your service to Kubernetes via dashboard.


## Top
<img src="./img/projects-top.png" width="480">

Dashboard provides project-based management functionality. You can assign an access permission to users. If user doesn't have a project permission, user cannot access the contents of that project.


## Project
Project has 4 UIs; [Applications](#applications), [Kubernetes](#kubernetes), [Data Servers](#data-servers) and [Admin](#project-admin).

### Applications
<img src="./img/project-applications.png" width="480">

Application is the management unit of Machine Learning service. See [here](#application) in details.

### Kubernetes
<img src="./img/project-kubernetes.png" width="480">

This UI is for managing Kubernetes clusters. If you want to use Kubernetes as backend, you need to register your Kubernetes cluster here. When you deploy your ML service by dashboard, dashboard deploys every Kubernetes cluster you registered automatically.

##### Add/Edit Kubernetes
<img src="./img/project-kubernetes-edit.png" width="480">

This UI is for adding/editing Kubernetes cluster information. You need to upload your `kubeconfig` file to access your Kubernetes cluster. `Exposed Host` is the access point of your Kubernetes cluster. `Exposed Port` is the port number which Istio specify, and default port number is `31380`.

### Data Servers
<img src="./img/project-dataservers.png" width="480">

Data Server handles data (ML models and QA data) to upload/download them to the storage. `Local` mode uses local storage of your ML service. `Ceph S3` and `AWS S3` mode uses online storage through WebAPI. We recommend to use online storage (`Ceph S3` and `AWS S3`) for production-grade service.

### Project Admin
<img src="./img/project-admin.png" width="480">

This UI is for managing a project access control. Users who have `admin` or `member` permission can access the project. Project admin is automatically set to the user who creates. Default permission is `nothing` and nobody can access the project except `admin`.


## Application
Application has 5 UIs; [Dashboard](#dashboard), [Services](#services), [Models](#models), [Routing](#routing) and [Admin](#application-admin).

### Dashboard
<img src="./img/application-dashboard.png" width="480">

Dashboard manages all ML services. You can find which model is used on ML services. If you check the box, you can delete your ML services and models.

##### Switch Models
<img src="./img/application-dashboard-switch.png" width="480">

"Switch Models" provides model switching functionality. You can switch models of ML service. If you use Kubernetes as backend, rolling-deployment is performed by dashboard.

### Services
<img src="./img/application-services.png" width="480">

This UI is the list of your ML services. You can delete ML service by checking the box.

##### Add/Edit Service
<img src="./img/application-services-add.png" width="480">

You can register your new ML service by "Add Service" button. If you use Kubernetes as backend, dashboard deploys it to Kubernetes. You can refer the parameters below.

|Category |Field |Description |
|:---|:---|:---|
|Basic Info |Display Name* |Display name. |
| |Description |Description. |
|Service Configuration |Service Level* |Service level of your service. |
| |Rekcurd gRPC version* |Rekcurd gRPC version. |
| |Insecure Host* |Address accepted on your service. Default is all ('[::]'). |
| |Insecure Port* |Port number accepted on your service. Default is '5000'. |
| |Model Assignment* |Model assignment of this service. |
|Container Image / Source Code |Container Image* |Image location of Docker registry. |
| |Git URL |Git URL of your Rekcurd service. Your code will be downloaded when a container boots IF YOU USE Rekcurd's official docker image (e.g. 'rekcurd/rekcurd:python-latest'). |
| |Git Branch Name |Git Branch name of your Rekcurd service (e.g. 'master'). |
| |Booting Shell Script |Script file name for booting (e.g. 'start.sh'). |
|Resource Requirement |CPU Request* |CPU resource which your service need. |
| |Memory Request* |Memory resource which your service need. |
| |CPU Limit |Maximum CPU resource which your service need. Default is the same volume of 'CPU Request'. |
| |Memory Limit |Maximum Memory resource which your service need. Default is the same volume of 'Memory Request'. |
|HA Configuration |Default Replicas* |Number of service. If '3', '3' services are booted. |
| |Maximum Replicas |Maximum number of service. Automatically scaled up to this number. Default is the same as 'Default'. |
| |Minimum Replicas |Minimum number of service. Automatically scaled up to this number. Default is the same as 'Default'. |
| |Auto-scalling Trigger (CPU Threshold) |CPU threshold for auto-scaling trigger. Default is '80'% of CPU usage. |
|Deployment Strategy |Max Surge |Maximum number of surged pod when rolling deploying. Default is 'ceil(0.25 * <Default Replicas>)'. |
| |Max Unavailable |Maximum number of unavailable pod when rolling deploying. Default is 'floor(0.25 * <Default Replicas>)'. |
| |Wait Secondss |Minimum wait seconds for booting your service. Recommendation is 'actual booting time' + 'margin'. Default is '300' seconds. |

*Required

### Models
<img src="./img/application-models.png" width="480">

This UI is the list of your models. You can delete model by checking the box.

##### Add/Edit Model
<img src="./img/application-models-add.png" width="480">

You can register your new model by "Add Model" button. Write the description of your model on `Description` field.

### Routing
<img src="./img/application-routing.png" width="480">

This UI is for managing traffic control. You can manage your traffic on service level basis. You can make an AB testing by this functionality.

##### Edit Routing
<img src="./img/application-routing-edit.png" width="480">

You can change the traffic weight by this UI. Value must be integer, and summation of values must be 100.

### Application Admin
This UI is for managing an application access control. Users who have `admin` or `editor` permission can edit the application. Application admin is automatically set to the user who creates. Default permission is `viewer` and everybody can access the application.
