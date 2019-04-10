import { Action } from 'redux'
import { APIError, APIErrorType } from '@src/apis/Core'
import * as Apis from '@src/apis'

export type Actions = APIActions<any> | NotificationActions
export type APIActions<P = {}, S = {}, F = APIError> = APIRequestStartAction<P> | APIRequestSuccessAction<S> | APIRequestFailueAction<F>

export interface APIRequestStartAction<P = {}> extends Action {
  type: string
  params: P
}

export interface APIRequestSuccessAction<S = {}> extends Action {
  type: string
  result: S
}

export interface APIRequestFailueAction<F = APIError> extends Action {
  type: string
  error: F
}

export interface APIRequestUnauthorized<F = APIError> extends Action {
  type: string
  error: F
}

export class APIRequestActionCreators<P = {}, S = {}, F = APIError> {
  request
  failure
  success
  unauthorized
  apiType

  constructor(
    apiType: string
  ) {
    this.apiType = apiType
    const suffix = apiType
    this.failure = (error: F): APIRequestFailueAction<F> => {
      return {type: `${suffix}_FAILURE`, error}
    }
    this.request = (params: P): APIRequestStartAction<P> => {
      return {type: `${suffix}_REQUEST_START`, params}
    }
    this.success = (result: S): APIRequestSuccessAction<S> => {
      return {type: `${suffix}_SUCCESS`, result}
    }
    this.unauthorized = (error: F): APIRequestUnauthorized<F> => {
      return {type: `${suffix}_UNAUTHORIZED`, error}
    }
  }
}

function asyncAPIRequestDispatcherCreator<P = {}, S = {}, F = APIError>(
  actionCreators: APIRequestActionCreators<P, S, F>,
  asyncApi
) {
  return async (dispatch, params: P = {} as P) => {
    dispatch(actionCreators.request(params))
    try {
      const results = await asyncApi(params)
      dispatch(actionCreators.success(results))
    } catch (e) {
      if (e.status === 401) {
        dispatch(actionCreators.unauthorized(e))
      } else {
        dispatch(
          actionCreators.failure(
            e instanceof APIError ? e : new APIError(e.message, APIErrorType.unknown, -1))
        )
      }
    }
  }
}

export const saveProjectActionCreators =
  new APIRequestActionCreators<Apis.ProjectParam, boolean>('SAVE_PROJECT')
export const saveProjectDispatcher = asyncAPIRequestDispatcherCreator<Apis.ProjectParam, boolean>(
  saveProjectActionCreators,
  Apis.saveProject
)

export const saveDataServerActionCreators =
  new APIRequestActionCreators<Apis.DataServerParam, boolean>('SAVE_DATASERVER')
export const saveDataServerDispatcher = asyncAPIRequestDispatcherCreator<Apis.DataServerParam, boolean>(
  saveDataServerActionCreators,
  Apis.saveDataServer
)

export const saveKubernetesActionCreators =
  new APIRequestActionCreators<Apis.KubernetesParam, boolean>('SAVE_KUBERNETES')
export const saveKubernetesDispatcher = asyncAPIRequestDispatcherCreator<Apis.KubernetesParam, boolean>(
  saveKubernetesActionCreators,
  Apis.saveKubernetes
)

export const saveApplicationActionCreators =
  new APIRequestActionCreators<Apis.ApplicationParam, boolean>('SAVE_APPLICATION')
export const saveApplicationDispatcher = asyncAPIRequestDispatcherCreator<Apis.ApplicationParam, boolean>(
  saveApplicationActionCreators,
  Apis.saveApplication
)

export const updateServiceActionCreators =
  new APIRequestActionCreators<Apis.UpdateServiceParam, boolean>('UPDATE_SERVICE')
export const updateServiceDispatcher = asyncAPIRequestDispatcherCreator<Apis.UpdateServiceParam, boolean>(
  updateServiceActionCreators,
  Apis.updateService
)

export const saveServiceDeploymentActionCreators =
  new APIRequestActionCreators<Apis.ServiceDeploymentParam, boolean>('SAVE_SERVICE_DEPLOYMENT')
export const saveServiceDeploymentDispatcher = asyncAPIRequestDispatcherCreator<Apis.ServiceDeploymentParam, boolean>(
  saveServiceDeploymentActionCreators,
  Apis.saveServiceDeployment
)

export const updateServiceRoutingActionCreators =
  new APIRequestActionCreators<Apis.ServiceRoutingParam, boolean>('UPDATE_SERVICE_ROUTING')
