import {APIRequest, APIRequestStatusList} from '@src/apis/Core'
import * as Apis from '@src/apis'
import * as Actions from '@src/actions'

export class AppState {
  constructor(
    // API states
    public saveProject: APIRequest<boolean> = { status: APIRequestStatusList.notStarted},
    public saveDataServer: APIRequest<boolean> = { status: APIRequestStatusList.notStarted},
    public saveKubernetes: APIRequest<boolean> = { status: APIRequestStatusList.notStarted},
    public saveApplication: APIRequest<boolean> = { status: APIRequestStatusList.notStarted},
    public updateService: APIRequest<boolean> = { status: APIRequestStatusList.notStarted},
    public saveServiceDeployment: APIRequest<boolean> = { status: APIRequestStatusList.notStarted},
    public updateServiceRouting: APIRequest<boolean> = { status: APIRequestStatusList.notStarted},
    public uploadModel: APIRequest<boolean> = { status: APIRequestStatusList.notStarted},
    public updateModel: APIRequest<boolean> = { status: APIRequestStatusList.notStarted},
    public fetchAllProjects: APIRequest<Apis.Project[]> = { status: APIRequestStatusList.notStarted},
    public fetchProjectById: APIRequest<Apis.Project> = { status: APIRequestStatusList.notStarted},
    public fetchDataServer: APIRequest<Apis.DataServer> = { status: APIRequestStatusList.notStarted},
    public fetchIsKubernetesMode: APIRequest<boolean> = { status: APIRequestStatusList.notStarted},
    public fetchAllKubernetes: APIRequest<Apis.Kubernetes[]> = { status: APIRequestStatusList.notStarted},
    public fetchKubernetesById: APIRequest<Apis.Kubernetes> = { status: APIRequestStatusList.notStarted},
    public fetchAllApplications: APIRequest<Apis.Application[]> = { status: APIRequestStatusList.notStarted},
    public fetchApplicationById: APIRequest<Apis.Application> = { status: APIRequestStatusList.notStarted},
    public fetchAllModels: APIRequest<Apis.Model[]> = { status: APIRequestStatusList.notStarted},
    public fetchModelById: APIRequest<Apis.Model> = { status: APIRequestStatusList.notStarted},
    public fetchAllServices: APIRequest<Apis.Service[]> = { status: APIRequestStatusList.notStarted},
    public fetchServiceById: APIRequest<Apis.Service> = { status: APIRequestStatusList.notStarted},
    public fetchServiceRouting: APIRequest<Apis.ServiceRouting> = { status: APIRequestStatusList.notStarted},
    public switchModels: APIRequest<boolean[]> = { status: APIRequestStatusList.notStarted},
    public syncKubernetes: APIRequest<boolean> = { status: APIRequestStatusList.notStarted },
    public deleteKubernetes: APIRequest<boolean> = { status: APIRequestStatusList.notStarted },
    public deleteDataServer: APIRequest<boolean> = { status: APIRequestStatusList.notStarted },
    public deleteApplication: APIRequest<boolean> = { status: APIRequestStatusList.notStarted },
    public deleteServices: APIRequest<boolean[]> = { status: APIRequestStatusList.notStarted },
    public deleteModels: APIRequest<boolean[]> = { status: APIRequestStatusList.notStarted },
    public login: APIRequest<Apis.AuthToken> = { status: APIRequestStatusList.notStarted },
    public settings: APIRequest<{}> = { status: APIRequestStatusList.notStarted },
    public userInfo: APIRequest<Apis.UserInfo> = { status: APIRequestStatusList.notStarted },
    public fetchAllUsers: APIRequest<Apis.UserInfo[]> = { status: APIRequestStatusList.notStarted },
    public fetchProjectAccessControlList: APIRequest<Apis.ProjectAccessControlList[]> = { status: APIRequestStatusList.notStarted },
    public saveProjectAccessControl: APIRequest<boolean> = { status: APIRequestStatusList.notStarted },
    public deleteProjectAccessControl: APIRequest<boolean> = { status: APIRequestStatusList.notStarted },
    public fetchApplicationAccessControlList: APIRequest<Apis.ApplicationAccessControlList[]> = { status: APIRequestStatusList.notStarted },
    public saveApplicationAccessControl: APIRequest<boolean> = { status: APIRequestStatusList.notStarted },
    public deleteApplicationAccessControl: APIRequest<boolean> = { status: APIRequestStatusList.notStarted },
    // Notification status
    public notification = { toasts: [], id: -1 },
    public navigation = { login: false }
  ) { }
}

const initialState = new AppState()

