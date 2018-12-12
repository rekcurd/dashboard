import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Button, Modal, ModalBody, ModalHeader, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { Model, Service, SwitchModelParam, SynKubernetesStatusParam, Application, UserInfo, UserRole } from '@src/apis'
import {
  addNotification,
  fetchApplicationByIdDispatcher,
  fetchAllModelsDispatcher,
  fetchAllServicesDispatcher,
  switchModelsDispatcher,
  deleteKubernetesServicesDispatcher,
  syncKubernetesStatusDispatcher
} from '@src/actions'
import { AddModelFileModal } from '@components/App/Model/Modals/AddModelFileModal'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import DeployStatusForm from './DeployStatusForm'
import { role } from '../Admin/constants'

export enum ControlMode {
  VIEW_DEPLOY_STATUS,
  EDIT_DEPLOY_STATUS,
  SELECT_TARGETS,
  UPLOAD_MODEL,
  EVALUATE_MODELS
}

interface DeployStatusState {
  controlMode: ControlMode
  isDeleteServicesModalOpen: boolean
  isAddModelFileModalOpen: boolean
  selectedData: { services: any[], models: any[] }
  submitted: boolean
  notified: boolean
  syncSubmitted: boolean
  syncNotified: boolean
}

type DeployStatusProps = DispatchProps & StateProps & RouteComponentProps<{applicationId: string}>

