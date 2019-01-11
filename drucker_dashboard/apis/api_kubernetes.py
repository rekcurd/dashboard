import os, uuid, shutil, json, pathlib
from datetime import datetime, timedelta

from flask_restplus import Namespace, fields, Resource, reqparse

from werkzeug.datastructures import FileStorage

from . import api, DatetimeToTimestamp, kubernetes_cpu_to_float
from drucker_dashboard import DruckerDashboardClient
from drucker_dashboard.models import db, Kubernetes, Application, Service, Model


kube_info_namespace = Namespace('kubernetes', description='Kubernetes Endpoint.')
success_or_not = kube_info_namespace.model('Success', {
    'status': fields.Boolean(
        required=True
    ),
    'message': fields.String(
        required=True
    )
})
kube_info = kube_info_namespace.model('Kubernetes', {
    'kubernetes_id': fields.Integer(
        readOnly=True,
        description='Kubernetes cluster ID.'
    ),
    'config_path': fields.String(
        readOnly=True,
        description='Kubernetes configuration file path.',
        example='/kube-config/kube-1.config'
    ),
    'dns_name': fields.String(
        readOnly=False,
        description='DNS name.',
        example='example.com'
    ),
    'display_name': fields.String(
        required=False,
        description='DisplayName.',
        example='cluster-1'
    ),
    'host_model_dir': fields.String(
        required=True,
        description='Directry of host node for ML models. Recommend that mount cloud storage (e.g. AWS EBS, GCP GCS) on <host_model_dir>.',
        example='/mnt/drucker-model'
    ),
    'pod_model_dir': fields.String(
        required=True,
        description='Directry of pod for ML models. Link to <host_model_dir>.',
        example='/mnt/drucker-model'
    ),
    'db_mysql_host': fields.String(
        required=True,
        description='mysql host DNS/IP.',
        example='127.0.0.1'
    ),
    'db_mysql_port': fields.String(
        required=True,
        description='mysql port.',
        example='2306'
    ),
    'db_mysql_dbname': fields.String(
        required=True,
        description='mysql DB name.',
        example='drucker'
    ),
    'db_mysql_user': fields.String(
        required=True,
        description='mysql user.',
        example='drucker'
    ),
    'db_mysql_password': fields.String(
        required=True,
        description='mysql password.',
        example='drucker'
    ),
    'register_date': DatetimeToTimestamp(
        readOnly=True,
        description='Register date.'
    ),
    'description': fields.String(
        required=False,
        description='Description.',
        example='This is a sample.'
    )
})
kube_service_config_info = kube_info_namespace.model('Kubernetes service configurations', {
    'app_name': fields.String(
        required=True,
        description='Application name.',
        example='drucker-sample',
        max_length=20
    ),
    'service_level': fields.String(
        required=True,
        description='Service level. Choose from [development/beta/staging/sandbox/production].',
        example='development'
    ),
    'service_name': fields.String(
        readOnly=True,
        description='Service tag.',
        example='dev-123456789',
        max_length=20
    ),
    'service_port': fields.Integer(
        required=True,
        description='Service port.',
        example=5000
    ),
    'replicas_default': fields.Integer(
        required=True,
        description='Number of first replica.',
        example=1
    ),
    'replicas_minimum': fields.Integer(
        required=True,
        description='Minimum number of replica for auto-scaling.',
        example=1
    ),
    'replicas_maximum': fields.Integer(
        required=True,
        description='Maximum number of replica for auto-scaling.',
        example=1
    ),
    'autoscale_cpu_threshold': fields.Integer(
        required=True,
        description='CPU usage threshold for auto-scaling.',
        example=80
    ),
    'policy_max_surge': fields.Integer(
        required=True,
        description='Maximum number of serged pod when updating. Recommendation is "ceil(0.25 * <replicas_default>)".',
        example=1
    ),
    'policy_max_unavailable': fields.Integer(
        required=True,
        description='Maximum number of unavailable pod when updating. Recommendation is "floor(0.25 * <replicas_default>)".',
        example=0
    ),
    'policy_wait_seconds': fields.Integer(
        required=True,
        description='Minimum wait seconds when updating. Recommendation is "actual boot time + alpha [second]".',
        example=300
    ),
    'container_image': fields.String(
        required=True,
        description='Image location of Docker registry.',
        example='centos:centos7'
    ),
    'resource_request_cpu': fields.Float(
        required=True,
        description='CPU request for boot.',
        example=1.0
    ),
    'resource_request_memory': fields.String(
        required=True,
        description='Memory request for boot.',
        example='128Mi'
    ),
    'resource_limit_cpu': fields.Float(
        required=True,
        description='CPU limit for boot.',
        example=1.0
    ),
    'resource_limit_memory': fields.String(
        required=True,
        description='Memory limit for boot.',
        example='128Mi'
    ),
    'commit_message': fields.String(
        required=False,
        description='Commit message.',
        example='Initial deployment.'
    ),
    'service_git_url': fields.String(
        required=True,
        description='Git repository.',
        example='git@github.com:drucker/drucker-example.git'
    ),
    'service_git_branch': fields.String(
        required=True,
        description='Git branch.',
        example='master'
    ),
    'service_boot_script': fields.String(
        required=True,
        description='Boot shellscript for your service.',
        example='start.sh'
    ),
    'host_model_dir': fields.String(
        required=True,
        description='Directry of host node for ML models. Recommend that mount cloud storage (e.g. AWS EBS, GCP GCS) on <host_model_dir>.',
        example='/mnt/drucker-model'
    ),
    'pod_model_dir': fields.String(
        required=True,
        description='Directry of pod for ML models. Link to <host_model_dir>.',
        example='/mnt/drucker-model'
    ),
    'db_mysql_host': fields.String(
        required=True,
        description='mysql host DNS/IP.',
        example='127.0.0.1'
    ),
    'db_mysql_port': fields.String(
        required=True,
        description='mysql port.',
        example='2306'
    ),
    'db_mysql_dbname': fields.String(
        required=True,
        description='mysql DB name.',
        example='drucker'
    ),
    'db_mysql_user': fields.String(
        required=True,
        description='mysql user.',
        example='drucker'
    ),
    'db_mysql_password': fields.String(
        required=True,
        description='mysql password.',
        example='drucker'
    )
})

