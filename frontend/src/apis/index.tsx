import * as APICore from './Core'
import { apiConvertDataServerMode, apiConvertProjectRole, apiConvertApplicationRole } from '@components/App/Admin/constants'

const snakelize = (value: string): string => (value.split(/(?=[A-Z])/).join('_').toLowerCase());
const camelize = (value: string): string => {
  const splitted = value.split('_');
  const tail =
    splitted.length > 1
    ? splitted.slice(1).map((v: string) => v[0].toUpperCase() + v.slice(1)).reduce((p, c) => (p + c))
    : '';

  return splitted[0] + tail
};
const convertKeys = (params, func) => Object.keys(params)
  .map((value) => ({ [func(value)]: params[value] }))
  .reduce((l, r) => Object.assign(l, r), {});

// POST or PATCH
export interface ProjectParam {
  id?: number,
  displayName: string
  description: string
  registeredDate?: Date
  method: string
}
export async function saveProject(params: ProjectParam) {
  const requestBody = {
    ...convertKeys(params, snakelize),
    method: {} = {}
  };

  const convert = (response) => response.status;

  if (params.method === 'post') {
    return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects`, requestBody, convert, 'POST')
  } else if (params.method === 'patch') {
    return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.id}`, requestBody, convert, 'PATCH')
  }

  throw new RangeError(`You specified wrong save method ${params.method}`)
}

export interface DataServerParam {
  projectId: number
  dataServerMode: string
  cephAccessKey: string
  cephSecretKey: string
  cephHost: string
  cephPort: number
  cephIsSecure: boolean
  cephBucketName: string
  awsAccessKey: string
  awsSecretKey: string
  awsBucketName: string
  registeredDate?: Date
  method: string
}
export async function saveDataServer(params: DataServerParam) {
  const requestBody = {
    ...convertKeys(params, snakelize),
    method: {} = {}
  };

  const convert = (response) => response.status;

  return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/data_servers`, requestBody, convert, params.method === 'post' ? 'POST' : 'PATCH');
}

export interface KubernetesParam {
  id?: number,
  projectId: number
  description: string
  displayName: string
  exposedHost: string
  exposedPort: number
  registeredDate?: Date
  configFile: File | string
  method: string
}
export async function saveKubernetes(params: KubernetesParam) {
  const requestBody = {
    ...convertKeys(params, snakelize),
    file: params.configFile,
    method: {} = {},
    configFile: {} = {}
  };

  const convert = (response) => response.status;

  if (params.method === 'post') {
    return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/kubernetes`, requestBody, convert, 'POST')
  } else if (params.method === 'patch') {
    return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/kubernetes/${params.id}`, requestBody, convert, 'PATCH')
  }

  throw new RangeError(`You specified wrong save method ${params.method}`)
}

export interface ApplicationParam {
  id?: string,
  projectId: number
  description: string
  applicationName: string
  registeredDate?: Date
  method: string
}
export async function saveApplication(params: ApplicationParam) {
  const requestBody = {
    ...convertKeys(params, snakelize),
    method: {} = {},
  };

  const convert = (response) => response.status;

  if (params.method === 'post') {
    return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications`, requestBody, convert, 'POST')
  } else if (params.method === 'patch') {
    return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.id}`, requestBody, convert, 'PATCH')
  }

  throw new RangeError(`You specified wrong save method ${params.method}`)
}

export interface UpdateServiceParam {
  id: string
  projectId: number
  applicationId: number
  description: string
  displayName: string
  version: string
}
export async function updateService(params: UpdateServiceParam): Promise<boolean> {
  const requestBody = {
    ...convertKeys(params, snakelize),
    method: {} = {},
  };

  const convert = (response) => response.status;

  return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/services/${params.id}`, requestBody, convert, 'PATCH')
}

