import { Action } from 'redux'
import { APIError, APIErrorType } from '@src/apis/Core'
import {
  addApplication, saveService, saveKubernetesHost,
  fetchAllApplications, fetchAllModels, fetchAllServices,
  fetchApplicationById, fetchKubernetesHostById,
  fetchServiceById, FetchServicesParam, fetchServiceDescriptions,
  fetchAllKubernetesHosts,
  uploadModel, switchModels, syncKubernetesStatus,
  deleteKubernetesHost, deleteKubernetesServices,
  settings, login, userInfo,
  SaveServiceParam, SwitchModelParam, ModelResponse, KubernetesHost, LoginParam, AuthToken, UserInfo
} from '@src/apis'
import { Application, Model, Service } from '@src/apis'

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

export const uploadModelActionCreators = new APIRequestActionCreators<{name: string, description: string}, ModelResponse>('UPLOAD_MODEL')
export const uploadModelDispatcher = asyncAPIRequestDispatcherCreator<{name: string, description: string}, ModelResponse>(
  uploadModelActionCreators,
  uploadModel
)

export const saveKubernetesHostActionCreators =
   new APIRequestActionCreators<{name: string, description: string}, boolean>('SAVE_CONNECTION')
export const saveKubernetesHostDispatcher = asyncAPIRequestDispatcherCreator<any, boolean>(
  saveKubernetesHostActionCreators,
  saveKubernetesHost
)

export const addApplicationActionCreators = new APIRequestActionCreators<{name: string, description: string}, boolean>('ADD_CLIENT')
export const addApplicationDispatcher = asyncAPIRequestDispatcherCreator<{name: string, description: string}, boolean>(
  addApplicationActionCreators,
  addApplication
)

export const saveServiceActionCreators = new APIRequestActionCreators<SaveServiceParam, boolean>('SAVE_SERVICE')
export const saveServiceDispatcher = asyncAPIRequestDispatcherCreator<SaveServiceParam, boolean>(
  saveServiceActionCreators,
  saveService
)

export const fetchAllKubernetesHostsActionCreators = new APIRequestActionCreators<{}, KubernetesHost[]>('FETCH_ALL_CONNECTIONS')
export const fetchAllKubernetesHostsDispatcher = asyncAPIRequestDispatcherCreator<{}, KubernetesHost[]>(
  fetchAllKubernetesHostsActionCreators,
  fetchAllKubernetesHosts
)

export const fetchAllApplicationsActionCreators = new APIRequestActionCreators<{}, Application[]>('FETCH_ALL_CLIENTS')
export const fetchAllApplicationsDispatcher = asyncAPIRequestDispatcherCreator<{}, Application[]>(
  fetchAllApplicationsActionCreators,
  fetchAllApplications
)

export const fetchApplicationByIdActionCreators = new APIRequestActionCreators<{id: string}, Application>('FETCH_CLIENT_BY_ID')
export const fetchApplicationByIdDispatcher = asyncAPIRequestDispatcherCreator<{id: string}, Application>(
  fetchApplicationByIdActionCreators,
  fetchApplicationById
)

export const fetchKubernetesHostByIdActionCreators = new APIRequestActionCreators<{id: string}, any>('FETCH_KUBERNETES_CONNECTION_BY_ID')
export const fetchKubernetesHostByIdDispatcher = asyncAPIRequestDispatcherCreator<{id: string}, any>(
  fetchKubernetesHostByIdActionCreators,
  fetchKubernetesHostById
)

export const fetchAllModelsActionCreators = new APIRequestActionCreators<{application_id: string}, Model[]>('FETCH_ALL_MODELS')
export const fetchAllModelsDispatcher = asyncAPIRequestDispatcherCreator<{application_id: string}, Model[]>(
  fetchAllModelsActionCreators,
  fetchAllModels
)

export const fetchAllServicesActionCreators = new APIRequestActionCreators<FetchServicesParam, Service[]>('FETCH_ALL_SERVICES')
export const fetchAllServicesDispatcher = asyncAPIRequestDispatcherCreator<FetchServicesParam, Service[]>(
  fetchAllServicesActionCreators,
  fetchAllServices
)

export const fetchServiceByIdActionCreators = new APIRequestActionCreators<FetchServicesParam, Service>('FETCH_SERVICE')
export const fetchServiceByIdDispatcher = asyncAPIRequestDispatcherCreator<FetchServicesParam, Service>(
  fetchServiceByIdActionCreators,
  fetchServiceById
)

export const fetchServiceDescriptionsActionCreators = new APIRequestActionCreators<FetchServicesParam, Service[]>('FETCH_SERVICE_DESCRIPTIONS')
export const fetchServiceDescriptionsDispatcher = asyncAPIRequestDispatcherCreator<FetchServicesParam, Service[]>(
  fetchServiceDescriptionsActionCreators,
  fetchServiceDescriptions
)

export const switchModelsActionCreators = new APIRequestActionCreators<SwitchModelParam[], boolean[]>('SWITCH_MODELS')
export const switchModelsDispatcher = asyncAPIRequestDispatcherCreator<SwitchModelParam[], boolean[]>(
  switchModelsActionCreators,
  switchModels
)

export const deleteKubernetesHostActionCreators = new APIRequestActionCreators<{id: number}, boolean>('DELETE_KUBERNETES_CONNECTION')
export const deleteKubernetesHostDispatcher = asyncAPIRequestDispatcherCreator<{id: number}, boolean>(
  deleteKubernetesHostActionCreators,
  deleteKubernetesHost
)

export const deleteKubernetesServicesActionCreators = new APIRequestActionCreators<any, boolean[]>('DELETE_KUBERNETES_SERVICE')
export const deleteKubernetesServicesDispatcher = asyncAPIRequestDispatcherCreator<any, boolean[]>(
  deleteKubernetesServicesActionCreators,
  deleteKubernetesServices
)

export const syncKubernetesStatusActionCreators = new APIRequestActionCreators<any, boolean>('SYNC_KUBERNETES_STATUS')
export const syncKubernetesStatusDispatcher = asyncAPIRequestDispatcherCreator<any, boolean>(
  syncKubernetesStatusActionCreators,
  syncKubernetesStatus
)

export const settingsActionCreators = new APIRequestActionCreators<{}, any>('SETTINGS')
export const settingsDispatcher = asyncAPIRequestDispatcherCreator<{}, any>(
  settingsActionCreators,
  settings
)

export const loginActionCreators = new APIRequestActionCreators<LoginParam, AuthToken>('LOGIN')
export const loginDispatcher = asyncAPIRequestDispatcherCreator<LoginParam, AuthToken>(
  loginActionCreators,
  login
)

export const userInfoActionCreators = new APIRequestActionCreators<{}, UserInfo>('USER_INFO')
export const userInfoDispatcher = asyncAPIRequestDispatcherCreator<{}, UserInfo>(
  userInfoActionCreators,
  userInfo
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
