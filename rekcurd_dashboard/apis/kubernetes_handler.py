import json
import uuid

from datetime import datetime
from pathlib import Path

from . import api, RekcurdDashboardException
from .common import kubernetes_cpu_to_float
from rekcurd_dashboard.models import db, DataServerModel, KubernetesModel, ApplicationModel, ServiceModel, ModelModel


def get_full_config_path(filename: str):
    """
    Get full path of Kubernetes config.
    :param filename:
    :return:
    """
    return f'{api.dashboard_config.DIR_KUBE_CONFIG}/{filename}'


def save_kubernetes_access_file(file, config_path):
    """
    Save Kubernetes config.
    :param file:
    :param config_path:
    :return:
    """
    full_config_path = get_full_config_path(config_path)
    file.save(full_config_path)
    return


def remove_kubernetes_access_file(config_path):
    """
    Remove Kubernetes config.
    :param config_path:
    :return:
    """
    full_config_path = get_full_config_path(config_path)
    Path(full_config_path).unlink()
    return


def update_kubernetes_deployment_info(kubernetes_model: KubernetesModel):
    """
    Update Kubernetes deployment info.
    :param kubernetes_model:
    :return:
    """
    full_config_path = get_full_config_path(kubernetes_model.config_path)
    from kubernetes import client, config
    config.load_kube_config(full_config_path)
    v1_api = client.AppsV1Api()
    list_deployment_for_all_namespaces = v1_api.list_deployment_for_all_namespaces(watch=False)

    """Application registration."""
    for i in list_deployment_for_all_namespaces.items:
        labels = i.metadata.labels
        if labels is None or labels.get("rekcurd-worker", "False") == "False":
            continue

        application_id = labels["id"]
        application_name = labels["name"]
        application_model = db.session.query(ApplicationModel).filter(
            ApplicationModel.application_id == application_id).one_or_none()
        if application_model is None:
            application_model = ApplicationModel(
                project_id=kubernetes_model.project_id,
                application_id=application_id,
                application_name=application_name)
            db.session.add(application_model)
            db.session.flush()

    """Service registration."""
    for i in list_deployment_for_all_namespaces.items:
        labels = i.metadata.labels
        if labels is None or labels.get("rekcurd-worker", "False") == "False":
            continue

        application_id = labels["id"]
        service_id = labels["sel"]
        service_model: ServiceModel = db.session.query(ServiceModel).filter(
            ServiceModel.service_id == service_id).one_or_none()
        if service_model is None:
            service_level = i.metadata.namespace
            version = None
            filepath = None
            insecure_host = None
            insecure_port = None
            for env_ent in i.spec.template.spec.containers[0].env:
                if env_ent.name == "REKCURD_GRPC_PROTO_VERSION":
                    version = env_ent.value
                elif env_ent.name == "REKCURD_MODEL_FILE_PATH":
                    filepath = env_ent.value
                elif env_ent.name == "REKCURD_SERVICE_INSECURE_HOST":
                    insecure_host = env_ent.value
                elif env_ent.name == "REKCURD_SERVICE_INSECURE_PORT":
                    insecure_port = int(env_ent.value)

            """Model registration."""
            model_model: ModelModel = db.session.query(ModelModel).filter(
                ModelModel.application_id == application_id,
                ModelModel.filepath == filepath).one_or_none()
            if model_model is None:
                model_model = ModelModel(application_id=application_id,
                                         filepath=filepath, description="Automatically registered.")
                db.session.add(model_model)
                db.session.flush()

            """Service registration."""
            service_model = ServiceModel(
                service_id=service_id,
                application_id=application_id,
                display_name="{}-{}".format(service_level, service_id),
                service_level=service_level,
                version=version,
                model_id=model_model.model_id,
                insecure_host=insecure_host,
                insecure_port=insecure_port)
            db.session.add(service_model)
            db.session.flush()
    return


