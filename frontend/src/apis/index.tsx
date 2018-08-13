import * as APICore from './Core'

export class Application {
  constructor(
    public name: string = '',
    public id: string = '',
    public description: string = '',
    public date: Date = null,
    public kubernetesId: number = null
  ) { }
}

export class Service {
  constructor(
    public id: string = '',
    public name: string = '',
    public serviceLevel: string = '',
    public modelId: string = null,
    public host: string = '',
    public description: string = '',
  ) { }
}

export class AuthToken {
  constructor(
    public jwt: string = ''
  ) { }
}

export class UserInfo {
  constructor(
    public user?: string
  ) { }
}

export interface ServiceSimple {
  id: number
  name: string // Corresponds to `display_name`
  applicationId: number
  serviceLevel: string // Corresponds to `service_level`
  modelId?: number
  description: string
  registeredDate?: Date
}

export interface ServiceKubernetes {
  // General
  id: number
  name: string
  serviceLevel: string
  // Scale
  policyMaxSurge
  policyMaxUnavailable
  policyWaitSeconds
  replicasDefault
  replicasMaximum
  replicasMinimum
  autoscaleCpuThreshold
  // Resource
  resourceLimitCpu
  resourceLimitMemory
  resourceRequestCpu
  resourceRequestMemory
  // Model boot
  serviceBootScript
  serviceGitBranch
  serviceGitUrl
  servicePort
  commitMessage
  containerImage
}

export class Environment {
  constructor(
    public name: string = '',
    public services: Set<Service> = new Set<Service>(),
  ) { }
}

export class ModelResponse {
  constructor(
    public status: string = '',
    public message: string = ''
  ) { }
}

export class Model {
  constructor(
    public name: string = '',
    public id: string = '',
    public registeredDate: Date = null,
  ) { }
}

const snakelize = (value: string): string => (value.split(/(?=[A-Z])/).join('_').toLowerCase())
const camelize = (value: string): string => {
  const splitted = value.split('_')
  const tail =
    splitted.length > 1
    ? splitted.slice(1).map((v: string) => v[0].toUpperCase() + v.slice(1)).reduce((p, c) => (p + c))
    : ''

  return splitted[0] + tail
}
const convertKeys = (params, func) => Object.keys(params)
  .map((value) => ({ [func(value)]: params[value] }))
  .reduce((l, r) => Object.assign(l, r), {})

// POST or PATCH or PUT APIs
/**
 * Kubernetes host setting
 *
 * @type {number} id Unique id for the host setting
 * @type {string} displayName Name to display on the frontend
 * @type {string} dnsName DNS of services in Kubernetes
 * @type {File | string} configFile Generated config file generated
 *    by kubectl or fetched path
 */
export interface KubernetesHost {
  id?: number,
  description: string,
  displayName: string,
  dnsName: string,
  registeredDate?: Date,
  configFile: File | string
  // DB
  dbMysqlDbname
  dbMysqlHost
  dbMysqlPassword
  dbMysqlPort
  dbMysqlUser
  // Deployment dir
  hostModelDir
  podModelDir
}
export type SaveKubernetesHostParam = KubernetesHost & { method: string }
export async function saveKubernetesHost(param: SaveKubernetesHostParam) {
  const requestBody = {
    ...convertKeys(param, snakelize),
    file: param.configFile,
    method: {} = {},
    configFile: {} = {}
  }

  const convert = (response) => response.status

  if (param.method === 'add') {
    return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/kubernetes/`, requestBody, convert)
  } else if (param.method === 'edit') {
    return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/kubernetes/${param.id}`, requestBody, convert, 'PATCH')
  }

  throw new RangeError(`You specified wrong save method ${param.method}`)
}