kube_file_parser = reqparse.RequestParser()
kube_file_parser.add_argument('file', location='files', type=FileStorage, required=True, help='Kubernetes access_token configuration file.')
kube_file_parser.add_argument('dns_name', type=str, default='example.com', required=True, help='Your application could be accessed at http://<app_name>-<service_level>.<dns_name>.', location='form')
kube_file_parser.add_argument('display_name', type=str, required=False, location='form', help="Must be unique. If empty, automatically generated.")
kube_file_parser.add_argument('host_model_dir', type=str, default='/mnt/drucker-model', required=True, help='Directry of host node for ML models. Recommend that mount cloud storage (e.g. AWS EBS, GCP GCS) on <host_model_dir>.', location='form')
kube_file_parser.add_argument('pod_model_dir', type=str, default='/mnt/drucker-model', required=True, help='Directry of pod for ML models. Link to <host_model_dir>.', location='form')
kube_file_parser.add_argument('db_mysql_host', type=str, default='127.0.0.1', required=True, help='mysql host DNS/IP.', location='form')
kube_file_parser.add_argument('db_mysql_port', type=str, default='2306', required=True, help='mysql port.', location='form')
kube_file_parser.add_argument('db_mysql_dbname', type=str, default='drucker', required=True, help='mysql DB name.', location='form')
kube_file_parser.add_argument('db_mysql_user', type=str, default='drucker', required=True, help='mysql user.', location='form')
kube_file_parser.add_argument('db_mysql_password', type=str, default='drucker', required=True, help='mysql password.', location='form')
kube_file_parser.add_argument('description', type=str, required=False, location='form', help='Description.')

kube_deploy_parser = reqparse.RequestParser()
kube_deploy_parser.add_argument('app_name', type=str, default='drucker-sample', required=True, help='Application name. This must be unique.', location='form')
kube_deploy_parser.add_argument('service_level', type=str, required=True, choices=('development','beta','staging','sandbox','production'), help='Service level. Choose from [development/beta/staging/sandbox/production].', location='form')
kube_deploy_parser.add_argument('service_port', type=int, default=5000, required=True, help='Service port.', location='form')

kube_deploy_parser.add_argument('replicas_default', type=int, default=1, required=True, help='Number of first replica.', location='form')
kube_deploy_parser.add_argument('replicas_minimum', type=int, default=1, required=True, help='Minimum number of replica for auto-scaling.', location='form')
kube_deploy_parser.add_argument('replicas_maximum', type=int, default=1, required=True, help='Maximum number of replica for auto-scaling.', location='form')
kube_deploy_parser.add_argument('autoscale_cpu_threshold', type=int, default=80, required=True, help='CPU usage threshold for auto-scaling.', location='form')

kube_deploy_parser.add_argument('policy_max_surge', type=int, default=1, required=True, help='Maximum number of serged pod when updating. Recommendation is "ceil(0.25 * <replicas_default>)".', location='form')
kube_deploy_parser.add_argument('policy_max_unavailable', type=int, default=0, required=True, help='Maximum number of unavailable pod when updating. Recommendation is "floor(0.25 * <replicas_default>)".', location='form')
kube_deploy_parser.add_argument('policy_wait_seconds', type=int, default=300, required=True, help='Minimum wait seconds when updating. Recommendation is "actual boot time + alpha [second]"', location='form')

kube_deploy_parser.add_argument('container_image', type=str, default='centos:centos7', required=True, help='Image location of Docker registry.', location='form')

kube_deploy_parser.add_argument('resource_request_cpu', type=float, default=1.0, required=True, help='CPU request for boot.', location='form')
kube_deploy_parser.add_argument('resource_request_memory', type=str, default='128Mi', required=True, help='Memory request for boot.', location='form')
kube_deploy_parser.add_argument('resource_limit_cpu', type=float, default=1.0, required=True, help='CPU limit for boot.', location='form')
kube_deploy_parser.add_argument('resource_limit_memory', type=str, default='256Mi', required=True, help='Memory limit for boot.', location='form')

kube_deploy_parser.add_argument('commit_message', type=str, default='Initial deployment.', required=False, help='Commit message.', location='form')
kube_deploy_parser.add_argument('service_git_url', type=str, default='git@github.com:drucker/drucker-sample.git', required=True, help='Git repository.', location='form')
kube_deploy_parser.add_argument('service_git_branch', type=str, default='master', required=True, help='Git branch.', location='form')
kube_deploy_parser.add_argument('service_boot_script', type=str, default='start.sh', required=True, help='Boot shellscript for your service.', location='form')

kube_deploy_parser.add_argument('service_model_assignment', type=int, required=False, help='Model assignment when service boots.', location='form')


def update_dbs_kubernetes(kubernetes_id:int, applist:set=None, description:str=None):
    """
    Update dbs of kubernetes entry.
    :param kubernetes_id:
    :return:
    """
    process_date = datetime.utcnow() - timedelta(seconds=1)
    kobj = db.session.query(Kubernetes).filter(
        Kubernetes.kubernetes_id == kubernetes_id).one_or_none()
    if kobj is None:
        raise Exception("No such kubernetes_id.")
    config_path = kobj.config_path
    from kubernetes import client, config
    config.load_kube_config(config_path)
    v1 = client.ExtensionsV1beta1Api()
    ret = v1.list_ingress_for_all_namespaces(watch=False)

    refresh_all = False
    if applist is None:
        refresh_all = True
        applist = set()
        for i in ret.items:
            labels = i.metadata.labels
            if labels is not None and labels.get("drucker-worker", "False") == "True":
                application_name = labels["app"]
                applist.add(application_name)
    """Application"""
    for application_name in applist:
        aobj = db.session.query(Application).filter(
            Application.application_name == application_name,
            Application.kubernetes_id == kubernetes_id).one_or_none()
        if aobj is None:
            aobj = Application(application_name=application_name,
                               kubernetes_id=kubernetes_id,
                               description=description)
            db.session.add(aobj)
            db.session.flush()
        else:
            aobj.confirm_date = datetime.utcnow()
            db.session.flush()
    """Service"""
    for i in ret.items:
        labels = i.metadata.labels
        if labels is None or labels.get("drucker-worker", "False") == "False":
            continue
        application_name = labels["app"]
        service_name = labels["sel"]
        service_level = i.metadata.namespace
        host = i.spec.rules[0].host
        aobj = db.session.query(Application).filter(
            Application.application_name == application_name,
            Application.kubernetes_id == kubernetes_id).one_or_none()
        if aobj.application_name not in applist:
            continue

        sobj = db.session.query(Service).filter(
            Service.service_name == service_name).one_or_none()
        if sobj is None:
            display_name = uuid.uuid4().hex
            sobj = Service(application_id=aobj.application_id,
                           service_name=service_name,
                           service_level=service_level,
                           display_name=display_name,
                           host=host,
                           description=description)
            db.session.add(sobj)
            db.session.flush()
            sobj.display_name = "{0}-{1}".format(service_level,sobj.service_id)
            db.session.flush()
        else:
            sobj.confirm_date = datetime.utcnow()
            db.session.flush()
    for application_name in applist:
        aobj = db.session.query(Application).filter(
            Application.application_name == application_name,
            Application.kubernetes_id == kubernetes_id).one_or_none()
        db.session.query(Service).filter(
            Service.confirm_date <= process_date,
            Service.application_id == aobj.application_id).delete()
        db.session.flush()
    if refresh_all:
        db.session.query(Application).filter(
            Application.confirm_date <= process_date,
            Application.kubernetes_id == kubernetes_id).delete()
        db.session.flush()