def apply_rekcurd_to_kubernetes(
        project_id: int, application_id: str, service_level: str, version: str,
        insecure_host: str, insecure_port: int, replicas_default: int, replicas_minimum: int,
        replicas_maximum: int, autoscale_cpu_threshold: str, policy_max_surge: int,
        policy_max_unavailable: int, policy_wait_seconds: int, container_image: str,
        resource_request_cpu: str, resource_request_memory: str, resource_limit_cpu: str,
        resource_limit_memory: str, commit_message: str, service_model_assignment: int,
        service_git_url: str = "", service_git_branch: str = "", service_boot_script: str = "",
        debug_mode: bool = False, service_id: str = None,
        display_name: str = None, description: str = None,
        **kwargs) -> str:
    """
    kubectl apply
    :param project_id:
    :param application_id:
    :param service_level:
    :param version:
    :param insecure_host:
    :param insecure_port:
    :param replicas_default:
    :param replicas_minimum:
    :param replicas_maximum:
    :param autoscale_cpu_threshold:
    :param policy_max_surge:
    :param policy_max_unavailable:
    :param policy_wait_seconds:
    :param container_image:
    :param resource_request_cpu:
    :param resource_request_memory:
    :param resource_limit_cpu:
    :param resource_limit_memory:
    :param commit_message:
    :param service_model_assignment:
    :param service_git_url:
    :param service_git_branch:
    :param service_boot_script:
    :param debug_mode:
    :param service_id:
    :param display_name:
    :param description:
    :param kwargs:
    :return:
    """
    __num_retry = 5
    progress_deadline_seconds = \
        int(__num_retry*policy_wait_seconds*replicas_maximum/(policy_max_surge+policy_max_unavailable))
    is_creation_mode = False
    if service_id is None:
        is_creation_mode = True
        service_id = uuid.uuid4().hex
    data_server_model: DataServerModel = db.session.query(DataServerModel).filter(
        DataServerModel.project_id == project_id).first_or_404()
    application_model: ApplicationModel = db.session.query(ApplicationModel).filter(
        ApplicationModel.application_id == application_id).first_or_404()
    application_name = application_model.application_name
    model_model: ModelModel = db.session.query(ModelModel).filter(
        ModelModel.model_id == service_model_assignment).first_or_404()

    for kubernetes_model in db.session.query(KubernetesModel).filter(KubernetesModel.project_id == project_id).all():
        full_config_path = get_full_config_path(kubernetes_model.config_path)
        from kubernetes import client, config
        config.load_kube_config(full_config_path)

        pod_env = [
            client.V1EnvVar(
                name="REKCURD_SERVICE_UPDATE_FLAG",
                value=commit_message
            ),
            client.V1EnvVar(
                name="REKCURD_KUBERNETES_MODE",
                value="True"
            ),
            client.V1EnvVar(
                name="REKCURD_DEBUG_MODE",
                value=str(debug_mode)
            ),
            client.V1EnvVar(
                name="REKCURD_APPLICATION_NAME",
                value=application_name
            ),
            client.V1EnvVar(
                name="REKCURD_SERVICE_INSECURE_HOST",
                value=insecure_host
            ),
            client.V1EnvVar(
                name="REKCURD_SERVICE_INSECURE_PORT",
                value=str(insecure_port)
            ),
            client.V1EnvVar(
                name="REKCURD_SERVICE_ID",
                value=service_id
            ),
            client.V1EnvVar(
                name="REKCURD_SERVICE_LEVEL",
                value=service_level
            ),
            client.V1EnvVar(
                name="REKCURD_GRPC_PROTO_VERSION",
                value=version
            ),
            client.V1EnvVar(
                name="REKCURD_MODEL_MODE",
                value=data_server_model.data_server_mode.value
            ),
            client.V1EnvVar(
                name="REKCURD_MODEL_FILE_PATH",
                value=model_model.filepath
            ),
            client.V1EnvVar(
                name="REKCURD_CEPH_ACCESS_KEY",
                value=str(data_server_model.ceph_access_key or "xxx")
            ),
            client.V1EnvVar(
                name="REKCURD_CEPH_SECRET_KEY",
                value=str(data_server_model.ceph_secret_key or "xxx")
            ),
            client.V1EnvVar(
                name="REKCURD_CEPH_HOST",
                value=str(data_server_model.ceph_host or "xxx")
            ),
            client.V1EnvVar(
                name="REKCURD_CEPH_PORT",
                value=str(data_server_model.ceph_port or "1234")
            ),
            client.V1EnvVar(
                name="REKCURD_CEPH_IS_SECURE",
                value=str(data_server_model.ceph_is_secure or "False")
            ),
            client.V1EnvVar(
                name="REKCURD_CEPH_BUCKET_NAME",
                value=str(data_server_model.ceph_bucket_name or "xxx")
            ),
            client.V1EnvVar(
                name="REKCURD_AWS_ACCESS_KEY",
                value=str(data_server_model.aws_access_key or "xxx")
            ),
            client.V1EnvVar(
                name="REKCURD_AWS_SECRET_KEY",
                value=str(data_server_model.aws_secret_key or "xxx")
            ),
            client.V1EnvVar(
                name="REKCURD_AWS_BUCKET_NAME",
                value=str(data_server_model.aws_bucket_name or "xxx")
            ),
            # TODO: GCP
            client.V1EnvVar(
                name="REKCURD_SERVICE_GIT_URL",
                value=service_git_url
            ),
            client.V1EnvVar(
                name="REKCURD_SERVICE_GIT_BRANCH",
                value=service_git_branch
            ),
            client.V1EnvVar(
                name="REKCURD_SERVICE_BOOT_SHELL",
                value=service_boot_script
            ),
        ]

        """Namespace registration."""
        core_vi_api = client.CoreV1Api()
        try:
            core_vi_api.read_namespace(name=service_level)
        except:
            api.logger.info("\"{}\" namespace created".format(service_level))
            v1_namespace = client.V1Namespace(
                api_version="v1",
                kind="Namespace",
                metadata=client.V1ObjectMeta(
                    name=service_level
                )
            )
            core_vi_api.create_namespace(
                body=v1_namespace
            )

        """Create/patch Deployment."""
        v1_deployment = client.V1Deployment(
            api_version="apps/v1",
            kind="Deployment",
            metadata=client.V1ObjectMeta(
                name="deploy-{0}".format(service_id),
                namespace=service_level,
                labels={"rekcurd-worker": "True", "id": application_id,
                        "name": application_name, "sel": service_id}
            ),
            spec=client.V1DeploymentSpec(
                min_ready_seconds=policy_wait_seconds,
                progress_deadline_seconds=progress_deadline_seconds,
                replicas=replicas_default,
                revision_history_limit=3,
                selector=client.V1LabelSelector(
                    match_labels={"sel": service_id}
                ),
                strategy=client.V1DeploymentStrategy(
                    type="RollingUpdate",
                    rolling_update=client.V1RollingUpdateDeployment(
                        max_surge=policy_max_surge,
                        max_unavailable=policy_max_unavailable)
                ),
                template=client.V1PodTemplateSpec(
                    metadata=client.V1ObjectMeta(
                        labels={"rekcurd-worker": "True", "id": application_id,
                                "name": application_name, "sel": service_id}
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
                                                        key="id",
                                                        operator="In",
                                                        values=[service_id]
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
                                env=pod_env,
                                image=container_image,
                                image_pull_policy="Always",
                                name=service_id,
                                ports=[
                                    client.V1ContainerPort(container_port=insecure_port)
                                ],
                                resources=client.V1ResourceRequirements(
                                    limits={
                                        "cpu": str(resource_limit_cpu),
                                        "memory": resource_limit_memory
                                    },
                                    requests={
                                        "cpu": str(resource_request_cpu),
                                        "memory": resource_request_memory
                                    }
                                ),
                                security_context=client.V1SecurityContext(
                                    privileged=True
                                )
                            )
                        ],
                        node_selector={"host": service_level}
                    )
                )
            )
        )
        apps_v1_api = client.AppsV1Api()
        if is_creation_mode:
            api.logger.info("Deployment created.")
            apps_v1_api.create_namespaced_deployment(
                body=v1_deployment,
                namespace=service_level
            )
        else:
            api.logger.info("Deployment patched.")
            apps_v1_api.patch_namespaced_deployment(
                body=v1_deployment,
                name="deploy-{0}".format(service_id),
                namespace=service_level
            )

        """Create/patch Service."""
        v1_service = client.V1Service(
            api_version="v1",
            kind="Service",
            metadata=client.V1ObjectMeta(
                name="svc-{0}".format(service_id),
                namespace=service_level,
                labels={"rekcurd-worker": "True", "id": application_id,
                        "name": application_name, "sel": service_id}
            ),
            spec=client.V1ServiceSpec(
                ports=[
                    client.V1ServicePort(
                        name="grpc-backend",
                        port=insecure_port,
                        protocol="TCP",
                        target_port=insecure_port
                    )
                ],
                selector={"sel": service_id}
            )
        )
        core_vi_api = client.CoreV1Api()
        if is_creation_mode:
            api.logger.info("Service created.")
            core_vi_api.create_namespaced_service(
                namespace=service_level,
                body=v1_service
            )
        else:
            api.logger.info("Service patched.")
            core_vi_api.patch_namespaced_service(
                namespace=service_level,
                name="svc-{0}".format(service_id),
                body=v1_service
            )

        """Create/patch Autoscaler."""
        v1_horizontal_pod_autoscaler = client.V1HorizontalPodAutoscaler(
            api_version="autoscaling/v1",
            kind="HorizontalPodAutoscaler",
            metadata=client.V1ObjectMeta(
                name="hpa-{0}".format(service_id),
                namespace=service_level,
                labels={"rekcurd-worker": "True", "id": application_id,
                        "name": application_name, "sel": service_id}
            ),
            spec=client.V1HorizontalPodAutoscalerSpec(
                max_replicas=replicas_maximum,
                min_replicas=replicas_minimum,
                scale_target_ref=client.V1CrossVersionObjectReference(
                    api_version="apps/v1",
                    kind="Deployment",
                    name="deploy-{0}".format(service_id)
                ),
                target_cpu_utilization_percentage=autoscale_cpu_threshold
            )
        )
        autoscaling_v1_api = client.AutoscalingV1Api()
        if is_creation_mode:
            api.logger.info("Autoscaler created.")
            autoscaling_v1_api.create_namespaced_horizontal_pod_autoscaler(
                namespace=service_level,
                body=v1_horizontal_pod_autoscaler
            )
        else:
            api.logger.info("Autoscaler patched.")
            autoscaling_v1_api.patch_namespaced_horizontal_pod_autoscaler(
                namespace=service_level,
                name="hpa-{0}".format(service_id),
                body=v1_horizontal_pod_autoscaler
            )

        """Create Istio ingress if this is the first application."""
        custom_object_api = client.CustomObjectsApi()
        try:
            custom_object_api.get_namespaced_custom_object(
                group="networking.istio.io",
                version="v1alpha3",
                namespace=service_level,
                plural="virtualservices",
                name="ing-vs-{0}".format(application_id),
            )
        except:
            ingress_virtual_service_body = {
                "apiVersion": "networking.istio.io/v1alpha3",
                "kind": "VirtualService",
                "metadata": {
                    "labels": {"rekcurd-worker": "True", "id": application_id,
                               "name": application_name, "sel": service_id},
                    "name": "ing-vs-{0}".format(application_id),
                    "namespace": service_level
                },
                "spec": {
                    "hosts": [
                        "*"
                    ],
                    "gateways": [
                        "rekcurd-ingress-gateway"
                    ],
                    "http": [
                        {
                            "match": [
                                {
                                    "headers": {
                                        "x-rekcurd-application-name": {
                                            "exact": application_name
                                        },
                                        "x-rekcurd-sevice-level": {
                                            "exact": service_level
                                        },
                                        "x-rekcurd-grpc-version": {
                                            "exact": version
                                        },
                                    }
                                }
                            ],
                            "route": [
                                {
                                    "destination": {
                                        "port": {
                                            "number": insecure_port
                                        },
                                        "host": "svc-{0}".format(service_id)
                                    },
                                    "weight": 100
                                }
                            ],
                            "retries": {
                                "attempts": 25,
                                "perTryTimeout": "1s"
                            }
                        }
                    ]
                }
            }
            api.logger.info("Istio created.")
            custom_object_api.create_namespaced_custom_object(
                group="networking.istio.io",
                version="v1alpha3",
                namespace=service_level,
                plural="virtualservices",
                body=ingress_virtual_service_body
            )

        """Add service model."""
        if is_creation_mode:
            if display_name is None:
                display_name = "{0}-{1}".format(service_level, service_id)
            service_model = ServiceModel(
                service_id=service_id, application_id=application_id, display_name=display_name,
                description=description, service_level=service_level, version=version,
                model_id=service_model_assignment, insecure_host=insecure_host,
                insecure_port=insecure_port)
            db.session.add(service_model)
            db.session.flush()

    """Finish."""
    return service_id


