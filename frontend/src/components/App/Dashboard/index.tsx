import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Button, Modal, ModalBody, ModalHeader, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  Model, Service, SwitchModelParam, SyncKubernetesParam,
  Application, UserInfo,
  FetchApplicationByIdParam, FetchModelByIdParam, FetchServiceParam,
  IdParam, FetchKubernetesByIdParam, Kubernetes
} from '@src/apis'
import {
  addNotification,
  fetchApplicationByIdDispatcher,
  fetchAllModelsDispatcher,
  fetchAllServicesDispatcher,
  switchModelsDispatcher,
  deleteServicesDispatcher,
  deleteModelsDispatcher,
  syncKubernetesDispatcher, fetchAllKubernetesDispatcher
} from '@src/actions'
import { AddModelFileModal } from '@components/App/Model/Modals/AddModelFileModal'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import DashboardStatusForm from './DashboardStatusForm'


export enum ControlMode {
  VIEW_DEPLOY_STATUS,
  EDIT_DEPLOY_STATUS,
  SELECT_TARGETS,
  UPLOAD_MODEL,
  EVALUATE_MODELS
}

interface DashboardStatusState {
  controlMode: ControlMode
  isDeleteModalOpen: boolean
  isAddModelFileModalOpen: boolean
  selectedData: { services: any[], models: any[] }
  submitted: boolean
  notified: boolean
  syncSubmitted: boolean
  syncNotified: boolean
}

type DashboardStatusProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string}>