function APIRequestReducerCreator<P = {}, S = {}, F = {}>(
  actionCreators: Actions.APIRequestActionCreators<P, S, F>,
  statePropertyName: string
) {
  function reducer(state: AppState = initialState, action: Actions.APIActions<P, S, F>) {
    const suffix: string = actionCreators.apiType
    const nextState: AppState = Object.assign({}, state)

    const isStarted = (item: any): item is Actions.APIRequestStartAction =>
      item.type === `${suffix}_REQUEST_START`
    const isFailed = (item: any): item is Actions.APIRequestFailueAction =>
      item.type === `${suffix}_FAILURE`
    const isSuccess = (item: any): item is Actions.APIRequestSuccessAction =>
      item.type === `${suffix}_SUCCESS`
    const isUnauthorized = (item: any): item is Actions.APIRequestUnauthorized =>
      item.type === `${suffix}_UNAUTHORIZED`

    if (isStarted(action)) {
      nextState[statePropertyName] = { status: APIRequestStatusList.fetching }
    } else if (isFailed(action)) {
      nextState[statePropertyName] = { status: APIRequestStatusList.failue, error: action.error }
    } else if (isSuccess(action)) {
      nextState[statePropertyName] = { status: APIRequestStatusList.success, result: action.result }
    } else if (isUnauthorized(action)) {
      nextState[statePropertyName] = { status: APIRequestStatusList.unauhorized, error: action.error }
    } else {
      return state
    }

    return nextState
  }
  return reducer
}

export const saveProjectReducer = APIRequestReducerCreator<Apis.ProjectParam, boolean>(
  Actions.saveProjectActionCreators, 'saveProject')
export const saveDataServerReducer = APIRequestReducerCreator<Apis.DataServerParam, boolean>(
  Actions.saveDataServerActionCreators, 'saveDataServer')
export const saveKubernetesReducer = APIRequestReducerCreator<Apis.KubernetesParam, boolean>(
  Actions.saveKubernetesActionCreators, 'saveKubernetes')
export const saveApplicationReducer = APIRequestReducerCreator<Apis.ApplicationParam, boolean>(
  Actions.saveApplicationActionCreators, 'saveApplication')
export const updateServiceReducer = APIRequestReducerCreator<Apis.UpdateServiceParam, boolean>(
  Actions.updateServiceActionCreators, 'updateService')
export const saveServiceDeploymentReducer = APIRequestReducerCreator<Apis.ServiceDeploymentParam, boolean>(
  Actions.saveServiceDeploymentActionCreators, 'saveServiceDeployment')
export const updateServiceRoutingReducer = APIRequestReducerCreator<Apis.ServiceRoutingParam, boolean>(
  Actions.updateServiceRoutingActionCreators, 'updateServiceRouting')
export const uploadModelReducer = APIRequestReducerCreator<Apis.UploadModelParam, boolean>(
  Actions.uploadModelActionCreators, 'uploadModel')
export const updateModelReducer = APIRequestReducerCreator<Apis.UpdateModelParam, boolean>(
  Actions.updateModelActionCreators, 'updateModel')
export const fetchAllProjectsReducer = APIRequestReducerCreator<{}, Apis.Project[]>(
  Actions.fetchAllProjectsActionCreators, 'fetchAllProjects')
export const fetchProjectByIdReducer = APIRequestReducerCreator<Apis.FetchProjectByIdParam, Apis.Project>(
  Actions.fetchProjectByIdActionCreators, 'fetchProjectById')
export const fetchDataServerReducer = APIRequestReducerCreator<Apis.FetchDataServerByIdParam, Apis.DataServer>(
  Actions.fetchDataServerActionCreators, 'fetchDataServer')
export const fetchIsKubernetesModeReducer = APIRequestReducerCreator<Apis.FetchKubernetesByIdParam, boolean>(
  Actions.fetchIsKubernetesModeActionCreators, 'fetchIsKubernetesMode')
export const fetchAllKubernetesReducer = APIRequestReducerCreator<Apis.FetchKubernetesByIdParam, Apis.Kubernetes[]>(
  Actions.fetchAllKubernetesActionCreators, 'fetchAllKubernetes')
export const fetchKubernetesByIdReducer = APIRequestReducerCreator<Apis.FetchKubernetesByIdParam, Apis.Kubernetes>(
  Actions.fetchKubernetesByIdActionCreators, 'fetchKubernetesById')
export const fetchAllApplicationsReducer = APIRequestReducerCreator<Apis.FetchApplicationByIdParam, Apis.Application[]>(
  Actions.fetchAllApplicationsActionCreators, 'fetchAllApplications')
export const fetchApplicationByIdReducer = APIRequestReducerCreator<Apis.FetchApplicationByIdParam, Apis.Application>(
  Actions.fetchApplicationByIdActionCreators, 'fetchApplicationById')
export const fetchAllModelsReducer = APIRequestReducerCreator<Apis.FetchModelByIdParam, Apis.Model[]>(
  Actions.fetchAllModelsActionCreators, 'fetchAllModels')
