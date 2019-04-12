import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Button, Modal, ModalBody, ModalHeader, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  Service, SyncKubernetesParam, Application, UserInfo,
  FetchApplicationByIdParam, FetchServiceParam, IdParam, FetchKubernetesByIdParam
} from '@src/apis'
import {
  addNotification,
  fetchIsKubernetesModeDispatcher,
  fetchApplicationByIdDispatcher,
  fetchAllServicesDispatcher,
  deleteServicesDispatcher,
  syncKubernetesDispatcher
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import ServicesDeleteForm from './ServicesDeleteForm'


type ServicesStatusProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string}>

interface ServicesStatusState {
  isDeleteServicesModalOpen: boolean
  selectedData: IdParam[]
  submitted: boolean
  notified: boolean
  syncSubmitted: boolean
  syncNotified: boolean
}

class Services extends React.Component<ServicesStatusProps, ServicesStatusState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      isDeleteServicesModalOpen: false,
      selectedData: [],
      submitted: false,
      notified: false,
      syncSubmitted: false,
      syncNotified: false
    }

    this.onSubmitDelete = this.onSubmitDelete.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.deleteServices = this.deleteServices.bind(this)
    this.toggleDeleteServicesModal = this.toggleDeleteServicesModal.bind(this)
    this.syncServices = this.syncServices.bind(this)
    this.renderServices = this.renderServices.bind(this)
    this.complete = this.complete.bind(this)
  }

  componentDidMount() {
    this.props.fetchIsKubernetesMode(this.props.match.params)
    this.props.fetchApplicationById(this.props.match.params)
    this.props.fetchAllServices(this.props.match.params)
  }

  static getDerivedStateFromProps(nextProps: ServicesStatusProps, prevState: ServicesStatusState){
    const {
      deleteServicesStatus,
      syncKubernetesStatus
    } = nextProps
    const { submitted, syncSubmitted, syncNotified } = prevState

    const checkAllApiResultSucceeded =
      (result: APIRequest<boolean[]>) =>
        isAPISucceeded<boolean[]>(result) &&
        result.result.reduce((p, c) => (p && c))
    const checkAllApiResultFailed =
      (result: APIRequest<boolean[]>) =>
        (isAPISucceeded<boolean[]>(result) && !result.result.reduce((p, c) => (p && c))) || isAPIFailed<boolean[]>(result)

    if (submitted) {
      if (checkAllApiResultSucceeded(deleteServicesStatus)) {
        nextProps.addNotification({ color: 'success', message: 'Successfully changed deletion services' })
        nextProps.fetchAllServices(nextProps.match.params)
        return {
          submitted: false,
          notified: true,
          selectedData: []
        }
      } else if (checkAllApiResultFailed(deleteServicesStatus)) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong with deletion services, try again later' })
        return {
          submitted: false,
          notified: true,
          selectedData: []
        }
      }
    }

    if (syncSubmitted && !syncNotified) {
      const succeeded: boolean = isAPISucceeded<boolean>(syncKubernetesStatus) && syncKubernetesStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(syncKubernetesStatus) && !syncKubernetesStatus.result) || isAPIFailed<boolean>(syncKubernetesStatus)

      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully synced application' })
        nextProps.fetchAllServices(nextProps.match.params)
        return {
          syncSubmitted: false,
          syncNotified: true,
        }
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return {
          syncSubmitted: false,
          syncNotified: true,
        }
      }
    }
    return null
  }

  // Render methods

  render(): JSX.Element {
    const { projectId, applicationId } = this.props.match.params
    const { kubernetesMode, application, services, userInfoStatus, settings } = this.props
    const statuses: any = { kubernetesMode, application, services }
    if (isAPISucceeded(settings) && settings.result.auth) {
      statuses.userInfoStatus = userInfoStatus
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={statuses}
        render={this.renderServices}
        projectId={projectId}
        applicationId={applicationId}
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
    const kubernetesMode = fetchedResults.kubernetesMode
    const applicationName = fetchedResults.application.name
    const { projectId, applicationId } = this.props.match.params
    const services: Service[] = fetchedResults.services

    return (
      this.renderContent(
        <ServicesDeleteForm
          projectId={projectId}
          applicationId={applicationId}
          services={services}
          onSubmit={this.onSubmitDelete}
          onCancel={this.onCancel}
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
        {this.renderConfirmDeleteHostModal()}
      </div>
    )
  }

  renderTitle = (applicationName, kubernetesMode, canEdit: boolean): JSX.Element => {
    const { push } = this.props.history
    const { projectId, applicationId} = this.props.match.params

    const kubeSyncButton = (
      <React.Fragment>
        {` `}
        <Button
          color='success' size='sm'
          onClick={this.syncServices}>
          <i className='fas fa-sync-alt fa-fw mr-2'></i>
          Sync
        </Button>
      </React.Fragment>
    )

    const buttons = (
      <Col xs='5' className='text-right'>
        <Button
          color='primary'
          size='sm'
          onClick={() => { push(`/projects/${projectId}/applications/${applicationId}/services/add`) }}>
          <i className='fas fa-box fa-fw mr-2'></i>
          Add Service
        </Button>
        {kubernetesMode ? kubeSyncButton : null}
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

  renderConfirmDeleteHostModal(): JSX.Element {
    const { isDeleteServicesModalOpen } = this.state

    const executeDeletion = (event) => {
      if (this.state.selectedData.length > 0) {
        this.deleteServices(this.state.selectedData)
      }
      this.toggleDeleteServicesModal()
      return Promise.resolve()
    }

    const cancelDeletion = (event) => {
      this.toggleDeleteServicesModal()
      return Promise.resolve()
    }

    return (
      <Modal isOpen={isDeleteServicesModalOpen} toggle={cancelDeletion} size='sm'>
        <ModalHeader toggle={cancelDeletion}>Delete Services</ModalHeader>
        <ModalBody>
          Are you sure to delete?
        </ModalBody>
        <div className='d-flex flex-row mt-3'>
          <Button
            color='danger'
            size='lg'
            className='rounded-0 flex-1'
            onClick={executeDeletion}>
            <i className='fas fa-exclamation-circle mr-3' />
            Delete
          </Button>
          <Button
            color='secondary'
            size='lg'
            className='rounded-0 flex-1'
            onClick={cancelDeletion}>
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

  /**
   * Handle submit and call API to delete services
   * Currently only supports to delete k8s services
   *
   * @param params
   */
  onSubmitDelete(params): void {
    this.setState({
      isDeleteServicesModalOpen: true,
      selectedData: params.delete_services
    })
  }

  onCancel(): void {
    this.setState({
      selectedData: []
    })
  }

  deleteServices(params): Promise<void> {
    const { projectId, applicationId } = this.props.match.params

    const apiParams =
      params.map((id) => (
        {
          projectId,
          applicationId,
          serviceId: id
        }))

    this.setState({ submitted: true, notified: false })
    return this.props.deleteServices(apiParams)
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
      submitted: false,
      selectedData: []
    })
  }
}

export interface StateProps {
  syncKubernetesStatus: APIRequest<boolean>
  kubernetesMode: APIRequest<boolean>
  application: APIRequest<Application>
  services: APIRequest<Service[]>
  deleteServicesStatus: APIRequest<boolean[]>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  const props = {
    syncKubernetesStatus: state.syncKubernetesReducer.syncKubernetes,
    kubernetesMode: state.fetchIsKubernetesModeReducer.fetchIsKubernetesMode,
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
  fetchIsKubernetesMode: (params: FetchKubernetesByIdParam) => Promise<void>
  fetchApplicationById: (params: FetchApplicationByIdParam) => Promise<void>
  fetchAllServices: (params: FetchServiceParam) => Promise<void>
  deleteServices: (params: IdParam[]) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    syncKubernetes: (params: SyncKubernetesParam) => syncKubernetesDispatcher(dispatch, params),
    fetchIsKubernetesMode: (params: FetchKubernetesByIdParam) => fetchIsKubernetesModeDispatcher(dispatch, params),
    fetchApplicationById: (params: FetchApplicationByIdParam) => fetchApplicationByIdDispatcher(dispatch, params),
    fetchAllServices: (params: FetchServiceParam) => fetchAllServicesDispatcher(dispatch, params),
    deleteServices: (params: IdParam[]) => deleteServicesDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string}>>(
    mapStateToProps, mapDispatchToProps
  )(Services))