def create_or_update_drucker_on_kubernetes(
        kubernetes_id:int, args:dict, service_name:str=None):
    app_name = args['app_name']
    if len(app_name) > 20:
        raise Exception("Application Name is too long. Up to 20.")
    service_level = args['service_level']
    service_port = args['service_port']
    replicas_default = args['replicas_default']
    replicas_minimum = args['replicas_minimum']
    replicas_maximum = args['replicas_maximum']
    autoscale_cpu_threshold = args['autoscale_cpu_threshold']
    policy_max_surge = args['policy_max_surge']
    policy_max_unavailable = args['policy_max_unavailable']
    policy_wait_seconds = args['policy_wait_seconds']
    container_image = args['container_image']
    resource_request_cpu = args['resource_request_cpu']
    resource_request_memory = args['resource_request_memory']
    resource_limit_cpu = args['resource_limit_cpu']
    resource_limit_memory = args['resource_limit_memory']
    commit_message = args['commit_message']
    service_git_url = args['service_git_url']
    service_git_branch = args['service_git_branch']
    service_boot_script = args['service_boot_script']
    service_model_assignment = args['service_model_assignment']

    mode_create = False
    if service_name is None:
        mode_create = True
        service_name = "{0}-{1}-{2:%Y%m%d%H%M%S}".format(
            app_name,service_level,datetime.utcnow())
    volume_name = "host-volume"
    ssh_volume = "ssh-volume"
    ssh_dir = "/root/.ssh"
    num_retry = 5
    progress_deadline_seconds = int(num_retry*policy_wait_seconds*replicas_maximum/(policy_max_surge+policy_max_unavailable))

    kobj = db.session.query(Kubernetes).filter(
        Kubernetes.kubernetes_id == kubernetes_id).one_or_none()
    if kobj is None:
        raise Exception("No such kubernetes_id.")
    app_dns_name = kobj.dns_name
    host_model_dir = kobj.host_model_dir
    pod_model_dir = kobj.pod_model_dir
    db_mysql_host = kobj.db_mysql_host
    db_mysql_port = kobj.db_mysql_port
    db_mysql_dbname = kobj.db_mysql_dbname
    db_mysql_user = kobj.db_mysql_user
    db_mysql_password = kobj.db_mysql_password
    config_path = kobj.config_path
    from kubernetes import client, config
    config.load_kube_config(config_path)

    pod_env = [
        client.V1EnvVar(
            name="DRUCKER_SERVICE_UPDATE_FLAG",
            value=commit_message
        ),
        client.V1EnvVar(
            name="DRUCKER_TEST_MODE",
            value="False"
        ),
        client.V1EnvVar(
            name="DRUCKER_APPLICATION_NAME",
            value=app_name
        ),
        client.V1EnvVar(
            name="DRUCKER_SERVICE_LEVEL",
            value=service_level
        ),
        client.V1EnvVar(
            name="DRUCKER_SERVICE_NAME",
            value=service_name
        ),
        client.V1EnvVar(
            name="DRUCKER_SERVICE_PORT",
            value="{0}".format(service_port)
        ),
        client.V1EnvVar(
            name="DRUCKER_SERVICE_INFRA",
            value="kubernetes"
        ),
        client.V1EnvVar(
            name="DRUCKER_SERVICE_GIT_URL",
            value=service_git_url
        ),
        client.V1EnvVar(
            name="DRUCKER_SERVICE_GIT_BRANCH",
            value=service_git_branch
        ),
        client.V1EnvVar(
            name="DRUCKER_SERVICE_BOOT_SHELL",
            value=service_boot_script
        ),
        client.V1EnvVar(
            name="DRUCKER_SERVICE_MODEL_DIR",
            value=pod_model_dir
        ),
        client.V1EnvVar(
            name="DRUCKER_DB_MODE",
            value="mysql"
        ),
        client.V1EnvVar(
            name="DRUCKER_DB_MYSQL_HOST",
            value=db_mysql_host
        ),
        client.V1EnvVar(
            name="DRUCKER_DB_MYSQL_PORT",
            value=db_mysql_port
        ),
        client.V1EnvVar(
            name="DRUCKER_DB_MYSQL_DBNAME",
            value=db_mysql_dbname
        ),
        client.V1EnvVar(
            name="DRUCKER_DB_MYSQL_USER",
            value=db_mysql_user
        ),
        client.V1EnvVar(
            name="DRUCKER_DB_MYSQL_PASSWORD",
            value=db_mysql_password
        ),
    ]
    if service_model_assignment is not None:
        mobj = Model.query.filter_by(
            model_id=service_model_assignment).one()
        pod_env.append(
            client.V1EnvVar(
                name="DRUCKER_SERVICE_MODEL_FILE",
                value=mobj.model_path
            )
        )

    """Namespace"""
    core_vi = client.CoreV1Api()
    try:
        api_response = core_vi.read_namespace(name=service_level)
    except:
        v1_namespace = client.V1Namespace(
            api_version="v1",
            kind="Namespace",
            metadata=client.V1ObjectMeta(
                name=service_level
            )
        )
        api_response = core_vi.create_namespace(
            body=v1_namespace
        )
    """Deployment"""
    v1_deployment = client.V1Deployment(
        api_version="apps/v1",
        kind="Deployment",
        metadata=client.V1ObjectMeta(
            name="{0}-deployment".format(service_name),
            namespace=service_level,
            labels={"drucker-worker": "True", "app": app_name, "sel": service_name}
        ),
        spec=client.V1DeploymentSpec(
            min_ready_seconds=policy_wait_seconds,
            progress_deadline_seconds=progress_deadline_seconds,
            replicas=replicas_default,
            revision_history_limit=3,
            selector=client.V1LabelSelector(
                match_labels={"sel": service_name}
            ),
            strategy=client.V1DeploymentStrategy(
                type="RollingUpdate",
                rolling_update=client.V1RollingUpdateDeployment(
                    max_surge=policy_max_surge,
                    max_unavailable=policy_max_unavailable)
            ),
            template=client.V1PodTemplateSpec(
                metadata=client.V1ObjectMeta(
                    labels={"drucker-worker": "True", "app": app_name, "sel": service_name}
                ),
                spec=client.V1PodSpec(
                    affinity=client.V1Affinity(
                        pod_anti_affinity=client.V1PodAntiAffinity(
                            preferred_during_scheduling_ignored_during_execution=[
                                client.V1WeightedPodAffinityTerm(
                                    pod_affinity_term=client.V1PodAffinityTerm(
                                        label_selector=client.V1LabelSelector(
                                            match_expressions=[
                                                client.V1LabelSelectorRequirement(
                                                    key="app",
                                                    operator="In",
                                                    values=[service_name]
                                                )
                                            ]
                                        ),
                                        topology_key="kubernetes.io/hostname"
                                    ),
                                    weight=100
                                )
                            ]
                        )
                    ),
                    containers=[
                        client.V1Container(
                            command=["sh","/usr/local/src/entrypoint.sh"],
                            env=pod_env,
                            image=container_image,
                            image_pull_policy="Always",
                            name=service_name,
                            ports=[
                                client.V1ContainerPort(container_port=service_port)
                            ],
                            resources=client.V1ResourceRequirements(
                                limits={
                                    "cpu": "{0}".format(resource_limit_cpu),
                                    "memory": resource_limit_memory
                                },
                                requests={
                                    "cpu": "{0}".format(resource_request_cpu),
                                    "memory": resource_request_memory
                                }
                            ),
                            security_context=client.V1SecurityContext(
                                privileged=True
                            ),
                            volume_mounts=[
                                client.V1VolumeMount(
                                    mount_path=pod_model_dir,
                                    name=volume_name
                                ),
                                client.V1VolumeMount(
                                    mount_path=ssh_dir,
                                    name=ssh_volume
                                )
                            ]
                        )
                    ],
                    node_selector={"host": service_level},
                    volumes=[
                        client.V1Volume(
                            host_path=client.V1HostPathVolumeSource(
                                path=host_model_dir
                            ),
                            name=volume_name
                        ),
                        client.V1Volume(
                            host_path=client.V1HostPathVolumeSource(
                                path=ssh_dir
                            ),
                            name=ssh_volume
                        )
                    ]
                )
            )
        )
    )
    apps_v1 = client.AppsV1Api()
    if mode_create:
        api_response = apps_v1.create_namespaced_deployment(
            body=v1_deployment,
            namespace=service_level
        )
    else:
        api_response = apps_v1.patch_namespaced_deployment(
            body=v1_deployment,
            name="{0}-deployment".format(service_name),
            namespace=service_level
        )
    """Service"""
    v1_service = client.V1Service(
        api_version="v1",
        kind="Service",
        metadata=client.V1ObjectMeta(
            name="{0}-service".format(service_name),
            namespace=service_level,
            labels={"drucker-worker": "True", "app": app_name, "sel": service_name}
        ),
        spec=client.V1ServiceSpec(
            ports=[
                client.V1ServicePort(
                    name="http2",
                    port=service_port,
                    protocol="TCP",
                    target_port=service_port
                )
            ],
            selector={"sel": service_name},
            type="NodePort"
        )
    )
    core_vi = client.CoreV1Api()
    if mode_create:
        api_response = core_vi.create_namespaced_service(
            namespace=service_level,
            body=v1_service
        )
    else:
        api_response = core_vi.patch_namespaced_service(
            namespace=service_level,
            name="{0}-service".format(service_name),
            body=v1_service
        )
    """Ingress"""
    v1_beta1_ingress = client.V1beta1Ingress(
        api_version="extensions/v1beta1",
        kind="Ingress",
        metadata=client.V1ObjectMeta(
            annotations={
                "ingress.kubernetes.io/ssl-passthrough": "true",
                "ingress.zlab.co.jp/backend-config": "{{\"{0}-service\": {{\"{1}\": {{\"proto\":\"h2\"}}}}}}".format(service_name,service_port),
                "kubernetes.io/ingress.class": "nghttpx"
            },
            name="{0}-ingress".format(service_name),
            namespace=service_level,
            labels={"drucker-worker": "True", "app": app_name, "sel": service_name}
        ),
        spec=client.V1beta1IngressSpec(
            rules=[
                client.V1beta1IngressRule(
                    host="{0}-{1}-{2}.{3}".format(app_name, api.dashboard_config.DRUCKER_GRPC_VERSION, service_level, app_dns_name),
                    http=client.V1beta1HTTPIngressRuleValue(
                        paths=[
                            client.V1beta1HTTPIngressPath(
                                backend=client.V1beta1IngressBackend(
                                    service_name="{0}-service".format(service_name),
                                    service_port=service_port
                                )
                            )
                        ]
                    )
                )
            ]
        )
    )
    extensions_v1_beta = client.ExtensionsV1beta1Api()
    if mode_create:
        api_response = extensions_v1_beta.create_namespaced_ingress(
            namespace=service_level,
            body=v1_beta1_ingress
        )
    else:
        api_response = extensions_v1_beta.patch_namespaced_ingress(
            namespace=service_level,
            name="{0}-ingress".format(service_name),
            body=v1_beta1_ingress
        )
    """Autoscaler"""
    v1_horizontal_pod_autoscaler = client.V1HorizontalPodAutoscaler(
        api_version="autoscaling/v1",
        kind="HorizontalPodAutoscaler",
        metadata=client.V1ObjectMeta(
            name="{0}-autoscaling".format(service_name),
            namespace=service_level,
            labels={"drucker-worker": "True", "app": app_name, "sel": service_name}
        ),
        spec=client.V1HorizontalPodAutoscalerSpec(
            max_replicas=replicas_maximum,
            min_replicas=replicas_minimum,
            scale_target_ref=client.V1CrossVersionObjectReference(
                api_version="apps/v1",
                kind="Deployment",
                name="{0}-deployment".format(service_name)
            ),
            target_cpu_utilization_percentage=autoscale_cpu_threshold
        )
    )
    autoscaling_v1 = client.AutoscalingV1Api()
    if mode_create:
        api_response = autoscaling_v1.create_namespaced_horizontal_pod_autoscaler(
            namespace=service_level,
            body=v1_horizontal_pod_autoscaler
        )
    else:
        api_response = autoscaling_v1.patch_namespaced_horizontal_pod_autoscaler(
            namespace=service_level,
            name="{0}-autoscaling".format(service_name),
            body=v1_horizontal_pod_autoscaler
        )
    #TODO: SDK may have a bug? since conditions and current_metrics always are returned NULL, SDK always throws an exception.
    """
    v2_beta1_horizontal_pod_autoscaler = client.V2beta1HorizontalPodAutoscaler(
        api_version="autoscaling/v2beta1",
        kind="HorizontalPodAutoscaler",
        metadata=client.V1ObjectMeta(
            name="{0}-autoscaling".format(service_name),
            namespace=service_level,
            labels={"drucker-worker": "True", "app": app_name, "sel": service_name}
        ),
        spec=client.V2beta1HorizontalPodAutoscalerSpec(
            max_replicas=replicas_maximum,
            min_replicas=replicas_minimum,
            metrics=[
                client.V2beta1MetricSpec(
                    resource=client.V2beta1ResourceMetricSource(
                        name="cpu",
                        target_average_utilization=autoscale_cpu_threshold
                    ),
                    type="Resource"
                )
            ],
            scale_target_ref=client.V2beta1CrossVersionObjectReference(
                api_version="apps/v1",
                kind="Deployment",
                name="{0}-deployment".format(service_name)
            )
        )
    )
    if mode_create:
        api_response = autoscaling_v2_beta1.create_namespaced_horizontal_pod_autoscaler(
            namespace=service_level,
            body=v2_beta1_horizontal_pod_autoscaler
        )
    else:
        api_response = autoscaling_v2_beta1.patch_namespaced_horizontal_pod_autoscaler(
            namespace=service_level,
            name="{0}-autoscaling".format(service_name),
            body=v2_beta1_horizontal_pod_autoscaler
        )
    """
    return service_name

