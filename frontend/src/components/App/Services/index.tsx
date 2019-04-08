import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Button, Modal, ModalBody, ModalHeader, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  Kubernetes, Service, SyncKubernetesParam, Application, UserInfo,
  FetchApplicationByIdParam, FetchServiceParam, IdParam, FetchKubernetesByIdParam
} from '@src/apis'
import {
  addNotification,
  fetchAllKubernetesDispatcher,
  fetchApplicationByIdDispatcher,
  fetchAllServicesDispatcher,
  deleteServicesDispatcher,
  syncKubernetesDispatcher
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import ServicesDeleteForm from './ServicesDeleteForm'


export enum ControlMode {
  VIEW_SERVICES_STATUS,
  SELECT_TARGETS,
}

type ServicesStatusProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string}>

interface ServicesStatusState {
  controlMode: ControlMode
  isDeleteServicesModalOpen: boolean
  selectedData: IdParam[]
  submitted: boolean
  syncSubmitted: boolean
  syncNotified: boolean
}

class Services extends React.Component<ServicesStatusProps, ServicesStatusState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      controlMode: ControlMode.VIEW_SERVICES_STATUS,
      isDeleteServicesModalOpen: false,
      selectedData: [],
      submitted: false,
      syncSubmitted: false,
      syncNotified: false
    }

    this.onSubmitDelete = this.onSubmitDelete.bind(this)
    this.deleteServices = this.deleteServices.bind(this)
    this.toggleDeleteServicesModal = this.toggleDeleteServicesModal.bind(this)
    this.syncServices = this.syncServices.bind(this)
    this.renderServices = this.renderServices.bind(this)
    this.changeMode = this.changeMode.bind(this)
    this.complete = this.complete.bind(this)
  }

  componentDidMount() {
    this.props.fetchApplicationById(this.props.match.params)
    this.props.fetchAllServices(this.props.match.params)
  }

  static getDerivedStateFromProps(nextProps: ServicesStatusProps, prevState: ServicesStatusState){
    const {
      deleteServicesStatus,
      syncKubernetesStatus
    } = nextProps
    const { controlMode, submitted, syncSubmitted, syncNotified } = prevState

    const checkAllApiResultStatus =
      (result: APIRequest<boolean[]>) =>
        isAPISucceeded<boolean[]>(result) &&
        result.result.reduce((p, c) => (p && c))

    if (submitted && controlMode === ControlMode.SELECT_TARGETS) {
      if (checkAllApiResultStatus(deleteServicesStatus)) {
        nextProps.addNotification({ color: 'success', message: 'Successfully changed deletion' })
      } else {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong, try again later' })
      }
      nextProps.fetchAllServices(nextProps.match.params)
      return {
        controlMode: ControlMode.VIEW_SERVICES_STATUS,
        submitted: false,
        selectedData: []
      }
    }

    if (syncSubmitted && !syncNotified) {
      const succeeded: boolean = isAPISucceeded<boolean>(syncKubernetesStatus) && syncKubernetesStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(syncKubernetesStatus) && !syncKubernetesStatus.result) || isAPIFailed<boolean>(syncKubernetesStatus)

      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully synced application' })
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
      }
      return {
        controlMode: ControlMode.VIEW_SERVICES_STATUS,
        submitted: false,
        syncSubmitted: false,
        syncNotified: true,
        selectedData: []
      }
    }
  }

  // Render methods

  render(): JSX.Element {
    const { application, services, userInfoStatus, settings } = this.props
    const statuses: any = { application, services }
    if (isAPISucceeded(settings) && settings.result.auth) {
      statuses.userInfoStatus = userInfoStatus
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={statuses}
        render={this.renderServices}
        projectId={this.props.match.params.projectId}
        applicationId={this.props.match.params.applicationId}
      />
    )
  }

  /**
   * Render services status / related form fields
   * with fetched API results
   *
   * @param fetchedResults Fetched data from APIs
   * @param canEdit Boolean value of user's editor permission
   */
  renderServices(fetchedResults, canEdit) {
    const { controlMode } = this.state
    const {
      onSubmitNothing,
      onSubmitDelete,
      changeMode
    } = this

    const kubernetesMode = fetchedResults.kuberneteses.length > 0
    const applicationName = fetchedResults.application.name
    const { projectId, applicationId } = this.props.match.params

    const services: Service[] = fetchedResults.services
    const onSubmitMap = {
      [ControlMode.VIEW_SERVICES_STATUS]: onSubmitNothing,
      [ControlMode.SELECT_TARGETS]: onSubmitDelete,
    }

    return (
      this.renderContent(
        <ServicesDeleteForm
          projectId={projectId}
          applicationId={applicationId}
          services={services}
          mode={controlMode}
          onSubmit={onSubmitMap[controlMode]}
          changeMode={changeMode}
          canEdit={canEdit}
        />,
        applicationName,
        kubernetesMode,
        canEdit
      )
    )
  }

  renderContent = (content: JSX.Element, applicationName, kubernetesMode, canEdit: boolean): JSX.Element => {
    return (
      <div className='pb-5'>
        {this.renderTitle(applicationName, kubernetesMode, canEdit)}
        <h3>
          <i className='fas fa-server fa-fw mr-2'></i>
          Services
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

  renderTitle = (applicationName, kubernetesMode, canEdit: boolean): JSX.Element => {
    return (
      <Row className='align-items-center mb-5'>
        <Col xs='7'>
          <h1>
            <i className='fas fa-ship fa-fw mr-2'></i>
            {applicationName}
          </h1>
        </Col>
        <Col xs='5' className='text-right'>
          {kubernetesMode && canEdit ? this.renderKubernetesControlButtons() : null}
        </Col>
      </Row>
    )
  }

  renderKubernetesControlButtons() {
    const { push } = this.props.history
    const { syncServices } = this
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
          onClick={(event) => syncServices()}
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
      this.deleteServices(this.state.selectedData)
      this.toggleDeleteServicesModal()
    }

    return (
      <Modal isOpen={isDeleteServicesModalOpen} toggle={cancel} size='sm'>
        <ModalHeader toggle={cancel}>Delete Services</ModalHeader>
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

  syncServices(): void {
    this.setState({ syncSubmitted: true, syncNotified: false })
    this.props.syncKubernetes(this.props.match.params)
  }

  // Event handing methods
  toggleDeleteServicesModal(): void {
    this.setState({
      isDeleteServicesModalOpen: !this.state.isDeleteServicesModalOpen
    })
  }

  onSubmitNothing(params): void {}

  /**
   * Handle submit and call API to delete services
   * Currently only supports to delete k8s services
   *
   * @param params
   */
  onSubmitDelete(params): void {
    this.setState({
      isDeleteServicesModalOpen: true,
      selectedData: params
    })
  }

  deleteServices(params): Promise<void> {
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

    return this.props.deleteServices(apiParams)
  }

  // Utils
  changeMode(mode: ControlMode) {
    this.setState({ controlMode: mode })
  }

  /**
   * Reload services status
   *
   * Fetch services through API again
   */
  complete(param) {
    this.props.addNotification(param)
    this.props.fetchAllServices(this.props.match.params)
    this.setState({
      controlMode: ControlMode.VIEW_SERVICES_STATUS,
      submitted: false,
      selectedData: []
    })
  }
}

export interface StateProps {
  syncKubernetesStatus: APIRequest<boolean>
  kuberneteses: APIRequest<Kubernetes[]>
  application: APIRequest<Application>
  services: APIRequest<Service[]>
  deleteServicesStatus: APIRequest<boolean[]>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  const props = {
    syncKubernetesStatus: state.syncKubernetesReducer.syncKubernetes,
    kuberneteses: state.fetchAllKubernetesReducer.fetchAllKubernetes,
    application: state.fetchApplicationByIdReducer.fetchApplicationById,
    services: state.fetchAllServicesReducer.fetchAllServices,
    deleteServicesStatus: state.deleteServicesReducer.deleteServices,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings
  }
  return props
}

export interface DispatchProps {
  addNotification
  syncKubernetes: (params: SyncKubernetesParam) => Promise<void>
  fetchAllKubernetes: (params: FetchKubernetesByIdParam) => Promise<void>
  fetchApplicationById: (params: FetchApplicationByIdParam) => Promise<void>
  fetchAllServices: (params: FetchServiceParam) => Promise<void>
  deleteServices: (params: IdParam[]) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    syncKubernetes: (params: SyncKubernetesParam) => syncKubernetesDispatcher(dispatch, params),
    fetchAllKubernetes: (params: FetchKubernetesByIdParam) => fetchAllKubernetesDispatcher(dispatch, params),
    fetchApplicationById: (params: FetchApplicationByIdParam) => fetchApplicationByIdDispatcher(dispatch, params),
    fetchAllServices: (params: FetchServiceParam) => fetchAllServicesDispatcher(dispatch, params),
    deleteServices: (params: IdParam[]) => deleteServicesDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string}>>(
    mapStateToProps, mapDispatchToProps
  )(Services))