export const fetchModelByIdReducer = APIRequestReducerCreator<Apis.FetchModelByIdParam, Apis.Model>(
  Actions.fetchModelByIdActionCreators, 'fetchModelById')
export const fetchAllServicesReducer = APIRequestReducerCreator<Apis.FetchServiceParam, Apis.Service[]>(
  Actions.fetchAllServicesActionCreators, 'fetchAllServices')
export const fetchServiceByIdReducer = APIRequestReducerCreator<Apis.FetchServiceByIdParam, Apis.Service>(
  Actions.fetchServiceByIdActionCreators, 'fetchServiceById')
export const fetchServiceRoutingReducer = APIRequestReducerCreator<Apis.FetchServiceRoutingParam, Apis.ServiceRouting>(
  Actions.fetchServiceRoutingActionCreators, 'fetchServiceRouting')
export const switchModelsReducer = APIRequestReducerCreator<Apis.SwitchModelParam[], boolean[]>(
  Actions.switchModelsActionCreators, 'switchModels')
export const syncKubernetesReducer = APIRequestReducerCreator<Apis.SyncKubernetesParam, boolean[]>(
  Actions.syncKubernetesActionCreators, 'syncKubernetes')
export const deleteKubernetesReducer = APIRequestReducerCreator<Apis.IdParam, boolean>(
  Actions.deleteKubernetesActionCreators, 'deleteKubernetes')
export const deleteDataServerReducer = APIRequestReducerCreator<Apis.IdParam, boolean>(
  Actions.deleteDataServerActionCreators, 'deleteDataServer')
export const deleteApplicationReducer = APIRequestReducerCreator<Apis.IdParam, boolean>(
  Actions.deleteApplicationActionCreators, 'deleteApplication')
export const deleteServicesReducer = APIRequestReducerCreator<Apis.IdParam[], boolean[]>(
  Actions.deleteServicesActionCreators, 'deleteServices')
export const deleteModelsReducer = APIRequestReducerCreator<Apis.IdParam[], boolean[]>(
  Actions.deleteModelsActionCreators, 'deleteModels')
export const loginReducer = APIRequestReducerCreator<Apis.LoginParam, Apis.AuthToken>(
  Actions.loginActionCreators, 'login')
export const settingsReducer = APIRequestReducerCreator<{}, any>(
  Actions.settingsActionCreators, 'settings')
export const userInfoReducer = APIRequestReducerCreator<{}, Apis.UserInfo>(
  Actions.userInfoActionCreators, 'userInfo')
export const fetchAllUsersReducer = APIRequestReducerCreator<{}, Apis.UserInfo[]>(
  Actions.fetchAllUsersActionCreators, 'fetchAllUsers')
export const fetchProjectAccessControlListReducer = APIRequestReducerCreator<Apis.AccessControlParam, Apis.ProjectAccessControlList[]>(
  Actions.fetchProjectAccessControlListActionCreators, 'fetchProjectAccessControlList')
export const saveProjectAccessControlReducer = APIRequestReducerCreator<Apis.AccessControlParam, boolean>(
  Actions.saveProjectAccessControlActionCreators, 'saveProjectAccessControl')
export const deleteProjectAccessControlReducer = APIRequestReducerCreator<Apis.AccessControlParam, boolean>(
  Actions.deleteProjectAccessControlActionCreators, 'deleteProjectAccessControl')
export const fetchApplicationAccessControlListReducer = APIRequestReducerCreator<Apis.AccessControlParam, Apis.ApplicationAccessControlList[]>(
  Actions.fetchApplicationAccessControlListActionCreators, 'fetchApplicationAccessControlList')
export const saveApplicationAccessControlReducer = APIRequestReducerCreator<Apis.AccessControlParam, boolean>(
  Actions.saveApplicationAccessControlActionCreators, 'saveApplicationAccessControl')
export const deleteApplicationAccessControlReducer = APIRequestReducerCreator<Apis.AccessControlParam, boolean>(
  Actions.deleteApplicationAccessControlActionCreators, 'deleteApplicationAccessControl')

/**
 * Notification with toasts
 *
 * @param state
 * @param action
 */
export function notificationReducer(state: AppState = initialState, action): AppState {
  const { type } = action

  switch (type) {
    case 'NOTIFICATION_OPEN':
      const nextId = state.notification.id + 1
      const toastProp = {
        ...action.properties,
        id: nextId
      }
      const openNextNotification = {
        toasts: [toastProp].concat(state.notification.toasts),
        id: nextId
      }
      return {
        ...state,
        notification: openNextNotification
      }

    case 'NOTIFICATION_DISMISS':
      const dismissNextNotification = {
        ...state.notification,
        toasts: state.notification.toasts.filter(
          (toast) => toast.id !== action.id
        )
      }
      return {
        ...state,
        notification: dismissNextNotification
      }

    default:
      return state
  }
}