export interface SingleServiceParam {
  isKubernetes: boolean
  projectId: number
  applicationId: number
  description: string
  displayName: string
  serviceLevel: string
  version: string
  serviceModelAssignment: number
  serviceInsecureHost: string
  serviceInsecurePort: number
  registeredDate?: Date
  method: string
}
export interface DeploymentParam {
  id?: string
  replicasDefault?: number
  replicasMinimum?: number
  replicasMaximum?: number
  autoscaleCpuThreshold?: number
  policyMaxSurge?: number
  policyMaxUnavailable?: number
  policyWaitSeconds?: number
  containerImage?: string
  serviceGitUrl?: string
  serviceGitBranch?: string
  serviceBootScript?: string
  resourceRequestCpu?: number
  resourceRequestMemory?: string
  resourceLimitCpu?: number
  resourceLimitMemory?: string
  debugMode?: boolean
}
export type ServiceDeploymentParam = SingleServiceParam & DeploymentParam
export async function saveServiceDeployment(params: ServiceDeploymentParam): Promise<boolean> {
  const requestBody = {
    ...convertKeys(params, snakelize),
    method: {} = {},
  };

  const convert = (response) => response.status;

  if (params.isKubernetes) {
    if (params.method === 'post') {
      return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/service_deployment`, requestBody, convert, 'POST')
    } else if (params.method === 'patch') {
      return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/service_deployment/${params.id}`, requestBody, convert, 'PATCH')
    }
  } else {
    return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/single_service_registration`, requestBody, convert, 'POST')
  }

  throw new RangeError(`You specified wrong save method ${params.method}`)
}

export interface ServiceRoutingParam {
  projectId: number
  applicationId: number
  serviceLevel: string
  serviceIds: string[]
  serviceWeights: number[]
}
export async function updateServiceRouting(params: ServiceRoutingParam): Promise<boolean> {
  const requestBody = {
    ...convertKeys(params, snakelize),
    method: {} = {},
  };

  const convert = (response) => response.status;

  return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/service_routing`, requestBody, convert, 'PATCH')
}

export interface UploadModelParam {
  projectId: number
  applicationId: string
  description: string
  file: File
}
export async function uploadModel(params: UploadModelParam) {
  const requestBody = {
    ...params
  };

  const convert = (response) => response.status;

  return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/models`, requestBody, convert, 'POST')
}

export interface UpdateModelParam {
  id?: number
  projectId: number
  applicationId: string
  description: string
}
export async function updateModel(params: UpdateModelParam): Promise<boolean> {
  const requestBody = {
    ...params
  };

  const convert = (response) => response.status;

  return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/models/${params.id}`, requestBody, convert, 'PATCH')
}

// GET APIs
export class Project {
  constructor(
    public name: string,
    public id: string,
    public description: string = '',
    public date: Date = null
  ) { }
}
export function fetchAllProjects(): Promise<Project[]> {
  const convert =
    (results) =>
      results.map(
        (result): Project => {
          return {
            ...result,
            id: result.project_id,
            name: result.display_name,
            date: new Date(result.register_date * 1000)
          }
        }
      );
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects`, convert)
}
interface FetchProjectByIdParam {
  id: number
}
export async function fetchProjectById(params: FetchProjectByIdParam): Promise<Project> {
  const convert =
    (result) => (
      {
        ...result,
        name: result.display_name,
        id: result.project_id,
        date: new Date(result.register_date * 1000)
      }
    );
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.id}`, convert)
}