export const updateServiceRoutingDispatcher = asyncAPIRequestDispatcherCreator<Apis.ServiceRoutingParam, boolean>(
  updateServiceRoutingActionCreators,
  Apis.updateServiceRouting
)

export const uploadModelActionCreators =
  new APIRequestActionCreators<Apis.UploadModelParam, boolean>('UPLOAD_MODEL')
export const uploadModelDispatcher = asyncAPIRequestDispatcherCreator<Apis.UploadModelParam, boolean>(
  uploadModelActionCreators,
  Apis.uploadModel
)

export const updateModelActionCreators =
  new APIRequestActionCreators<Apis.UpdateModelParam, boolean>('UPDATE_MODEL')
export const updateModelDispatcher = asyncAPIRequestDispatcherCreator<Apis.UpdateModelParam, boolean>(
  updateModelActionCreators,
  Apis.updateModel
)

export const fetchAllProjectsActionCreators =
  new APIRequestActionCreators<{}, Apis.Project[]>('FETCH_ALL_PROJECTS')
export const fetchAllProjectsDispatcher = asyncAPIRequestDispatcherCreator<{}, Apis.Project[]>(
  fetchAllProjectsActionCreators,
  Apis.fetchAllProjects
)

export const fetchProjectByIdActionCreators =
  new APIRequestActionCreators<Apis.FetchProjectByIdParam, Apis.Project>('FETCH_PROJECT_BY_ID')
export const fetchProjectByIdDispatcher = asyncAPIRequestDispatcherCreator<Apis.FetchProjectByIdParam, Apis.Project>(
  fetchProjectByIdActionCreators,
  Apis.fetchProjectById
)

export const fetchDataServerActionCreators =
  new APIRequestActionCreators<Apis.FetchDataServerByIdParam, Apis.DataServer>('FETCH_DATA_SERVER_BY_ID')
export const fetchDataServerDispatcher = asyncAPIRequestDispatcherCreator<Apis.FetchDataServerByIdParam, Apis.DataServer>(
  fetchDataServerActionCreators,
  Apis.fetchDataServer
)

export const fetchIsKubernetesModeActionCreators =
  new APIRequestActionCreators<Apis.FetchKubernetesByIdParam, boolean>('FETCH_IS_KUBERNETES_MODE')
export const fetchIsKubernetesModeDispatcher = asyncAPIRequestDispatcherCreator<Apis.FetchKubernetesByIdParam, boolean>(
  fetchIsKubernetesModeActionCreators,
  Apis.fetchIsKubernetesMode
)

export const fetchAllKubernetesActionCreators =
  new APIRequestActionCreators<Apis.FetchKubernetesByIdParam, Apis.Kubernetes[]>('FETCH_ALL_KUBERNETES')
export const fetchAllKubernetesDispatcher = asyncAPIRequestDispatcherCreator<Apis.FetchKubernetesByIdParam, Apis.Kubernetes[]>(
  fetchAllKubernetesActionCreators,
  Apis.fetchAllKubernetes
)

export const fetchKubernetesByIdActionCreators =
  new APIRequestActionCreators<Apis.FetchKubernetesByIdParam, Apis.Kubernetes>('FETCH_KUBERNETES_BY_ID')
export const fetchKubernetesByIdDispatcher = asyncAPIRequestDispatcherCreator<Apis.FetchKubernetesByIdParam, Apis.Kubernetes>(
  fetchKubernetesByIdActionCreators,
  Apis.fetchKubernetesById
)

export const fetchAllApplicationsActionCreators =
  new APIRequestActionCreators<Apis.FetchApplicationByIdParam, Apis.Application[]>('FETCH_ALL_APPLICATIONS')
export const fetchAllApplicationsDispatcher = asyncAPIRequestDispatcherCreator<Apis.FetchApplicationByIdParam, Apis.Application[]>(
  fetchAllApplicationsActionCreators,
  Apis.fetchAllApplications
)

export const fetchApplicationByIdActionCreators =
  new APIRequestActionCreators<Apis.FetchApplicationByIdParam, Apis.Application>('FETCH_APPLICATION_BY_ID')
export const fetchApplicationByIdDispatcher = asyncAPIRequestDispatcherCreator<Apis.FetchApplicationByIdParam, Apis.Application>(
  fetchApplicationByIdActionCreators,
  Apis.fetchApplicationById
)

