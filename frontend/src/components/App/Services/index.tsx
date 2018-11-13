import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Button, Modal, ModalBody, ModalHeader, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { Service, SynKubernetesStatusParam, Application, UserInfo, UserRole } from '@src/apis'
import {
  addNotification,
  fetchApplicationByIdDispatcher,
  fetchAllServicesDispatcher,
  deleteKubernetesServicesDispatcher,
  syncKubernetesStatusDispatcher
} from '@src/actions'
import ServicesDeleteForm from './ServicesDeleteForm'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

export enum ControlMode {
  VIEW_SERVICES_STATUS,
  SELECT_TARGETS,
}

type ServicesStatusProps = DispatchProps & StateProps & RouteComponentProps<{applicationId: string}>

class Services extends React.Component<ServicesStatusProps, any> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      controlMode: ControlMode.VIEW_SERVICES_STATUS,
      isDeleteServicesModalOpen: false,
      selectedData: { services: [] },
      submitted: false,
      syncSubmitted: false,
      syncNotified: false
    }

    this.onSubmitDelete = this.onSubmitDelete.bind(this)
    this.deleteKubernetesServices = this.deleteKubernetesServices.bind(this)
    this.toggleDeleteServicesModal = this.toggleDeleteServicesModal.bind(this)
    this.syncServices = this.syncServices.bind(this)
    this.renderServices = this.renderServices.bind(this)
    this.changeMode = this.changeMode.bind(this)
    this.complete = this.complete.bind(this)
  }

  componentWillMount() {
    const { applicationId } = this.props.match.params

    this.props.fetchApplicationById(applicationId)
    this.props.fetchAllServices(applicationId)
  }

  componentWillReceiveProps(nextProps: ServicesStatusProps) {
    const {
      deleteKubernetesServicesStatus,
      syncKubernetesServicesStatusStatus
    } = nextProps
    const { controlMode, submitted } = this.state

    const checkAllApiResultStatus =
      (result: APIRequest<boolean[]>) =>
        isAPISucceeded<boolean[]>(result) &&
        result.result.reduce((p, c) => (p && c))

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
        this.setState({[submitted]: false, [notified]: true})
        this.complete({ color: 'success', message: notificationText })
      } else if (failed) {
        this.setState({[submitted]: false, [notified]: true})
        this.complete({ color: 'error', message: 'Something went wrong. Try again later' })
      }
    }
  }

  // Render methods

  render(): JSX.Element {
    const { application, services, userInfoStatus } = this.props
    if ( this.props.match.params.applicationId === 'add' ) {
      return null
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={{ application, services, userInfoStatus }}
        render={this.renderServices}
      />
    )
  }

  /**
   * Render services status / related form fields
   * with fetched API results
   *
   * @param fetchedResults Fetched data from APIs
   */
  renderServices(fetchedResults) {
    const { controlMode } = this.state
    const {
      onSubmitNothing,
      onSubmitDelete,
      changeMode
    } = this

    const { kubernetesId, name } = fetchedResults.application
    const { applicationId } = this.props.match.params

    const services: Service[] = fetchedResults.services
    const onSubmitMap = {
      [ControlMode.VIEW_SERVICES_STATUS]: onSubmitNothing,
      [ControlMode.SELECT_TARGETS]: onSubmitDelete,
    }
    const canEdit: boolean = fetchedResults.userInfoStatus.roles.some((role: UserRole) => {
      return String(role.applicationId) === applicationId &&
        (role.role === 'edit' || role.role === 'admin')
    })

    return (
      this.renderContent(
        <ServicesDeleteForm
          applicationType={!!kubernetesId ? 'kubernetes' : 'simple'}
          applicationId={applicationId}
          services={services}
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
  }

  renderContent = (content: JSX.Element, applicationName, kubernetesId, canEdit: boolean): JSX.Element => {
    return (
      <div className='pb-5'>
        {this.renderTitle(applicationName, kubernetesId, canEdit)}
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

  renderTitle = (applicationName, kubernetesId, canEdit: boolean): JSX.Element => {
    return (
      <Row className='align-items-center mb-5'>
        <Col xs='7'>
          <h1>
            <i className='fas fa-ship fa-fw mr-2'></i>
            {applicationName}
          </h1>
        </Col>
        <Col xs='5' className='text-right'>
          {kubernetesId && canEdit ? this.renderKubernetesControlButtons(kubernetesId) : null}
        </Col>
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

  onSubmitNothing(params): void {
    this.setState({})
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
      selectedData: {
        services: params.delete.services,
      }
    })
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
  changeMode(mode: ControlMode) {
    this.setState({ controlMode: mode })
  }

  /**
   * Reload services status
   *
   * Fetch services through API again
   */
  complete(param) {
    const {
      fetchAllServices
    } = this.props
    const {
      applicationId
    } = this.props.match.params

    this.props.addNotification(param)
    fetchAllServices(applicationId)
    this.setState({
      controlMode: ControlMode.VIEW_SERVICES_STATUS,
      submitted: false,
      selectedData: { services: [] }
    })
  }
}

export interface StateProps {
  application: APIRequest<Application>
  services: APIRequest<Service[]>
  deleteKubernetesServicesStatus: APIRequest<boolean[]>
  syncKubernetesServicesStatusStatus: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
}

const mapStateToProps = (state): StateProps => {
  const props = {
    application: state.fetchApplicationByIdReducer.applicationById,
    services: state.fetchAllServicesReducer.services,
    deleteKubernetesServicesStatus: state.deleteKubernetesServicesReducer.deleteKubernetesServices,
    syncKubernetesServicesStatusStatus: state.syncKubernetesStatusReducer.syncKubernetesStatus,
    userInfoStatus: state.userInfoReducer.userInfo,
  }
  return props
}

export interface DispatchProps {
  addNotification
  syncKubernetesServicesStatus
  fetchApplicationById: (id: string) => Promise<void>
  fetchAllServices: (applicationId: string) => Promise<void>
  deleteKubernetesServices: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    fetchApplicationById: (id: string) => fetchApplicationByIdDispatcher(dispatch, { id }),
    fetchAllServices: (applicationId: string) => fetchAllServicesDispatcher(dispatch, { applicationId }),
    deleteKubernetesServices: (params) => deleteKubernetesServicesDispatcher(dispatch, params),
    syncKubernetesServicesStatus: (params: SynKubernetesStatusParam) => syncKubernetesStatusDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{applicationId: string}>>(
    mapStateToProps, mapDispatchToProps
  )(Services))