def delete_kubernetes_deployment(kubernetes_models: list, application_id: str, service_id: str):
    """
    Delete Kubernetes deployment.
    :param kubernetes_models:
    :param application_id:
    :param service_id:
    :return:
    """
    service_model: ServiceModel = db.session.query(ServiceModel).filter(ServiceModel.service_id == service_id).first_or_404()
    for kubernetes_model in kubernetes_models:
        full_config_path = get_full_config_path(kubernetes_model.config_path)
        from kubernetes import client, config
        config.load_kube_config(full_config_path)
        """Deployment"""
        apps_v1_api = client.AppsV1Api()
        apps_v1_api.delete_namespaced_deployment(
            name="deploy-{0}".format(service_id),
            namespace=service_model.service_level,
            body=client.V1DeleteOptions()
        )
        """Service"""
        core_vi_api = client.CoreV1Api()
        core_vi_api.delete_namespaced_service(
            name="svc-{0}".format(service_id),
            namespace=service_model.service_level,
            body=client.V1DeleteOptions()
        )
        """Autoscaler"""
        autoscaling_v1_api = client.AutoscalingV1Api()
        autoscaling_v1_api.delete_namespaced_horizontal_pod_autoscaler(
            name="hpa-{0}".format(service_id),
            namespace=service_model.service_level,
            body=client.V1DeleteOptions()
        )
        """Istio"""
        custom_object_api = client.CustomObjectsApi()
        ingress_virtual_service_body = custom_object_api.get_namespaced_custom_object(
            group="networking.istio.io",
            version="v1alpha3",
            namespace=service_model.service_level,
            plural="virtualservices",
            name="ing-vs-{0}".format(application_id),
        )
        routes = ingress_virtual_service_body["spec"]["http"][0]["route"]
        new_routes = [route for route in routes if route["destination"]["host"] != "svc-{0}".format(service_id)]
        if new_routes:
            weights = [route["weight"] for route in new_routes]
            norm_factor = 100.0/sum(weights)
            for route in new_routes:
                route["weight"] = round(route["weight"]*norm_factor)
            ingress_virtual_service_body["spec"]["http"][0]["route"] = new_routes
            custom_object_api.patch_namespaced_custom_object(
                group="networking.istio.io",
                version="v1alpha3",
                namespace=service_model.service_level,
                plural="virtualservices",
                name="ing-vs-{0}".format(application_id),
                body=ingress_virtual_service_body
            )
        else:
            custom_object_api.delete_namespaced_custom_object(
                group="networking.istio.io",
                version="v1alpha3",
                namespace=service_model.service_level,
                plural="virtualservices",
                name="ing-vs-{0}".format(application_id),
                body=client.V1DeleteOptions()
            )
    db.session.query(ServiceModel).filter(ServiceModel.service_id == service_id).delete()
    db.session.flush()
    return