export const fetchAllModelsActionCreators =
  new APIRequestActionCreators<Apis.FetchModelByIdParam, Apis.Model[]>('FETCH_ALL_MODELS')
export const fetchAllModelsDispatcher = asyncAPIRequestDispatcherCreator<Apis.FetchModelByIdParam, Apis.Model[]>(
  fetchAllModelsActionCreators,
  Apis.fetchAllModels
)

export const fetchModelByIdActionCreators =
  new APIRequestActionCreators<Apis.FetchModelByIdParam, Apis.Model>('FETCH_MODEL_BY_ID')
export const fetchModelByIdDispatcher = asyncAPIRequestDispatcherCreator<Apis.FetchModelByIdParam, Apis.Model>(
  fetchModelByIdActionCreators,
  Apis.fetchModelById
)

export const fetchAllServicesActionCreators =
  new APIRequestActionCreators<Apis.FetchServiceParam, Apis.Service[]>('FETCH_ALL_SERVICES')
export const fetchAllServicesDispatcher = asyncAPIRequestDispatcherCreator<Apis.FetchServiceParam, Apis.Service[]>(
  fetchAllServicesActionCreators,
  Apis.fetchAllServices
)

export const fetchServiceByIdActionCreators =
  new APIRequestActionCreators<Apis.FetchServiceByIdParam, Apis.Service>('FETCH_SERVICE_BY_ID')
export const fetchServiceByIdDispatcher = asyncAPIRequestDispatcherCreator<Apis.FetchServiceByIdParam, Apis.Service>(
  fetchServiceByIdActionCreators,
  Apis.fetchServiceById
)

export const fetchServiceRouteActionCreators =
  new APIRequestActionCreators<Apis.FetchServiceRouteParam, Apis.ServiceRoute>('FETCH_SERVICE_ROUTE_BY_ID')
export const fetchServiceRouteDispatcher = asyncAPIRequestDispatcherCreator<Apis.FetchServiceRouteParam, Apis.ServiceRoute>(
  fetchServiceRouteActionCreators,
  Apis.fetchServiceRoute
)

export const switchModelsActionCreators =
  new APIRequestActionCreators<Apis.SwitchModelParam[], boolean[]>('SWITCH_MODELS')
export const switchModelsDispatcher = asyncAPIRequestDispatcherCreator<Apis.SwitchModelParam[], boolean[]>(
  switchModelsActionCreators,
  Apis.switchModels
)

export const syncKubernetesActionCreators =
  new APIRequestActionCreators<Apis.SyncKubernetesParam, boolean>('SYNC_KUBERNETES_STATUS')
export const syncKubernetesDispatcher = asyncAPIRequestDispatcherCreator<Apis.SyncKubernetesParam, boolean>(
  syncKubernetesActionCreators,
  Apis.syncKubernetes
)

export const deleteKubernetesActionCreators =
  new APIRequestActionCreators<Apis.IdParam, boolean>('DELETE_KUBERNETES')
export const deleteKubernetesDispatcher = asyncAPIRequestDispatcherCreator<Apis.IdParam, boolean>(
  deleteKubernetesActionCreators,
  Apis.deleteKubernetes
)

export const deleteDataServerActionCreators =
  new APIRequestActionCreators<Apis.IdParam, boolean>('DELETE_DATA_SERVER')
export const deleteDataServerDispatcher = asyncAPIRequestDispatcherCreator<Apis.IdParam, boolean>(
  deleteDataServerActionCreators,
  Apis.deleteDataServer
)

export const deleteApplicationActionCreators =
  new APIRequestActionCreators<Apis.IdParam, boolean>('DELETE_APPLICATION')
export const deleteApplicationDispatcher = asyncAPIRequestDispatcherCreator<Apis.IdParam, boolean>(
  deleteApplicationActionCreators,
  Apis.deleteApplication
)

export const deleteServicesActionCreators =
  new APIRequestActionCreators<Apis.IdParam[], boolean[]>('DELETE_SERVICES')
export const deleteServicesDispatcher = asyncAPIRequestDispatcherCreator<Apis.IdParam[], boolean[]>(
  deleteServicesActionCreators,
  Apis.deleteServices
)

export const deleteModelsActionCreators =
  new APIRequestActionCreators<Apis.IdParam[], boolean[]>('DELETE_MODELS')
export const deleteModelsDispatcher = asyncAPIRequestDispatcherCreator<Apis.IdParam[], boolean[]>(
  deleteModelsActionCreators,
  Apis.deleteModels
)