def switch_drucker_service_model_assignment(
        application_id:int, service_id:int, model_id:int):
    """
    Switch model assignment.
    :param application_id:
    :param service_id:
    :param model_id:
    :return:
    """
    mobj = db.session.query(Model).filter(
        Model.application_id==application_id,Model.model_id==model_id).one()
    model_path = mobj.model_path
    sobj = db.session.query(Service).filter(
        Service.application_id == application_id, Service.service_id==service_id).one()
    host = sobj.host
    drucker_dashboard_application = DruckerDashboardClient(logger=api.logger, host=host)
    response_body = drucker_dashboard_application. \
        run_switch_service_model_assignment(model_path=model_path)
    if not response_body.get("status", True):
        raise Exception(response_body.get("message", "Error."))
    sobj.model_id = model_id
    db.session.flush()

    aobj = db.session.query(Application).filter(Application.application_id == application_id).one()
    kubernetes_id = aobj.kubernetes_id
    if kubernetes_id is not None:
        kobj = db.session.query(Kubernetes).filter(Kubernetes.kubernetes_id == kubernetes_id).one()
        config_path = kobj.config_path
        from kubernetes import client, config
        config.load_kube_config(config_path)

        apps_v1 = client.AppsV1Api()
        v1_deployment = apps_v1.read_namespaced_deployment(
            name="{0}-deployment".format(sobj.service_name),
            namespace=sobj.service_level
        )
        for env_ent in v1_deployment.spec.template.spec.containers[0].env:
            if env_ent.name == "DRUCKER_SERVICE_UPDATE_FLAG":
                env_ent.value = "Model switched to model_id={0} at {1:%Y%m%d%H%M%S}".format(model_id, datetime.utcnow())
                break
        api_response = apps_v1.patch_namespaced_deployment(
            body=v1_deployment,
            name="{0}-deployment".format(sobj.service_name),
            namespace=sobj.service_level
        )
    response_body["status"] = True
    return response_body