def apply_new_route_weight(
        project_id: int, application_id: str, service_level: str, service_ids: list, service_weights: list):
    service_weight_dict = dict()
    service_weight_checker = list()
    for i in range(len(service_ids)):
        key = service_ids[i]
        service_weight_dict[key] = int(service_weights[i])
        service_weight_checker.append(int(service_weights[i]))
    if sum(service_weight_checker) != 100:
        raise RekcurdDashboardException("total weight must be 100.")
    for kubernetes_model in db.session.query(KubernetesModel).filter(KubernetesModel.project_id == project_id).all():
        full_config_path = get_full_config_path(kubernetes_model.config_path)
        from kubernetes import client, config
        config.load_kube_config(full_config_path)
        custom_object_api = client.CustomObjectsApi()
        ingress_virtual_service_body = custom_object_api.get_namespaced_custom_object(
            group="networking.istio.io",
            version="v1alpha3",
            namespace=service_level,
            plural="virtualservices",
            name="ing-vs-{0}".format(application_id),
        )
        routes = []
        for service_id in service_ids:
            service_model: ServiceModel = db.session.query(ServiceModel).filter(
                ServiceModel.service_id == service_id).first_or_404()
            route = {
                "destination": {
                    "port": {
                        "number": service_model.insecure_port
                    },
                    "host": "svc-{0}".format(service_id)
                },
                "weight": service_weight_dict[service_id]
            }
            routes.append(route)
        ingress_virtual_service_body["spec"]["http"][0]["route"] = routes
        custom_object_api.patch_namespaced_custom_object(
            group="networking.istio.io",
            version="v1alpha3",
            namespace=service_level,
            plural="virtualservices",
            name="ing-vs-{0}".format(application_id),
            body=ingress_virtual_service_body
        )
    return