export class DataServer {
  constructor(
    public projectId: number,
    public mode: string | boolean,
    public cephAccessKey: string = null,
    public cephSecretKey: string = null,
    public cephHost: string = null,
    public cephPort: number = null,
    public cephIsSecure: boolean = null,
    public cephBucketName: string = null,
    public awsAccessKey: string = null,
    public awsSecretKey: string = null,
    public awsBucketName: string = null,
    public date: Date = null
  ) { }
}
interface FetchDataServerByIdParam {
  id: number
}
export async function fetchDataServer(params: FetchDataServerByIdParam): Promise<DataServer> {
  const convert =
    (result) => (
      {
        ...convertKeys(result, camelize),
        mode: apiConvertDataServerMode(result.data_server_mode),
        date: new Date(result.register_date * 1000)
      }
    );
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.id}/data_servers`, convert)
}

export class Kubernetes {
  constructor(
    public name: string,
    public id: number,
    public projectId: number,
    public description: string = '',
    public configPath: string,
    public exposedHost: string,
    public exposedPort: number,
    public date: Date = null
  ) { }
}
interface FetchKubernetesById {
  id?: number
  projectId: number

}
export async function fetchAllKubernetes(params: FetchKubernetesById): Promise<Kubernetes[]> {
  const convert =
    (results) =>
      results.map(
        (result): Kubernetes => {
          return {
            id: result.kubernetes_id,
            name: result.display_name,
            projectId: result.project_id,
            description: result.description,
            configPath: result.config_path,
            exposedHost: result.exposed_host,
            exposedPort: result.exposed_port,
            date: new Date(result.register_date * 1000)
          }
        }
      );
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.id}/kubernetes`, convert)
}
export async function fetchKubernetesById(params: FetchKubernetesById): Promise<Kubernetes> {
  const convert =
    (result) => (
      {
        ...convertKeys(result, camelize),
        id: result.kubernetes_id,
        name: result.display_name,
        date: new Date(result.register_date * 1000)
      }
    );
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.id}/kubernetes/${params.id}`, convert)
}

export class Application {
  constructor(
    public name: string,
    public id: string,
    public description: string = '',
    public date: Date = null,
    public projectId: number
  ) { }
}
interface FetchApplicationByIdParam {
  id?: string
  projectId: number
}
export function fetchAllApplications(params: FetchApplicationByIdParam): Promise<Application[]> {
  const convert =
    (results) =>
      results.map(
        (result): Application => {
          return {
            id: result.application_id,
            name: result.application_name,
            description: result.description,
            date: new Date(result.register_date * 1000),
            projectId: result.project_id
          }
        }
      );
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications`, convert)
}
export async function fetchApplicationById(params: FetchApplicationByIdParam): Promise<Application> {
  const convert =
    (result) => (
      {
        ...convertKeys(result, camelize),
        name: result.application_name,
        id: result.application_id,
        date: new Date(result.register_date * 1000)
      }
    );
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.id}`, convert)
}

export class Model {
  constructor(
    public id: number,
    public description: string = '',
    public date: Date = null
  ) { }
}
export interface FetchModelByIdParam {
  id?: string
  projectId: number
  applicationId: string
}
export async function fetchAllModels(params: FetchModelByIdParam): Promise<Model[]> {
  const convert =
    (results) => results.map((result): Model => {
      return {
        description: result.description,
        id: result.model_id,
        date: new Date(result.register_date * 1000)
      }
    });
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/models`, convert)
}
export async function fetchModelById(params: FetchModelByIdParam): Promise<Model> {
  const convert =
    (result) => (
      {
        id: result.model_id,
        description: result.description,
        date: new Date(result.register_date * 1000),
        ...convertKeys(result, camelize)
      }
    );
  return APICore.getRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/models/${params.id}`,
    convert
  )
}

export class Service {
  constructor(
    public id: string,
    public name: string,
    public description: string = '',
    public serviceLevel: string,
    public version: string,
    public modelId: number,
    public insecureHost: string,
    public insecurePort: number,
    public date: Date = null,
    public applicationId: string,
    public replicasDefault?: number,
    public replicasMinimum?: number,
    public replicasMaximum?: number,
    public autoscaleCpuThreshold?: number,
    public policyMaxSurge?: number,
    public policyMaxUnavailable?: number,
    public policyWaitSeconds?: number,
    public containerImage?: string,
    public serviceGitUrl?: string,
    public serviceGitBranch?: string,
    public serviceBootScript?: string,
    public resourceRequestCpu?: number,
    public resourceRequestMemory?: string,
    public resourceLimitCpu?: number,
    public resourceLimitMemory?: string,
    public debugMode?: boolean
  ) { }
}
export interface FetchServiceParam {
  projectId: number
  applicationId: string
}
export async function fetchAllServices(params: FetchServiceParam): Promise<Service[]> {
  const convert =
    (results) => results.map((result): Service => {
      return {
        id: result.service_id,
        name: result.display_name,
        serviceLevel: result.service_level,
        version: result.version,
        modelId: result.model_id,
        insecureHost: result.insecure_host,
        insecurePort: result.insecure_port,
        description: result.description,
        date: new Date(result.register_date * 1000),
        applicationId: result.application_id
      }
    });
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/services`, convert)
}
export interface FetchServiceByIdParam {
  isKubernetes: boolean
  isOnlyDescription: boolean
  id: string
  projectId: number
  applicationId: string
}
export async function fetchServiceById(params: FetchServiceByIdParam): Promise<Service> {
  const convert =
    (result) => (
      {
        id: result.service_id,
        name: result.display_name,
        date: new Date(result.register_date * 1000),
        ...convertKeys(result, camelize)
      }
    );

  if (params.isKubernetes && !params.isOnlyDescription) {
    return APICore.getRequest(
      `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/service_deployment/${params.id}`,
      convert
    )
  } else {
    return APICore.getRequest(
      `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/services/${params.id}`,
      convert
    )
  }
}