def dump_drucker_on_kubernetes(
        kobj:Kubernetes, aobj:Application, sobj:Service):
    if kobj is None:
        raise Exception("No such kubernetes_id.")
    if aobj is None:
        raise Exception("No such application_id.")
    if sobj is None:
        raise Exception("No such service_id.")

    config_path = kobj.config_path
    from kubernetes import client, config
    config.load_kube_config(config_path)
    save_dir = pathlib.Path(api.dashboard_config.DIR_KUBE_CONFIG, kobj.display_name, aobj.application_name)
    save_dir.mkdir(parents=True, exist_ok=True)
    api_client = client.ApiClient()

    apps_v1 = client.AppsV1Api()
    v1_deployment = apps_v1.read_namespaced_deployment(
        name="{0}-deployment".format(sobj.service_name),
        namespace=sobj.service_level,
        exact=True,
        export=True
    )
    json.dump(api_client.sanitize_for_serialization(v1_deployment),
              pathlib.Path(
                  api.dashboard_config.DIR_KUBE_CONFIG,
                  kobj.display_name,
                  aobj.application_name,
                  "{0}-deployment.json".format(sobj.service_name)).open("w", encoding='utf-8'),
              ensure_ascii=False, indent=2)
    core_vi = client.CoreV1Api()
    v1_service = core_vi.read_namespaced_service(
        name="{0}-service".format(sobj.service_name),
        namespace=sobj.service_level,
        exact=True,
        export=True
    )
    json.dump(api_client.sanitize_for_serialization(v1_service),
              pathlib.Path(
                  api.dashboard_config.DIR_KUBE_CONFIG,
                  kobj.display_name,
                  aobj.application_name,
                  "{0}-service.json".format(sobj.service_name)).open("w", encoding='utf-8'),
              ensure_ascii=False, indent=2)
    extensions_v1_beta = client.ExtensionsV1beta1Api()
    v1_beta1_ingress = extensions_v1_beta.read_namespaced_ingress(
        name="{0}-ingress".format(sobj.service_name),
        namespace=sobj.service_level,
        exact=True,
        export=True
    )
    json.dump(api_client.sanitize_for_serialization(v1_beta1_ingress),
              pathlib.Path(
                  api.dashboard_config.DIR_KUBE_CONFIG,
                  kobj.display_name,
                  aobj.application_name,
                  "{0}-ingress.json".format(sobj.service_name)).open("w", encoding='utf-8'),
              ensure_ascii=False, indent=2)
    autoscaling_v1 = client.AutoscalingV1Api()
    v1_horizontal_pod_autoscaler = autoscaling_v1.read_namespaced_horizontal_pod_autoscaler(
        name="{0}-autoscaling".format(sobj.service_name),
        namespace=sobj.service_level,
        exact=True,
        export=True
    )
    json.dump(api_client.sanitize_for_serialization(v1_horizontal_pod_autoscaler),
              pathlib.Path(
                  api.dashboard_config.DIR_KUBE_CONFIG,
                  kobj.display_name,
                  aobj.application_name,
                  "{0}-autoscaling.json".format(sobj.service_name)).open("w", encoding='utf-8'),
              ensure_ascii=False, indent=2)
    """
    autoscaling_v2_beta1 = client.AutoscalingV2beta1Api()
    v2_beta1_horizontal_pod_autoscaler = autoscaling_v2_beta1.read_namespaced_horizontal_pod_autoscaler(
        name="{0}-autoscaling".format(sobj.service_name),
        namespace=sobj.service_level,
        exact=True,
        export=True
    )
    json.dump(api_client.sanitize_for_serialization(v2_beta1_horizontal_pod_autoscaler),
              pathlib.Path(
                  api.dashboard_config.DIR_KUBE_CONFIG,
                  kobj.display_name, 
                  aobj.application_name,
                  "{0}-autoscaling.json".format(sobj.service_name)).open("w", encoding='utf-8'),
              ensure_ascii=False, indent=2)
    """