def load_kubernetes_deployment_info(project_id: int, application_id: str, service_id: str) -> dict:
    """
    Load deployment info from Kubernetes.
    :param project_id:
    :param application_id:
    :param service_id:
    :return:
    """
    kubernetes_model: KubernetesModel = db.session.query(KubernetesModel).filter(
        KubernetesModel.project_id == project_id).first()
    service_model: ServiceModel = db.session.query(ServiceModel).filter(
        ServiceModel.service_id == service_id).first_or_404()

    full_config_path = get_full_config_path(kubernetes_model.config_path)
    from kubernetes import client, config
    config.load_kube_config(full_config_path)

    apps_v1_api = client.AppsV1Api()
    v1_deployment = apps_v1_api.read_namespaced_deployment(
        name="deploy-{0}".format(service_id),
        namespace=service_model.service_level
    )
    autoscaling_v1_api = client.AutoscalingV1Api()
    v1_horizontal_pod_autoscaler = autoscaling_v1_api.read_namespaced_horizontal_pod_autoscaler(
        name="hpa-{0}".format(service_id),
        namespace=service_model.service_level
    )

    deployment_info = {}
    filepath = None
    deployment_info["application_name"] = v1_deployment.metadata.labels["name"]
    deployment_info["service_id"] = service_id
    for env_ent in v1_deployment.spec.template.spec.containers[0].env:
        if env_ent.name == "REKCURD_SERVICE_UPDATE_FLAG":
            deployment_info["commit_message"] = env_ent.value
        elif env_ent.name == "REKCURD_SERVICE_INSECURE_HOST":
            deployment_info["insecure_host"] = env_ent.value
        elif env_ent.name == "REKCURD_SERVICE_INSECURE_PORT":
            deployment_info["insecure_port"] = int(env_ent.value)
        elif env_ent.name == "REKCURD_SERVICE_LEVEL":
            deployment_info["service_level"] = env_ent.value
        elif env_ent.name == "REKCURD_GRPC_PROTO_VERSION":
            deployment_info["version"] = env_ent.value
        elif env_ent.name == "REKCURD_MODEL_FILE_PATH":
            filepath = env_ent.value
        elif env_ent.name == "REKCURD_SERVICE_GIT_URL":
            deployment_info["service_git_url"] = env_ent.value
        elif env_ent.name == "REKCURD_SERVICE_GIT_BRANCH":
            deployment_info["service_git_branch"] = env_ent.value
        elif env_ent.name == "REKCURD_SERVICE_BOOT_SHELL":
            deployment_info["service_boot_script"] = env_ent.value
    model_model: ModelModel = db.session.query(ModelModel).filter(
        ModelModel.application_id == application_id, ModelModel.filepath == filepath).first_or_404()
    deployment_info["service_model_assignment"] = model_model.model_id
    deployment_info["replicas_default"] = v1_deployment.spec.replicas
    deployment_info["replicas_minimum"] = v1_horizontal_pod_autoscaler.spec.min_replicas
    deployment_info["replicas_maximum"] = v1_horizontal_pod_autoscaler.spec.max_replicas
    deployment_info["autoscale_cpu_threshold"] = v1_horizontal_pod_autoscaler.spec.target_cpu_utilization_percentage
    deployment_info["policy_max_surge"] = v1_deployment.spec.strategy.rolling_update.max_surge
    deployment_info["policy_max_unavailable"] = v1_deployment.spec.strategy.rolling_update.max_unavailable
    deployment_info["policy_wait_seconds"] = v1_deployment.spec.min_ready_seconds
    deployment_info["container_image"] = v1_deployment.spec.template.spec.containers[0].image
    deployment_info["resource_request_cpu"] = \
        kubernetes_cpu_to_float(v1_deployment.spec.template.spec.containers[0].resources.requests["cpu"])
    deployment_info["resource_request_memory"] = \
        v1_deployment.spec.template.spec.containers[0].resources.requests["memory"]
    deployment_info["resource_limit_cpu"] = \
        kubernetes_cpu_to_float(v1_deployment.spec.template.spec.containers[0].resources.limits["cpu"])
    deployment_info["resource_limit_memory"] = \
        v1_deployment.spec.template.spec.containers[0].resources.limits["memory"]
    return deployment_info