export async function addApplication(params): Promise<boolean> {
  const convert = (result) => result.status
  const requestBody = convertKeys(params, snakelize)

  if (params.applicationType === 'kubernetes') {
    return APICore.formDataRequest(
      `${process.env.API_HOST}:${process.env.API_PORT}/api/kubernetes/${params.kubernetesId}/applications`,
      {
        ...requestBody,
        app_name: params.name,
        app_dnsName: params.appDnsName
      },
      convert
    )
  } else if (params.applicationType === 'simple') {
    return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/applications/`, requestBody, convert)
  }
  throw new RangeError(`You specified wrong parameter type ${params.applicationType}`)
}

export interface SaveServiceParam {
  id?: string
  applicationType: string
  applicationId: string
  kubernetesId?: string
  serviceLevel: string
  name: string
  modelId: string
  description: string
  mode: string
  saveDescription?: boolean
}
export async function saveService(params: SaveServiceParam): Promise<boolean> {
  const requestBody = Object.keys(params)
    .map((value) => ({ [snakelize(value)]: params[value] }))
    .reduce((l, r) => Object.assign(l, r), {})
  const convert = (result) => result.status as boolean
  const idUrlString = params.id ? `/${params.id}` : ''

  // Just save description
  if (params.saveDescription) {
    return APICore.formDataRequest<boolean>(
      `${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${params.applicationId}/services${idUrlString}`,
      requestBody,
      convert,
      params.mode === 'add' ? 'POST' : 'PATCH'
    )
  }

  if (params.applicationType === 'kubernetes') {
    return APICore.formDataRequest<boolean>(
      `${process.env.API_HOST}:${process.env.API_PORT}/api/kubernetes/${params.kubernetesId}/applications/${params.applicationId}/services${idUrlString}`,
      requestBody,
      convert,
      params.mode === 'add' ? 'POST' : 'PATCH'
    )
  } else if (params.applicationType === 'simple') {
    return APICore.formDataRequest<boolean>(
      `${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${params.applicationId}/services`,
      requestBody,
      convert,
      'PATCH' // Only modification is available for simple app
    )
  }
  throw new RangeError(`You specified wrong parameter type ${params.applicationType}`)
}

export interface UploadModelParam {
  applicationId: string
  name: string
  description: string
  file: File
}
export async function uploadModel(param: UploadModelParam) {
  const requestBody = {
    ...param
  }

  return APICore.formDataRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${param.applicationId}/models`, requestBody)
}

// GET APIs
export function fetchAllKubernetesHosts() {
  const convert =
    (results): KubernetesHost => results.map((result) => ({
      ...convertKeys(result, camelize),
      id: result.kubernetes_id,
      registeredDate: new Date(result.register_date * 1000),
      configFile: result.config_path,
      config_path: {} = {},
      register_date: {} = {}
    }))
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/kubernetes/`, convert)
}

export function fetchAllApplications() {
  const convert =
    (results) =>
      results.map(
        (variable): Application => {
          return {
            id: variable.application_id,
            name: variable.application_name,
            description: variable.description,
            date: new Date(variable.register_date * 1000),
            kubernetesId: variable.kubernetes_id
          }
        }
      )

  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/applications/`, convert)
}

interface FetchApplicationByIdParam {
  id: string
}
export async function fetchApplicationById(params: FetchApplicationByIdParam): Promise<Application> {
  const convert =
    (result) => (
      {
        ...result,
        name: result.application_name,
        id: result.application_id,
        date: new Date(result.register_date * 1000),
        kubernetesId: result.kubernetes_id
      }
    )
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${params.id}`, convert)
}

export async function fetchKubernetesHostById(params: any): Promise<any> {
  const convert =
    (result) => (
      {
        ...convertKeys(result, camelize),
        id: result.kubernetes_id,
        registeredDate: new Date(result.register_date * 1000),
        configFile: result.config_path,
        config_path: {} = {},
        register_date: {} = {}
      }
    )
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/kubernetes/${params.id}`, convert)
}

interface FetchModelsParam {
  application_id: string
}
export async function fetchAllModels(params: FetchModelsParam): Promise<Model[]> {
  const convert =
    (results) => results.map((variable): Model => {
      return {
        name: variable.description,
        id: variable.model_id,
        registeredDate: new Date(variable.register_date * 1000),
      }
    })
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${params.application_id}/models`, convert)
}

export interface FetchServicesParam {
  kubernetes?: boolean
  id?: string
  applicationId: string
  kubernetesId?: string
}
export async function fetchAllServices(params: FetchServicesParam) {
  const convert =
    (results) => results.map((variable): Service => {
      return {
        id: variable.service_id,
        name: variable.display_name,
        serviceLevel: variable.service_level,
        modelId: variable.model_id,
        host: variable.host,
        description: variable.description,
      }
    })
  return APICore.getRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${params.applicationId}/services`, convert)
}