export class ServiceRouteWeight {
  constructor(
    public displayName: string,
    public serviceId: string,
    public serviceWeight: number
  ) { }
}
export class ServiceRoute {
  constructor(
    public applicationName: string,
    public serviceLevel: string,
    public serviceWeights: ServiceRouteWeight[]
  ) { }
}
export interface FetchServiceRouteParam {
  projectId: number
  applicationId: string
  serviceLevel: string
}
export async function fetchServiceRoute(params: FetchServiceRouteParam): Promise<ServiceRoute> {
  const convert =
    (result) => (
      {
        applicationName: result.application_name,
        serviceLevel: result.service_level,
        serviceWeights: result.map((weight): ServiceRouteWeight => {
          return {
            displayName: weight.display_name,
            serviceId: weight.service_id,
            serviceWeight: weight.service_weight
          }
        })
      }
    );
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/service_routing?service_level=${params.serviceLevel}`, convert)
}

// PUT APIs
export interface SwitchModelParam {
  projectId: number
  applicationId: string
  serviceId: string
  modelId: string
}
export async function switchModel(params: SwitchModelParam) {
  const requestBody = {
    model_id: params.modelId
  };
  const convert = (result) => result.status;

  return APICore.putJsonRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/services/${params.serviceId}`,
    requestBody,
    convert
  )
}
export async function switchModels(params: SwitchModelParam[]) {
  const requestOptions = params.map(
    (param) => (
      {
        options: {
          method: 'PUT',
        },
        params: { model_id: param.modelId }
      }
    )
  );
  const entryPoints = params.map(
    (param) => (
      `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${param.projectId}/applications/${param.applicationId}/services/${param.serviceId}`
    )
  );
  const convert = (result) => result.status;

  return APICore.rawMultiRequest(entryPoints, convert, requestOptions)
}

export interface SynKubernetesStatusParam {
  projectId: number
  applicationId?: string
  serviceId?: string
}
export async function syncKubernetesStatus(params: SynKubernetesStatusParam): Promise<boolean> {
  const options = {
    method: 'PUT',
    body: new FormData()
  };

  const idUrlString =
    params.applicationId && params.serviceId
      ? `/applications/${params.applicationId}/service_deployment/${params.serviceId}`
      : '';
  const convert = (result) => result.status;

  return APICore.rawRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}${idUrlString}`, convert, options)
}

// DELETE APIs
export interface IdParam {
  projectId: number
  kubernetesId?: number
  applicationId?: string
  serviceId?: string
  modelId?: number
}
export async function deleteKubernetes(params: IdParam): Promise<any> {
  const convert = (result) => result.status;

  return APICore.deleteRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/kubernetes/${params.kubernetesId}`,
    convert
  )
}

export async function deleteDataServer(params: IdParam): Promise<any> {
  const convert = (result) => result.status;

  return APICore.deleteRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/data_servers`,
    convert
  )
}

export async function deleteApplication(params: IdParam): Promise<any> {
  const convert = (result) => result.status;

  return APICore.deleteRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}`,
    convert
  )
}

export async function deleteServices(params: IdParam[]): Promise<Array<Promise<boolean>>> {
  const convert = (result) => result.status;
  const entryPoints = params.map(
    (param) =>
      `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${param.projectId}/applications/${param.applicationId}/services/${param.serviceId}`
  );
  const requestList = params.map(
    (param) => ({ options: { method: 'DELETE' } })
  );

  return APICore.rawMultiRequest<boolean>(entryPoints, convert, requestList)
}

export async function deleteModels(params: IdParam[]): Promise<Array<Promise<boolean>>> {
  const convert = (result) => result.status;
  const entryPoints = params.map(
    (param) =>
      `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${param.projectId}/applications/${param.applicationId}/models/${param.modelId}`
  );
  const requestList = params.map(
    (param) => ({ options: { method: 'DELETE' } })
  );

  return APICore.rawMultiRequest<boolean>(entryPoints, convert, requestList)
}