def switch_model_assignment(project_id: int, application_id: str, service_id: str, model_id: int):
    """
    Switch model assignment.
    :param project_id:
    :param application_id:
    :param service_id:
    :param model_id:
    :return:
    """
    service_model: ServiceModel = db.session.query(ServiceModel).filter(
        ServiceModel.service_id == service_id).first_or_404()
    deployment_info = load_kubernetes_deployment_info(project_id, application_id, service_id)
    deployment_info["service_model_assignment"] = model_id
    deployment_info["commit_message"] = "model_id={0} on {1:%Y%m%d%H%M%S}".format(model_id, datetime.utcnow())

    apply_rekcurd_to_kubernetes(
        project_id=project_id, application_id=application_id, **deployment_info)

    service_model.model_id = model_id
    db.session.flush()
    return


def backup_kubernetes_deployment(
        kubernetes_model: KubernetesModel, application_model: ApplicationModel, service_model: ServiceModel):
    """
    Backup Kubernetes deployment.
    :param kubernetes_model:
    :param application_model:
    :param service_model:
    :return:
    """
    full_config_path = get_full_config_path(kubernetes_model.config_path)
    from kubernetes import client, config
    config.load_kube_config(full_config_path)
    save_dir = Path(api.dashboard_config.DIR_KUBE_CONFIG, application_model.application_name)
    save_dir.mkdir(parents=True, exist_ok=True)
    api_client = client.ApiClient()

    """Deployment"""
    apps_v1_api = client.AppsV1Api()
    v1_deployment = apps_v1_api.read_namespaced_deployment(
        name="deploy-{0}".format(service_model.service_id),
        namespace=service_model.service_level,
        exact=True,
        export=True
    )
    json.dump(api_client.sanitize_for_serialization(v1_deployment),
              Path(save_dir, "deploy-{0}.json".format(service_model.service_id)).open("w", encoding='utf-8'),
              ensure_ascii=False, indent=2)
    """Service"""
    core_vi_api = client.CoreV1Api()
    v1_service = core_vi_api.read_namespaced_service(
        name="svc-{0}".format(service_model.service_id),
        namespace=service_model.service_level,
        exact=True,
        export=True
    )
    json.dump(api_client.sanitize_for_serialization(v1_service),
              Path(save_dir, "svc-{0}.json".format(service_model.service_id)).open("w", encoding='utf-8'),
              ensure_ascii=False, indent=2)
    """Autoscaler"""
    autoscaling_v1_api = client.AutoscalingV1Api()
    v1_horizontal_pod_autoscaler = autoscaling_v1_api.read_namespaced_horizontal_pod_autoscaler(
        name="hpa-{0}".format(service_model.service_id),
        namespace=service_model.service_level,
        exact=True,
        export=True
    )
    json.dump(api_client.sanitize_for_serialization(v1_horizontal_pod_autoscaler),
              Path(save_dir, "hpa-{0}.json".format(service_model.service_id)).open("w", encoding='utf-8'),
              ensure_ascii=False, indent=2)
    return