@kube_info_namespace.route('/')
class ApiKubernetes(Resource):
    @kube_info_namespace.marshal_list_with(kube_info)
    def get(self):
        """get_kubernetes"""
        return Kubernetes.query.all()

    @kube_info_namespace.marshal_with(success_or_not)
    def put(self):
        """update_dbs_of_all_kubernetes_app"""
        for kobj in Kubernetes.query.all():
            update_dbs_kubernetes(kobj.kubernetes_id)
        db.session.commit()
        db.session.close()
        response_body = {"status": True, "message": "Success."}
        return response_body

    @kube_info_namespace.marshal_with(success_or_not)
    @kube_info_namespace.expect(kube_file_parser)
    def post(self):
        """add_kubernetes"""
        args = kube_file_parser.parse_args()
        config_path = "{0}/{1}.config".format(api.dashboard_config.DIR_KUBE_CONFIG, uuid.uuid4().hex)
        dns_name = args['dns_name']
        display_name = args['display_name']
        if display_name is None:
            display_name = uuid.uuid4().hex
        host_model_dir = args['host_model_dir']
        pod_model_dir = args['pod_model_dir']
        db_mysql_host = args['db_mysql_host']
        db_mysql_port = args['db_mysql_port']
        db_mysql_dbname = args['db_mysql_dbname']
        db_mysql_user = args['db_mysql_user']
        db_mysql_password = args['db_mysql_password']
        description = args['description']
        newkube = Kubernetes(description=description,
                             config_path=config_path,
                             dns_name=dns_name,
                             display_name=display_name,
                             host_model_dir=host_model_dir,
                             pod_model_dir=pod_model_dir,
                             db_mysql_host=db_mysql_host,
                             db_mysql_port=db_mysql_port,
                             db_mysql_dbname=db_mysql_dbname,
                             db_mysql_user=db_mysql_user,
                             db_mysql_password=db_mysql_password)
        db.session.add(newkube)
        db.session.flush()
        file = args['file']
        file.save(newkube.config_path)

        try:
            from kubernetes import client, config
            config.load_kube_config(newkube.config_path)
            v1 = client.ExtensionsV1beta1Api()
            v1.list_ingress_for_all_namespaces(watch=False)
            update_dbs_kubernetes(newkube.kubernetes_id)
            db.session.commit()
            db.session.close()
            response_body = {"status": True, "message": "Success."}
        except Exception as error:
            os.remove(newkube.config_path)
            raise error
        return response_body


@kube_info_namespace.route('/dump')
class ApiKubernetesDump(Resource):
    @kube_info_namespace.marshal_with(success_or_not)
    def post(self):
        """dump_kubernetes"""
        for kobj in Kubernetes.query.all():
            for aobj in Application.query.filter_by(kubernetes_id=kobj.kubernetes_id).all():
                for sobj in Service.query.filter_by(application_id=aobj.application_id).all():
                    dump_drucker_on_kubernetes(kobj, aobj, sobj)
        response_body = {"status": True, "message": "Success."}
        return response_body