// Login API
export class AuthToken {
  constructor(
    public jwt: string = ''
  ) { }
}
export interface LoginParam {
  username: string
  password: string
}
export async function login(param: LoginParam) {
  const convert = (result): AuthToken => {
    return {
      jwt: result.jwt
    }
  };
  return APICore.postJsonRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/login`,
    param,
    convert
  )
}

export async function settings(): Promise<any> {
  return APICore.getRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/settings`
  )
}

export class UserProjectRole {
  constructor(
    public projectId: number,
    public role: string = ''
  ) { }
}
export class UserApplicationRole {
  constructor(
    public applicationId: string,
    public role: string = ''
  ) { }
}
export class UserInfo {
  constructor(
    public user: {
      userUid: string
      userName: string
    },
    public projectRoles: UserProjectRole[],
    public applicationRoles: UserApplicationRole[],
  ) { }
}
export async function userInfo(): Promise<UserInfo> {
  const convert = (result): UserInfo => {
    const projectRoles: UserProjectRole[] = result.projects.map(
      (e) => new UserProjectRole(e.project_id, e.project_role));
    const applicationRoles: UserApplicationRole[] = result.applications.map(
      (e) => new UserApplicationRole(e.application_id, e.application_role));
    return new UserInfo({
      userUid: result.user.auth_id,
      userName: result.user.user_name,
    },
      projectRoles,
      applicationRoles)
  };
  return APICore.getRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/credential`,
    convert
  )
}
export async function fetchAllUsers(): Promise<UserInfo[]> {
  const convert = (results) => {
    return results.map((result) => {
      return new UserInfo({
        userUid: result.auth_id,
        userName: result.user_name
      }, [], [])
    })
  };
  return APICore.getRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/users`,
    convert
  )
}

export class ProjectAccessControlList {
  constructor(
    public userUid: string,
    public userName: string,
    public role: string | boolean,
  ) { }
}
export interface AccessControlParam {
  projectId: number
  applicationId?: string
  method?: string
  uid?: string
  role?: string
}
export async function fetchProjectAccessControlList(params: AccessControlParam): Promise<ProjectAccessControlList[]> {
  const convert = (results: any): ProjectAccessControlList[] => {
    return results.map((result: any) => new ProjectAccessControlList(
      result.user.auth_id,
      result.user.user_name,
      apiConvertProjectRole(result.project_role)
    ))
  };
  return APICore.getRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/acl`,
    convert
  )
}
export async function saveProjectAccessControl(params: AccessControlParam): Promise<boolean> {
  const convert = (result) => result.status;
  return APICore.formDataRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/acl`,
    { ...params },
    convert,
    params.method === 'post' ? 'POST' : 'PATCH'
  )
}
export async function deleteProjectAccessControl(params: AccessControlParam): Promise<boolean> {
  const convert = (result) => result.status;
  return APICore.deleteRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/acl/users/${params.uid}`,
    convert
  )
}

export class ApplicationAccessControlList {
  constructor(
    public userUid: string,
    public userName: string,
    public role: string,
  ) { }
}
export async function fetchApplicationAccessControlList(params: AccessControlParam): Promise<ApplicationAccessControlList[]> {
  const convert = (results: any): ApplicationAccessControlList[] => {
    return results.map((result: any) => new ApplicationAccessControlList(
      result.user.auth_id,
      result.user.user_name,
      apiConvertApplicationRole(result.role)
    ))
  };
  return APICore.getRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/acl`,
    convert
  )
}

export async function saveApplicationAccessControl(params: AccessControlParam): Promise<boolean> {
  const convert = (result) => result.status;
  return APICore.formDataRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/acl`,
    { ...params },
    convert,
    params.method === 'post' ? 'POST' : 'PATCH'
  )
}

export async function deleteApplicationAccessControl(params: AccessControlParam): Promise<boolean> {
  const convert = (result) => result.status;
  return APICore.deleteRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/projects/${params.projectId}/applications/${params.applicationId}/acl/users/${params.uid}`,
    convert
  )
}

export class ApiStatusResponse {
  constructor(
    public status: string = '',
    public message: string = ''
  ) { }
}