class Deploy extends React.Component<DeployStatusProps, DeployStatusState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      controlMode: ControlMode.VIEW_DEPLOY_STATUS,
      isDeleteServicesModalOpen: false,
      isAddModelFileModalOpen: false,
      selectedData: { services: [], models: [] },
      submitted: false,
      notified: false,
      syncSubmitted: false,
      syncNotified: false
    }

    this.onSubmitDeployStatusChanges = this.onSubmitDeployStatusChanges.bind(this)
    this.onSubmitDelete = this.onSubmitDelete.bind(this)
    this.deleteKubernetesServices = this.deleteKubernetesServices.bind(this)
    this.toggleDeleteServicesModal = this.toggleDeleteServicesModal.bind(this)
    this.toggleAddModelFileModalOpen = this.toggleAddModelFileModalOpen.bind(this)
    this.syncServices = this.syncServices.bind(this)
    this.renderDeployStatus = this.renderDeployStatus.bind(this)
    this.changeMode = this.changeMode.bind(this)
    this.complete = this.complete.bind(this)
  }

  componentWillMount() {
    const { applicationId } = this.props.match.params

    this.props.fetchApplicationById(applicationId)
    this.props.fetchAllModels(applicationId)
    this.props.fetchAllServices(applicationId)
  }

  componentWillReceiveProps(nextProps: DeployStatusProps) {
    const {
      switchModelsStatus,
      deleteKubernetesServicesStatus,
      syncKubernetesServicesStatusStatus
    } = nextProps
    const { controlMode, submitted } = this.state

    const checkAllApiResultStatus =
      (result: APIRequest<boolean[]>) =>
        isAPISucceeded<boolean[]>(result) &&
        result.result.reduce((p, c) => (p && c))

    // Switch to view mode when API successfully connected
    if (submitted && controlMode === ControlMode.EDIT_DEPLOY_STATUS) {
      if (checkAllApiResultStatus(switchModelsStatus)) {
        this.complete({ color: 'success', message: 'Successfully changed deployment' })
      } else {
        this.complete({ color: 'error', message: 'Something went wrong, try again later' })
      }
    }

    if (submitted && controlMode === ControlMode.SELECT_TARGETS) {
      if (checkAllApiResultStatus(deleteKubernetesServicesStatus)) {
        this.complete({ color: 'success', message: 'Successfully changed deletion' })
      } else {
        this.complete({ color: 'error', message: 'Something went wrong, try again later' })
      }
    }

    this.checkAndNotifyAPIResult(
      syncKubernetesServicesStatusStatus,
      'syncSubmitted', 'syncNotified',
      'Successfully synced application'
    )
  }

  checkAndNotifyAPIResult(status, submitted: string, notified: string, notificationText) {
    const submittedFlag: boolean = this.state[submitted]
    const notifiedFlag: boolean = this.state[notified]

    if (submittedFlag && !notifiedFlag) {
      const succeeded: boolean = isAPISucceeded<boolean>(status) && status.result
      const failed: boolean = (isAPISucceeded<boolean>(status) && !status.result) ||
        isAPIFailed<boolean>(status)

      if (succeeded) {
        this.setState({ submitted: false, notified: true})
        this.complete({ color: 'success', message: notificationText })
      } else if (failed) {
        this.setState({ submitted: false, notified: true})
        this.complete({ color: 'error', message: 'Something went wrong. Try again later' })
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
    if ( this.props.match.params.applicationId === 'add' ) {
      return null
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={statuses}
        render={this.renderDeployStatus}
      />
    )
  }

  /**
   * Render deploy status / related form fields
   * with fetched API results
   *
   * @param fetchedResults Fetched data from APIs
   */
  renderDeployStatus(fetchedResults): JSX.Element {
    const { controlMode } = this.state
    const {
      onSubmitDeployStatusChanges,
      onSubmitDelete,
      changeMode
    } = this
    const { kubernetesId, name } = fetchedResults.application
    const { applicationId } = this.props.match.params

    const services: Service[] = fetchedResults.services
    const models: Model[] = fetchedResults.models
    const deployStatus = this.makeDeployStatus(services)
    const onSubmitMap: { [mode: number]: (params: any) => Promise<void> } = {
      [ControlMode.VIEW_DEPLOY_STATUS]: onSubmitDeployStatusChanges, // Dummy to render form
      [ControlMode.EDIT_DEPLOY_STATUS]: onSubmitDeployStatusChanges,
      [ControlMode.SELECT_TARGETS]: onSubmitDelete,
    }
    const canEdit: boolean = fetchedResults.userInfoStatus && fetchedResults.userInfoStatus.roles.some((userRole: UserRole) => {
      return String(userRole.applicationId) === applicationId &&
        (userRole.role === role.editor || userRole.role === role.owner)
    })

    // Render contents to control deploy status
    switch (controlMode) {
      case ControlMode.VIEW_DEPLOY_STATUS:
      case ControlMode.EDIT_DEPLOY_STATUS:
      case ControlMode.SELECT_TARGETS:
        return (
          this.renderContent(
            <DeployStatusForm
              applicationType={!!kubernetesId ? 'kubernetes' : 'simple'}
              applicationId={applicationId}
              services={services}
              models={models}
              deployStatus={deployStatus}
              mode={controlMode}
              onSubmit={onSubmitMap[controlMode]}
              changeMode={changeMode}
              canEdit={canEdit}
            />,
            name,
            kubernetesId,
            canEdit
          )
        )

      case ControlMode.EVALUATE_MODELS:
        return (
          this.renderContent(
            <div>TBD</div>,
            name,
            kubernetesId,
            canEdit
          )
        )
    }
  }

  renderContent = (content: JSX.Element, applicationName, kubernetesId, canEdit: boolean): JSX.Element => {
    return (
      <div className='pb-5'>
        {this.renderTitle(applicationName, kubernetesId, canEdit)}
        <AddModelFileModal
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
            ? this.renderConfirmDeleteHostModal()
            : null
        }
      </div>
    )
  }

  renderTitle = (applicationName, kubernetesId, canEdit: boolean): JSX.Element => {
    const buttons = (
      <Col xs='5' className='text-right'>
        <Button
          color='primary'
          size='sm'
          onClick={this.toggleAddModelFileModalOpen}
        >
          <i className='fas fa-robot fa-fw mr-2'></i>
          Add Model
          </Button>
        {' '}
        {kubernetesId ? this.renderKubernetesControlButtons(kubernetesId) : null}
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

  renderKubernetesControlButtons(kubernetesId) {
    const { push } = this.props.history
    const { syncServices } = this
    const { applicationId } = this.props.match.params

    return (
      <React.Fragment>
        <Button
          color='primary'
          size='sm'
          onClick={() => { push(`/applications/${applicationId}/services/add`) }}
        >
          <i className='fas fa-box fa-fw mr-2'></i>
          Add Service
          </Button>
        {` `}
        <Button
          color='success' size='sm'
          onClick={(event) => syncServices(kubernetesId)}
        >
          <i className='fas fa-sync-alt fa-fw mr-2'></i>
          Sync
          </Button>
      </React.Fragment>
    )
  }

  renderConfirmDeleteHostModal(): JSX.Element {
    const { isDeleteServicesModalOpen } = this.state

    const cancel = () => {
      this.toggleDeleteServicesModal()
    }

    const executeDeletion = (event) => {
      this.deleteKubernetesServices(this.state.selectedData.services)
      this.toggleDeleteServicesModal()
    }

    return (
      <Modal isOpen={isDeleteServicesModalOpen} toggle={cancel} size='sm'>
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

  syncServices(kubernetesId): void {
    const { applicationId } = this.props.match.params

    this.setState({ syncSubmitted: true, syncNotified: false })
    this.props.syncKubernetesServicesStatus({applicationId, kubernetesId})
  }

  // Event handing methods

  toggleDeleteServicesModal(): void {
    this.setState({
      isDeleteServicesModalOpen: !this.state.isDeleteServicesModalOpen
    })
  }

  toggleAddModelFileModalOpen(): void {
    this.setState({
      isAddModelFileModalOpen: !this.state.isAddModelFileModalOpen
    })
  }

  onSubmitDeployStatusChanges(params): Promise<void> {
    const { switchModels } = this.props
    const { applicationId } = this.props.match.params

    const apiParams: SwitchModelParam[] =
      Object.entries(params.status)
        .map(
          ([key, value]): SwitchModelParam => (
            {
              applicationId,
              serviceId: key,
              modelId: value ? value as string : undefined
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
      isDeleteServicesModalOpen: true,
      selectedData: {
        services: params.delete.services,
        models: params.delete.models
      }
    })
    return Promise.resolve()
  }

  deleteKubernetesServices(params): Promise<void> {
    const { deleteKubernetesServices } = this.props
    const { applicationId } = this.props.match.params

    const apiParams =
      Object.entries(params)
        .filter(([key, value]) => (value))
        .map(
          ([key, value]) => (
            {
              applicationId,
              serviceId: key
            }))

    this.setState({ submitted: true })

    return deleteKubernetesServices(apiParams)
  }

  // Utils
  /**
   * Generate deploy status from services
   *
   * @param services {Service[]} Fetched Services
   */
  makeDeployStatus(services: Service[]) {
    const result = {}

    services.map(
      (service: Service) => { if (service.modelId) { result[service.id] = service.modelId } }
    )
    return result
  }

  changeMode(mode: ControlMode) {
    this.setState({ controlMode: mode })
  }

  /**
   * Reload deploy status
   *
   * Fetch models and services through API again
   */
  complete(param) {
    const {
      fetchAllModels,
      fetchAllServices
    } = this.props
    const {
      applicationId
    } = this.props.match.params

    this.props.addNotification(param)
    fetchAllModels(applicationId)
    fetchAllServices(applicationId)
    this.setState({
      controlMode: ControlMode.VIEW_DEPLOY_STATUS,
      submitted: false,
      selectedData: { services: [], models: [] }
    })
  }
}

export interface StateProps {
  application: APIRequest<Application>
  models: APIRequest<Model[]>
  services: APIRequest<Service[]>
  switchModelsStatus: APIRequest<boolean[]>
  deleteKubernetesServicesStatus: APIRequest<boolean[]>
  syncKubernetesServicesStatusStatus: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  return {
    application: state.fetchApplicationByIdReducer.applicationById,
    models: state.fetchAllModelsReducer.models,
    services: state.fetchAllServicesReducer.services,
    switchModelsStatus: state.switchModelsReducer.switchModels,
    deleteKubernetesServicesStatus: state.deleteKubernetesServicesReducer.deleteKubernetesServices,
    syncKubernetesServicesStatusStatus: state.syncKubernetesStatusReducer.syncKubernetesStatus,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings
  }
}

export interface DispatchProps {
  addNotification
  syncKubernetesServicesStatus
  fetchApplicationById: (id: string) => Promise<void>
  fetchAllModels: (applicationId: string) => Promise<void>
  fetchAllServices: (applicationId: string) => Promise<void>
  switchModels: (params: SwitchModelParam[]) => Promise<void>
  deleteKubernetesServices: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    fetchApplicationById: (id: string) => fetchApplicationByIdDispatcher(dispatch, { id }),
    fetchAllModels: (applicationId: string) => fetchAllModelsDispatcher(dispatch, { applicationId }),
    fetchAllServices: (applicationId: string) => fetchAllServicesDispatcher(dispatch, { applicationId }),
    switchModels: (params: SwitchModelParam[]) => switchModelsDispatcher(dispatch, params),
    deleteKubernetesServices: (params) => deleteKubernetesServicesDispatcher(dispatch, params),
    syncKubernetesServicesStatus: (params: SynKubernetesStatusParam) => syncKubernetesStatusDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{applicationId: string}>>(
    mapStateToProps, mapDispatchToProps
  )(Deploy))