@kube_info_namespace.route('/<int:kubernetes_id>')
class ApiKubernetesId(Resource):
    @kube_info_namespace.marshal_with(kube_info)
    def get(self, kubernetes_id:int):
        """get_kubernetes_id"""
        return Kubernetes.query.filter_by(
            kubernetes_id=kubernetes_id).first_or_404()

    @kube_info_namespace.marshal_with(success_or_not)
    def put(self, kubernetes_id:int):
        """update_dbs_of_kubernetes_app"""
        update_dbs_kubernetes(kubernetes_id)
        db.session.commit()
        db.session.close()
        response_body = {"status": True, "message": "Success."}
        return response_body

    @kube_info_namespace.marshal_with(success_or_not)
    @kube_info_namespace.expect(kube_file_parser)
    def patch(self, kubernetes_id:int):
        """update_kubernetes_id"""
        args = kube_file_parser.parse_args()
        display_name = args['display_name']
        host_model_dir = args['host_model_dir']
        pod_model_dir = args['pod_model_dir']
        db_mysql_host = args['db_mysql_host']
        db_mysql_port = args['db_mysql_port']
        db_mysql_dbname = args['db_mysql_dbname']
        db_mysql_user = args['db_mysql_user']
        db_mysql_password = args['db_mysql_password']
        description = args['description']
        file = args['file']
        dns_name = args['dns_name']

        kobj = db.session.query(Kubernetes).filter(
            Kubernetes.kubernetes_id==kubernetes_id).one()
        if display_name is not None:
            kobj.display_name = display_name
        if description is not None:
            kobj.description = description
        kobj.dns_name = dns_name
        kobj.host_model_dir = host_model_dir
        kobj.pod_model_dir = pod_model_dir
        kobj.db_mysql_host = db_mysql_host
        kobj.db_mysql_port = db_mysql_port
        kobj.db_mysql_dbname = db_mysql_dbname
        kobj.db_mysql_user = db_mysql_user
        kobj.db_mysql_password = db_mysql_password

        config_path = "{0}/{1}".format(api.dashboard_config.DIR_KUBE_CONFIG, uuid.uuid4().hex)
        file.save(config_path)
        try:
            from kubernetes import client, config
            config.load_kube_config(config_path)
            v1 = client.ExtensionsV1beta1Api()
            v1.list_ingress_for_all_namespaces(watch=False)
            os.remove(kobj.config_path)
            shutil.move(config_path, kobj.config_path)
            response_body = {"status": True, "message": "Success."}
            db.session.commit()
            db.session.close()
        except Exception as error:
            os.remove(config_path)
            raise error
        return response_body

    @kube_info_namespace.marshal_with(success_or_not)
    def delete(self, kubernetes_id:int):
        """delete_kubernetes_id"""
        aobj = db.session.query(Application).filter(Application.kubernetes_id == kubernetes_id).all()
        for res in aobj:
            application_id = res.application_id
            db.session.query(Model).filter(Model.application_id == application_id).delete()
            db.session.query(Service).filter(Service.application_id == application_id).delete()
            db.session.query(Application).filter(Application.application_id == application_id).delete()
        db.session.query(Kubernetes).filter(Kubernetes.kubernetes_id == kubernetes_id).delete()
        response_body = {"status": True, "message": "Success."}
        db.session.commit()
        db.session.close()
        return response_body

@kube_info_namespace.route('/<int:kubernetes_id>/applications')
class ApiKubernetesIdApplication(Resource):
    kube_app_deploy = kube_deploy_parser.copy()
    kube_app_deploy.remove_argument('service_model_assignment')

    from .api_application import app_info
    @kube_info_namespace.marshal_list_with(app_info)
    def get(self, kubernetes_id:int):
        """get Kubernetes applications"""
        return Application.query.filter_by(
            kubernetes_id=kubernetes_id).all()

    @kube_info_namespace.expect(kube_app_deploy)
    @kube_info_namespace.marshal_with(success_or_not)
    def post(self, kubernetes_id:int):
        """add_kubernetes_application"""
        args = self.kube_app_deploy.parse_args()
        args["service_model_assignment"] = None
        service_name = create_or_update_drucker_on_kubernetes(kubernetes_id, args)
        update_dbs_kubernetes(kubernetes_id, description=args['commit_message'])
        db.session.commit()
        db.session.close()
        response_body = {"status": True, "message": "Success."}
        return response_body

@kube_info_namespace.route('/<int:kubernetes_id>/applications/<int:application_id>/services')
class ApiKubernetesIdApplicationIdServices(Resource):
    kube_srv_deploy = kube_deploy_parser.copy()
    kube_srv_deploy.remove_argument('app_name')

    from .api_service import srv_info
    @kube_info_namespace.marshal_list_with(srv_info)
    def get(self, kubernetes_id:int, application_id:int):
        """get_kubernetes_service"""
        if db.session.query(Application).filter(
                Application.kubernetes_id == kubernetes_id,
                Application.application_id == application_id).one_or_none() is None:
            raise Exception("No such data.")
        return Service.query.filter_by(application_id=application_id).all()

    @kube_info_namespace.marshal_with(success_or_not)
    def put(self, kubernetes_id:int, application_id:int):
        """update_dbs_of_kubernetes_app"""
        aobj = db.session.query(Application).filter(
            Application.application_id == application_id,
            Application.kubernetes_id == kubernetes_id).one_or_none()
        applist = set((aobj.application_name,))
        update_dbs_kubernetes(kubernetes_id, applist)
        db.session.commit()
        db.session.close()
        response_body = {"status": True, "message": "Success."}
        return response_body

    @kube_info_namespace.expect(kube_srv_deploy)
    @kube_info_namespace.marshal_with(success_or_not)
    def post(self, kubernetes_id:int, application_id:int):
        """add_kubernetes_service"""
        args = self.kube_srv_deploy.parse_args()
        aobj = db.session.query(Application).filter(
            Application.kubernetes_id == kubernetes_id,
            Application.application_id == application_id).one_or_none()
        args["app_name"] = aobj.application_name
        if args["service_model_assignment"] is not None:
            mobj = Model.query.filter_by(
                application_id=application_id,
                model_id=args["service_model_assignment"]).one_or_none()
            if mobj is None:
                args["service_model_assignment"] = None
        service_name = create_or_update_drucker_on_kubernetes(kubernetes_id, args)
        applist = set((aobj.application_name,))
        update_dbs_kubernetes(kubernetes_id, applist, description=args['commit_message'])

        sobj = db.session.query(Service).filter(
            Service.application_id == aobj.application_id,
            Service.service_name == service_name).one_or_none()
        if sobj is not None and sobj.model_id != args["service_model_assignment"]:
            sobj.model_id = args["service_model_assignment"]
            db.session.flush()
        db.session.commit()
        db.session.close()
        response_body = {"status": True, "message": "Success."}
        return response_body