class Dashboard extends React.Component<DashboardStatusProps, DashboardStatusState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      controlMode: ControlMode.VIEW_DEPLOY_STATUS,
      isDeleteModalOpen: false,
      isAddModelFileModalOpen: false,
      selectedData: { services: [], models: [] },
      submitted: false,
      notified: false,
      syncSubmitted: false,
      syncNotified: false
    }

    this.onSubmitDashboardStatusChanges = this.onSubmitDashboardStatusChanges.bind(this)
    this.onSubmitDelete = this.onSubmitDelete.bind(this)
    this.deleteServices = this.deleteServices.bind(this)
    this.deleteModels = this.deleteModels.bind(this)
    this.toggleDeleteModal = this.toggleDeleteModal.bind(this)
    this.toggleAddModelFileModalOpen = this.toggleAddModelFileModalOpen.bind(this)
    this.syncKubernetes = this.syncKubernetes.bind(this)
    this.renderDashboardStatus = this.renderDashboardStatus.bind(this)
    this.changeMode = this.changeMode.bind(this)
    this.complete = this.complete.bind(this)
  }

  componentDidMount() {
    const { projectId, applicationId } = this.props.match.params
    const params = {
      projectId,
      applicationId
    }

    this.props.fetchApplicationById(params)
    this.props.fetchAllModels(params)
    this.props.fetchAllServices(params)
  }

  static getDerivedStateFromProps(nextProps: DashboardStatusProps, prevState: DashboardStatusState){
    const {
      switchModelsStatus,
      deleteServicesStatus,
      deleteModelsStatus,
      syncKubernetesStatus
    } = nextProps
    const { projectId, applicationId } = nextProps.match.params
    const params = {
      projectId,
      applicationId
    }
    const { controlMode, submitted, syncSubmitted, syncNotified } = prevState

    const checkAllApiResultSucceeded =
      (result: APIRequest<boolean[]>) =>
        isAPISucceeded<boolean[]>(result) &&
        result.result.reduce((p, c) => (p && c))
    const checkAllApiResultFailed =
      (result: APIRequest<boolean[]>) =>
        (isAPISucceeded<boolean[]>(result) && !result.result.reduce((p, c) => (p && c))) || isAPIFailed<boolean[]>(result)

    // Switch to view mode when API successfully connected
    if (submitted && controlMode === ControlMode.EDIT_DEPLOY_STATUS) {
      if (checkAllApiResultSucceeded(switchModelsStatus)) {
        nextProps.addNotification({ color: 'success', message: 'Successfully changed deployment' })
      } else {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong with switching models, try again later' })
      }
      nextProps.fetchAllModels(params)
      nextProps.fetchAllServices(params)
      return {
        controlMode: ControlMode.VIEW_DEPLOY_STATUS,
        submitted: false,
        notified: true,
        selectedData: { services: [], models: [] }
      }
    }

    if (submitted && controlMode === ControlMode.SELECT_TARGETS) {
      if (checkAllApiResultSucceeded(deleteServicesStatus)) {
        nextProps.addNotification({ color: 'success', message: 'Successfully changed deletion services' })
      } else if (checkAllApiResultFailed(deleteServicesStatus)) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong with deletion services, try again later' })
      }
      if (checkAllApiResultSucceeded(deleteModelsStatus)) {
        nextProps.addNotification({ color: 'success', message: 'Successfully changed deletion models' })
      } else if (checkAllApiResultFailed(deleteModelsStatus)) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong with deletion models, try again later' })
      }
      nextProps.fetchAllModels(params)
      nextProps.fetchAllServices(params)
      return {
        controlMode: ControlMode.VIEW_DEPLOY_STATUS,
        submitted: false,
        notified: true,
        selectedData: { services: [], models: [] }
      }
    }

    if (syncSubmitted && !syncNotified) {
      const succeeded: boolean = isAPISucceeded<boolean>(syncKubernetesStatus) && syncKubernetesStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(syncKubernetesStatus) && !syncKubernetesStatus.result) || isAPIFailed<boolean>(syncKubernetesStatus)

      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully synced application' })
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong with sync application. Try again later' })
      }
      nextProps.fetchAllModels(params)
      nextProps.fetchAllServices(params)
      return {
        controlMode: ControlMode.VIEW_DEPLOY_STATUS,
        submitted: false,
        notified: true,
        syncSubmitted: false,
        syncNotified: true,
        selectedData: { services: [], models: [] }
      }
    }
  }

  // Render methods

  render(): JSX.Element {
    const { application, models, services, userInfoStatus, settings } = this.props
    const statuses: any = { models, services, application }
    if (isAPISucceeded(settings) && settings.result.auth) {
      statuses.userInfoStatus = userInfoStatus
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={statuses}
        render={this.renderDashboardStatus}
        projectId={this.props.match.params.projectId}
        applicationId={this.props.match.params.applicationId}
      />
    )
  }

  /**
   * Render deploy status / related form fields
   * with fetched API results
   *
   * @param fetchedResults Fetched data from APIs
   * @param canEdit Boolean value of user's editor permission
   */
  renderDashboardStatus(fetchedResults, canEdit): JSX.Element {
    const { controlMode } = this.state
    const {
      onSubmitDashboardStatusChanges,
      onSubmitDelete,
      changeMode
    } = this
    const kubernetesMode = fetchedResults.kuberneteses.length > 0
    const applicationName = fetchedResults.application.name
    const { projectId, applicationId } = this.props.match.params

    const services: Service[] = fetchedResults.services
    const models: Model[] = fetchedResults.models
    const deployStatus = this.makeDashboardStatus(services)
    const onSubmitMap: { [mode: number]: (params: any) => Promise<void> } = {
      [ControlMode.VIEW_DEPLOY_STATUS]: onSubmitDashboardStatusChanges, // Dummy to render form
      [ControlMode.EDIT_DEPLOY_STATUS]: onSubmitDashboardStatusChanges,
      [ControlMode.SELECT_TARGETS]: onSubmitDelete,
    }

    // Render contents to control deploy status
    switch (controlMode) {
      case ControlMode.VIEW_DEPLOY_STATUS:
      case ControlMode.EDIT_DEPLOY_STATUS:
      case ControlMode.SELECT_TARGETS:
        return (
          this.renderContent(
            <DashboardStatusForm
              projectId={projectId}
              applicationId={applicationId}
              services={services}
              models={models}
              deployStatus={deployStatus}
              mode={controlMode}
              onSubmit={onSubmitMap[controlMode]}
              changeMode={changeMode}
              canEdit={canEdit} />,
            applicationName,
            kubernetesMode,
            canEdit
          )
        )

      case ControlMode.EVALUATE_MODELS:
        return (
          this.renderContent(
            <div>TBD</div>,
            applicationName,
            kubernetesMode,
            canEdit
          )
        )
    }
  }

  renderContent = (content: JSX.Element, applicationName, kubernetesMode, canEdit: boolean): JSX.Element => {
    return (
      <div className='pb-5'>
        {this.renderTitle(applicationName, kubernetesMode, canEdit)}
        <AddModelFileModal
          projectId={this.props.match.params.projectId}
          applicationId={this.props.match.params.applicationId}
          isModalOpen={this.state.isAddModelFileModalOpen}
          toggle={this.toggleAddModelFileModalOpen}
          reload={this.complete}
        />
        <h3>
          <i className='fas fa-signal fa-fw mr-2'></i>
          Service Status
        </h3>
        <hr />
        {content}
        {
          this.state.controlMode === ControlMode.SELECT_TARGETS
            ? this.renderConfirmDeleteModal()
            : null
        }
      </div>
    )
  }

  renderTitle = (applicationName, kubernetesMode, canEdit: boolean): JSX.Element => {
    const buttons = (
      <Col xs='5' className='text-right'>
        <Button
          color='primary'
          size='sm'
          onClick={this.toggleAddModelFileModalOpen}>
          <i className='fas fa-robot fa-fw mr-2'></i>
          Add Model
        </Button>
        {' '}
        {kubernetesMode && canEdit ? this.renderKubernetesControlButtons() : null}
      </Col>
    )
    return (
      <Row className='align-items-center mb-5'>
        <Col xs='7'>
          <h1>
            <i className='fas fa-ship fa-fw mr-2'></i>
            {applicationName}
          </h1>
        </Col>
        {canEdit ? buttons : null}
      </Row>
    )
  }

  renderKubernetesControlButtons() {
    const { push } = this.props.history
    const { syncKubernetes } = this
    const { projectId, applicationId } = this.props.match.params

    return (
      <React.Fragment>
        <Button
          color='primary'
          size='sm'
          onClick={() => { push(`/projects/${projectId}/applications/${applicationId}/services/add`) }}
        >
          <i className='fas fa-box fa-fw mr-2'></i>
          Add Service
          </Button>
        {` `}
        <Button
          color='success' size='sm'
          onClick={(event) => syncKubernetes()}
        >
          <i className='fas fa-sync-alt fa-fw mr-2'></i>
          Sync
          </Button>
      </React.Fragment>
    )
  }

  renderConfirmDeleteModal(): JSX.Element {
    const { isDeleteModalOpen } = this.state

    const cancel = () => {
      this.toggleDeleteModal()
    }

    const executeDeletion = (event) => {
      this.deleteServices(this.state.selectedData.services)
      this.deleteModels(this.state.selectedData.models)
      this.toggleDeleteModal()
    }

    return (
      <Modal isOpen={isDeleteModalOpen} toggle={cancel} size='sm'>
        <ModalHeader toggle={cancel}>Delete Services/Models</ModalHeader>
        <ModalBody>
          Are you sure to delete?
        </ModalBody>
        <div className='d-flex flex-row mt-3'>
          <Button
            color='danger'
            size='lg'
            className='rounded-0 flex-1'
            onClick={executeDeletion}
          >
            <i className='fas fa-exclamation-circle mr-3' />
            Delete
          </Button>
          <Button
            color='secondary'
            size='lg'
            className='rounded-0 flex-1'
            onClick={cancel}
          >
            <i className='fas fa-ban mr-3' />
            Cancel
          </Button>
        </div>
      </Modal>
    )
  }

  syncKubernetes(): void {
    this.setState({ syncSubmitted: true, syncNotified: false })
    this.props.syncKubernetes(this.props.match.params)
  }

  // Event handing methods

  toggleDeleteModal(): void {
    this.setState({
      isDeleteModalOpen: !this.state.isDeleteModalOpen
    })
  }

  toggleAddModelFileModalOpen(): void {
    this.setState({
      isAddModelFileModalOpen: !this.state.isAddModelFileModalOpen
    })
  }

  onSubmitDashboardStatusChanges(params): Promise<void> {
    const { switchModels } = this.props
    const { projectId, applicationId } = this.props.match.params

    const apiParams: SwitchModelParam[] =
      Object.entries(params.switch)
        .filter(
          ([key, value]) => {
            if (params.status[key] === value) {
              return false
            }
            return true
          })
        .map(
          ([key, value]): SwitchModelParam => (
            {
              projectId,
              applicationId,
              serviceId: key,
              modelId: value ? value as number : undefined
            }))

    this.setState({ submitted: true })

    return switchModels(apiParams)
  }

  /**
   * Handle submit and call API to delete services/models
   * Currently only supports to delete k8s services
   *
   * @param params
   */
  onSubmitDelete(params): Promise<void> {
    this.setState({
      isDeleteModalOpen: true,
      selectedData: {
        services: params.delete_services,
        models: params.delete_models
      }
    })
    return Promise.resolve()
  }

  deleteServices(params): Promise<void> {
    const { deleteServices } = this.props
    const { projectId, applicationId } = this.props.match.params

    const apiParams =
      Object.entries(params)
        .filter(([key, value]) => (value))
        .map(
          ([key, value]) => (
            {
              projectId,
              applicationId,
              serviceId: key
            }))

    this.setState({ submitted: true })

    return deleteServices(apiParams)
  }

  deleteModels(params): Promise<void> {
    const { deleteModels } = this.props
    const { projectId, applicationId } = this.props.match.params

    const apiParams =
      Object.entries(params)
        .filter(([key, value]) => (value))
        .map(
          ([key, value]) => (
            {
              projectId,
              applicationId,
              modelId: Number(key)
            }))

    this.setState({ submitted: true })

    return deleteModels(apiParams)
  }

  // Utils
  /**
   * Generate deploy status from services
   *
   * @param services {Service[]} Fetched Services
   */
  makeDashboardStatus(services: Service[]) {
    const result = {}

    services.map(
      (service: Service) => { if (service.modelId) { result[service.serviceId] = service.modelId } }
    )
    return result
  }

  changeMode(mode: ControlMode) {
    this.setState({ controlMode: mode })
  }

  complete(param) {
    this.props.addNotification(param)
    this.props.fetchAllModels(this.props.match.params)
    this.props.fetchAllServices(this.props.match.params)
    this.setState({
      controlMode: ControlMode.VIEW_DEPLOY_STATUS,
      submitted: false,
      selectedData: { services: [], models: [] }
    })
  }
}