export async function fetchServiceById(params: FetchServicesParam) {
  const convertDetail =
    (result) => (
      {
        id: result.service_id,
        name: result.service_name,
        ...convertKeys(result, camelize)
      }
    )

  if (params.kubernetes) {
    return APICore.getRequest(
      `${process.env.API_HOST}:${process.env.API_PORT}/api/kubernetes/${params.kubernetesId}/applications/${params.applicationId}/services/${params.id}`,
      convertDetail)
  } else {
    return APICore.getRequest(
      `${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${params.applicationId}/services/${params.id}`,
      convertDetail
    )
  }
}

export async function fetchServiceDescriptions(params: FetchServicesParam): Promise<Service[]> {
  const convert =
    (result) => (
      {
        id: result.service_id,
        displayName: result.display_name,
        description: result.description
      }
    )

  if (params.id) {
    return APICore.getRequest(
      `${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${params.applicationId}/services/${params.id}`,
      (result) => [convert(result)]
    )
  } else {
    // Fetch all descriptions
    return APICore.getRequest(
      `${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${params.applicationId}/services`,
      convert
    )
  }
}

// PUT APIs
export interface SwitchModelParam {
  applicationId: string,
  serviceId: string,
  modelId: string,
  kubernetesId?: number
}
export async function switchModel(param: SwitchModelParam) {
  const requestBody = {
    model_id: param.modelId
  }
  const convert = (result) => result.success

  return APICore.putJsonRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${param.applicationId}/services/${param.serviceId}`,
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
  )

  const entryPoints = params.map(
    (param) => (
      param.kubernetesId ?
        `${process.env.API_HOST}:${process.env.API_PORT}/api/kubernetes/${param.kubernetesId}/applications/${param.applicationId}/services/${param.serviceId}`
        : `${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${param.applicationId}/services/${param.serviceId}`
    )
  )
  const convert = (result) => result.success

  return APICore.rawMultiRequest(entryPoints, convert, requestOptions)
}

export interface SynKubernetesStatusParam {
  kubernetesId?: string
  applicationId?: string
}
export async function syncKubernetesStatus(params: SynKubernetesStatusParam): Promise<boolean> {
  const options = {
    method: 'PUT',
    body: new FormData()
  }

  const idUrlString =
   params.kubernetesId && params.applicationId
    ? `${params.kubernetesId}/applications/${params.applicationId}/services`
    : ''
  const convert = (result) => result.status

  return APICore.rawRequest(`${process.env.API_HOST}:${process.env.API_PORT}/api/kubernetes/${idUrlString}`, convert, options)

}

// DELETE APIs
export async function deleteKubernetesHost(params: any): Promise<any> {
  const convert = (result) => result.status

  return APICore.deleteRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/api/kubernetes/${params.kubernetesId}`,
    convert
  )
}

export async function deleteKubernetesServices(params: any): Promise<Array<Promise<boolean>>> {
  const convert = (result) => result.status

  const entryPoints = params.map(
    (param) =>
      `${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${param.applicationId}/services/${param.serviceId}`
  )
  const requestList = params.map(
    (param) => ({ options: { method: 'DELETE' } })
  )

  return APICore.rawMultiRequest<boolean>(entryPoints, convert, requestList)
}

export async function deleteKubernetesModels(params: any): Promise<Array<Promise<boolean>>> {
  const convert = (result) => result.status

  const entryPoints = params.map(
    (param) =>
      `${process.env.API_HOST}:${process.env.API_PORT}/api/applications/${param.applicationId}/models/${param.modelId}`
  )
  const requestList = params.map(
    (param) => ({ options: { method: 'DELETE' } })
  )

  return APICore.rawMultiRequest<boolean>(entryPoints, convert, requestList)
}

// Login API
export interface LoginParam {
  username: string
  password: string
}

export async function login(param: LoginParam) {
  const convert = (result): AuthToken => {
    return {
      jwt: result.jwt
    }
  }
  return APICore.postJsonRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/login`,
    param,
    convert
  )
}

export async function settings(): Promise<any> {
  return APICore.getRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/settings`
  )
}

export async function userInfo(): Promise<UserInfo> {
  const convert = (result): UserInfo => {
    return {
      user: result.user
    }
  }
  return APICore.getRequest(
    `${process.env.API_HOST}:${process.env.API_PORT}/credential`,
    convert
  )
}