@kube_info_namespace.route('/<int:kubernetes_id>/applications/<int:application_id>/services/<int:service_id>')
class ApiKubernetesIdApplicationIdServiceId(Resource):
    kube_srv_update = kube_deploy_parser.copy()
    kube_srv_update.remove_argument('app_name')
    kube_srv_update.remove_argument('service_level')
    kube_srv_update.remove_argument('service_model_assignment')

    @kube_info_namespace.marshal_with(kube_service_config_info)
    def get(self, kubernetes_id:int, application_id:int, service_id:int):
        """get kubernetes service info"""
        sobj = Service.query.filter_by(
            application_id=application_id,
            service_id=service_id).one_or_none()
        if sobj is None:
            raise Exception("No such data.")
        kobj = Kubernetes.query.filter_by(kubernetes_id=kubernetes_id).one_or_none()
        if kobj is None:
            raise Exception("No such kubernetes_id.")
        config_path = kobj.config_path
        from kubernetes import client, config
        config.load_kube_config(config_path)

        apps_v1 = client.AppsV1Api()
        v1_deployment = apps_v1.read_namespaced_deployment(
            name="{0}-deployment".format(sobj.service_name),
            namespace=sobj.service_level
        )
        autoscaling_v1 = client.AutoscalingV1Api()
        v1_horizontal_pod_autoscaler = autoscaling_v1.read_namespaced_horizontal_pod_autoscaler(
            name="{0}-autoscaling".format(sobj.service_name),
            namespace=sobj.service_level
        )
        """
        autoscaling_v2_beta1 = client.AutoscalingV2beta1Api()
        v2_beta1_horizontal_pod_autoscaler = autoscaling_v2_beta1.read_namespaced_horizontal_pod_autoscaler(
            name="{0}-autoscaling".format(sobj.service_name),
            namespace=sobj.service_level
        )
        """

        response_body = {}
        for env_ent in v1_deployment.spec.template.spec.containers[0].env:
            if env_ent.name == "DRUCKER_SERVICE_UPDATE_FLAG":
                response_body["commit_message"] = env_ent.value
            elif env_ent.name == "DRUCKER_APPLICATION_NAME":
                response_body["app_name"] = env_ent.value
            elif env_ent.name == "DRUCKER_SERVICE_LEVEL":
                response_body["service_level"] = env_ent.value
            elif env_ent.name == "DRUCKER_SERVICE_NAME":
                response_body["service_name"] = env_ent.value
            elif env_ent.name == "DRUCKER_SERVICE_PORT":
                response_body["service_port"] = env_ent.value
            elif env_ent.name == "DRUCKER_SERVICE_GIT_URL":
                response_body["service_git_url"] = env_ent.value
            elif env_ent.name == "DRUCKER_SERVICE_GIT_BRANCH":
                response_body["service_git_branch"] = env_ent.value
            elif env_ent.name == "DRUCKER_SERVICE_BOOT_SHELL":
                response_body["service_boot_script"] = env_ent.value
            elif env_ent.name == "DRUCKER_DB_MYSQL_HOST":
                response_body["db_mysql_host"] = env_ent.value
            elif env_ent.name == "DRUCKER_DB_MYSQL_PORT":
                response_body["db_mysql_port"] = env_ent.value
            elif env_ent.name == "DRUCKER_DB_MYSQL_DBNAME":
                response_body["db_mysql_dbname"] = env_ent.value
            elif env_ent.name == "DRUCKER_DB_MYSQL_USER":
                response_body["db_mysql_user"] = env_ent.value
            elif env_ent.name == "DRUCKER_DB_MYSQL_PASSWORD":
                response_body["db_mysql_password"] = env_ent.value
        response_body["replicas_default"] = v1_deployment.spec.replicas
        response_body["replicas_minimum"] = v1_horizontal_pod_autoscaler.spec.min_replicas
        response_body["replicas_maximum"] = v1_horizontal_pod_autoscaler.spec.max_replicas
        response_body["autoscale_cpu_threshold"] = v1_horizontal_pod_autoscaler.spec.target_cpu_utilization_percentage
        response_body["policy_max_surge"] = v1_deployment.spec.strategy.rolling_update.max_surge
        response_body["policy_max_unavailable"] = v1_deployment.spec.strategy.rolling_update.max_unavailable
        response_body["policy_wait_seconds"] = v1_deployment.spec.min_ready_seconds
        response_body["container_image"] = v1_deployment.spec.template.spec.containers[0].image
        response_body["resource_request_cpu"] = kubernetes_cpu_to_float(v1_deployment.spec.template.spec.containers[0].resources.requests["cpu"])
        response_body["resource_request_memory"] = v1_deployment.spec.template.spec.containers[0].resources.requests["memory"]
        response_body["resource_limit_cpu"] = kubernetes_cpu_to_float(v1_deployment.spec.template.spec.containers[0].resources.limits["cpu"])
        response_body["resource_limit_memory"] = v1_deployment.spec.template.spec.containers[0].resources.limits["memory"]
        response_body["host_model_dir"] = v1_deployment.spec.template.spec.volumes[0].host_path.path
        response_body["pod_model_dir"] = v1_deployment.spec.template.spec.containers[0].volume_mounts[0].mount_path
        return response_body


    @kube_info_namespace.expect(kube_srv_update)
    @kube_info_namespace.marshal_with(success_or_not)
    def patch(self, kubernetes_id:int, application_id:int, service_id:int):
        """update_kubernetes_deployment"""
        args = self.kube_srv_update.parse_args()
        sobj = db.session.query(Service).filter(
            Service.service_id == service_id).one_or_none()
        if sobj is None:
            raise Exception("No such data.")
        aobj = db.session.query(Application).filter(
            Application.kubernetes_id == kubernetes_id,
            Application.application_id == application_id).one_or_none()
        if aobj is None:
            raise Exception("No such data.")
        args["app_name"] = aobj.application_name
        args["service_level"] = sobj.service_level
        args['commit_message'] = "Request a rolling-update at {0:%Y%m%d%H%M%S}".format(datetime.utcnow())
        args["service_model_assignment"] = None
        create_or_update_drucker_on_kubernetes(kubernetes_id, args, sobj.service_name)
        applist = set((aobj.application_name,))
        update_dbs_kubernetes(kubernetes_id, applist)
        db.session.commit()
        db.session.close()
        response_body = {"status": True, "message": "Success."}
        return response_body