export interface StateProps {
  kuberneteses: APIRequest<Kubernetes[]>
  application: APIRequest<Application>
  models: APIRequest<Model[]>
  services: APIRequest<Service[]>
  switchModelsStatus: APIRequest<boolean[]>
  deleteServicesStatus: APIRequest<boolean[]>
  deleteModelsStatus: APIRequest<boolean[]>
  syncKubernetesStatus: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  return {
    kuberneteses: state.fetchAllKubernetesReducer.fetchAllKubernetes,
    application: state.fetchApplicationByIdReducer.fetchApplicationById,
    models: state.fetchAllModelsReducer.fetchAllModels,
    services: state.fetchAllServicesReducer.fetchAllServices,
    switchModelsStatus: state.switchModelsReducer.switchModels,
    deleteServicesStatus: state.deleteServicesReducer.deleteServices,
    deleteModelsStatus: state.deleteModelsReducer.deleteModels,
    syncKubernetesStatus: state.syncKubernetesReducer.syncKubernetes,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings
  }
}

export interface DispatchProps {
  addNotification
  fetchAllKubernetes: (params: FetchKubernetesByIdParam) => Promise<void>
  fetchApplicationById: (params: FetchApplicationByIdParam) => Promise<void>
  fetchAllModels: (params: FetchModelByIdParam) => Promise<void>
  fetchAllServices: (params: FetchServiceParam) => Promise<void>
  switchModels: (params: SwitchModelParam[]) => Promise<void>
  deleteServices: (params: IdParam[]) => Promise<void>
  deleteModels: (params: IdParam[]) => Promise<void>
  syncKubernetes: (params: SyncKubernetesParam) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    fetchAllKubernetes: (params: FetchKubernetesByIdParam) => fetchAllKubernetesDispatcher(dispatch, params),
    fetchApplicationById: (params: FetchApplicationByIdParam) => fetchApplicationByIdDispatcher(dispatch, params),
    fetchAllModels: (params: FetchModelByIdParam) => fetchAllModelsDispatcher(dispatch, params),
    fetchAllServices: (params: FetchServiceParam) => fetchAllServicesDispatcher(dispatch, params),
    switchModels: (params: SwitchModelParam[]) => switchModelsDispatcher(dispatch, params),
    deleteServices: (params: IdParam[]) => deleteServicesDispatcher(dispatch, params),
    deleteModels: (params: IdParam[]) => deleteModelsDispatcher(dispatch, params),
    syncKubernetes: (params: SyncKubernetesParam) => syncKubernetesDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string}>>(
    mapStateToProps, mapDispatchToProps
  )(Dashboard))