// Login
export const settingsActionCreators =
  new APIRequestActionCreators<{}, any>('SETTINGS')
export const settingsDispatcher = asyncAPIRequestDispatcherCreator<{}, any>(
  settingsActionCreators,
  Apis.settings
)

export const loginActionCreators =
  new APIRequestActionCreators<Apis.LoginParam, Apis.AuthToken>('LOGIN')
export const loginDispatcher = asyncAPIRequestDispatcherCreator<Apis.LoginParam, Apis.AuthToken>(
  loginActionCreators,
  Apis.login
)

export const userInfoActionCreators =
  new APIRequestActionCreators<{}, Apis.UserInfo>('USER_INFO')
export const userInfoDispatcher = asyncAPIRequestDispatcherCreator<{}, Apis.UserInfo>(
  userInfoActionCreators,
  Apis.userInfo
)

export const fetchAllUsersActionCreators =
  new APIRequestActionCreators<{}, Apis.UserInfo[]>('ALL_USERS')
export const fetchAllUsersDispatcher = asyncAPIRequestDispatcherCreator<{}, Apis.UserInfo[]>(
  fetchAllUsersActionCreators,
  Apis.fetchAllUsers
)

export const fetchProjectAccessControlListActionCreators =
  new APIRequestActionCreators<Apis.AccessControlParam, Apis.ProjectAccessControlList[]>('FETCH_PROJECT_ACCESS_CONTROL_LIST')
export const fetchProjectAccessControlListDispatcher = asyncAPIRequestDispatcherCreator<Apis.AccessControlParam, Apis.ProjectAccessControlList[]>(
  fetchProjectAccessControlListActionCreators,
  Apis.fetchProjectAccessControlList
)

export const saveProjectAccessControlActionCreators = new APIRequestActionCreators<Apis.AccessControlParam, boolean>('SAVE_PROJECT_ACCESS_CONTROL')
export const saveProjectAccessControlDispatcher = asyncAPIRequestDispatcherCreator<Apis.AccessControlParam, boolean>(
  saveProjectAccessControlActionCreators,
  Apis.saveProjectAccessControl
)

export const deleteProjectAccessControlActionCreators = new APIRequestActionCreators<Apis.AccessControlParam, boolean>('DELETE_PROJECT_ACCESS_CONTROL')
export const deleteProjectAccessControlDispatcher = asyncAPIRequestDispatcherCreator<Apis.AccessControlParam, boolean>(
  deleteProjectAccessControlActionCreators,
  Apis.deleteProjectAccessControl
)

export const fetchApplicationAccessControlListActionCreators =
  new APIRequestActionCreators<Apis.AccessControlParam, Apis.ApplicationAccessControlList[]>('FETCH_APPLICATION_ACCESS_CONTROL_LIST')
export const fetchApplicationAccessControlListDispatcher = asyncAPIRequestDispatcherCreator<Apis.AccessControlParam, Apis.ApplicationAccessControlList[]>(
  fetchApplicationAccessControlListActionCreators,
  Apis.fetchApplicationAccessControlList
)

export const saveApplicationAccessControlActionCreators = new APIRequestActionCreators<Apis.AccessControlParam, boolean>('SAVE_APPLICATION_ACCESS_CONTROL')
export const saveApplicationAccessControlDispatcher = asyncAPIRequestDispatcherCreator<Apis.AccessControlParam, boolean>(
  saveApplicationAccessControlActionCreators,
  Apis.saveApplicationAccessControl
)

export const deleteApplicationAccessControlActionCreators = new APIRequestActionCreators<Apis.AccessControlParam, boolean>('DELETE_APPLICATION_ACCESS_CONTROL')
export const deleteApplicationAccessControlDispatcher = asyncAPIRequestDispatcherCreator<Apis.AccessControlParam, boolean>(
  deleteApplicationAccessControlActionCreators,
  Apis.deleteApplicationAccessControl
)

// Notification actions
export type NotificationActions = AddNotificationAction | DismissNotificationAction

export interface AddNotificationAction extends Action {
  type: 'NOTIFICATION_OPEN'
  properties
}

export interface DismissNotificationAction extends Action {
  type: 'NOTIFICATION_DISMISS'
  id: number
}

export function addNotification(notificationProps): AddNotificationAction {
  return {
    type: 'NOTIFICATION_OPEN',
    properties: notificationProps
  }
}

export function dismissNotification(id: number): DismissNotificationAction {
  return {
    type: 'NOTIFICATION_DISMISS',
    id
  }
}