def load_istio_routing(kubernetes_model: KubernetesModel, application_model: ApplicationModel, service_level: str):
    """
    Load istio routing info from Kubernetes.
    :param kubernetes_model:
    :param application_model:
    :param service_level:
    :return:
    """
    full_config_path = get_full_config_path(kubernetes_model.config_path)
    from kubernetes import client, config
    config.load_kube_config(full_config_path)
    custom_object_api = client.CustomObjectsApi()
    ingress_virtual_service_body = custom_object_api.get_namespaced_custom_object(
        group="networking.istio.io",
        version="v1alpha3",
        namespace=service_level,
        plural="virtualservices",
        name="ing-vs-{0}".format(application_model.application_id),
    )
    return ingress_virtual_service_body["spec"]["http"][0]["route"]


def backup_istio_routing(kubernetes_model: KubernetesModel, application_model: ApplicationModel, service_level: str):
    """
    Backup Kubernetes deployment.
    :param kubernetes_model:
    :param application_model:
    :param service_level:
    :return:
    """
    full_config_path = get_full_config_path(kubernetes_model.config_path)
    from kubernetes import client, config
    config.load_kube_config(full_config_path)
    save_dir = Path(api.dashboard_config.DIR_KUBE_CONFIG, application_model.application_name)
    save_dir.mkdir(parents=True, exist_ok=True)

    """Istio"""
    custom_object_api = client.CustomObjectsApi()
    ingress_virtual_service_body = custom_object_api.get_namespaced_custom_object(
        group="networking.istio.io",
        version="v1alpha3",
        namespace=service_level,
        plural="virtualservices",
        name="ing-vs-{0}".format(application_model.application_id),
    )
    json.dump(ingress_virtual_service_body,
              Path(save_dir, "ing-vs-{0}.json".format(
                  application_model.application_id)).open("w", encoding='utf-8'), ensure_ascii=False, indent=2)
    return
