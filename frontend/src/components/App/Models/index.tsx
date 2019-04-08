import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Button, Modal, ModalBody, ModalHeader, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  Kubernetes, Model, SyncKubernetesParam, Application, UserInfo,
  FetchApplicationByIdParam, FetchModelByIdParam, IdParam, FetchKubernetesByIdParam
} from '@src/apis'
import {
  addNotification,
  fetchAllKubernetesDispatcher,
  fetchApplicationByIdDispatcher,
  fetchAllModelsDispatcher,
  deleteModelsDispatcher,
  syncKubernetesDispatcher
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import ModelsDeleteForm from './ModelsDeleteForm'


export enum ControlMode {
  VIEW_SERVICES_STATUS,
  SELECT_TARGETS,
}

type ModelsStatusProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string}>

interface ModelsStatusState {
  controlMode: ControlMode
  isDeleteModelsModalOpen: boolean
  selectedData: IdParam[]
  submitted: boolean
  syncSubmitted: boolean
  syncNotified: boolean
}

class Models extends React.Component<ModelsStatusProps, ModelsStatusState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      controlMode: ControlMode.VIEW_SERVICES_STATUS,
      isDeleteModelsModalOpen: false,
      selectedData: [],
      submitted: false,
      syncSubmitted: false,
      syncNotified: false
    }

    this.onSubmitDelete = this.onSubmitDelete.bind(this)
    this.deleteModels = this.deleteModels.bind(this)
    this.toggleDeleteModelsModal = this.toggleDeleteModelsModal.bind(this)
    this.syncModels = this.syncModels.bind(this)
    this.renderModels = this.renderModels.bind(this)
    this.changeMode = this.changeMode.bind(this)
    this.complete = this.complete.bind(this)
  }

  componentDidMount() {
    this.props.fetchApplicationById(this.props.match.params)
    this.props.fetchAllModels(this.props.match.params)
  }

  static getDerivedStateFromProps(nextProps: ModelsStatusProps, prevState: ModelsStatusState){
    const {
      deleteModelsStatus,
      syncKubernetesStatus
    } = nextProps
    const { controlMode, submitted, syncSubmitted, syncNotified } = prevState

    const checkAllApiResultStatus =
      (result: APIRequest<boolean[]>) =>
        isAPISucceeded<boolean[]>(result) &&
        result.result.reduce((p, c) => (p && c))

    if (submitted && controlMode === ControlMode.SELECT_TARGETS) {
      if (checkAllApiResultStatus(deleteModelsStatus)) {
        nextProps.addNotification({ color: 'success', message: 'Successfully changed deletion' })
      } else {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong, try again later' })
      }
      nextProps.fetchAllModels(nextProps.match.params)
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
    const { application, models, userInfoStatus, settings } = this.props
    const statuses: any = { application, models }
    if (isAPISucceeded(settings) && settings.result.auth) {
      statuses.userInfoStatus = userInfoStatus
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={statuses}
        render={this.renderModels}
        projectId={this.props.match.params.projectId}
        applicationId={this.props.match.params.applicationId}
      />
    )
  }

  /**
   * Render models status / related form fields
   * with fetched API results
   *
   * @param fetchedResults Fetched data from APIs
   * @param canEdit Boolean value of user's editor permission
   */
  renderModels(fetchedResults, canEdit) {
    const { controlMode } = this.state
    const {
      onSubmitNothing,
      onSubmitDelete,
      changeMode
    } = this

    const kubernetesMode = fetchedResults.kuberneteses.length > 0
    const applicationName = fetchedResults.application.name
    const { projectId, applicationId } = this.props.match.params

    const models: Model[] = fetchedResults.models
    const onSubmitMap = {
      [ControlMode.VIEW_SERVICES_STATUS]: onSubmitNothing,
      [ControlMode.SELECT_TARGETS]: onSubmitDelete,
    }

    return (
      this.renderContent(
        <ModelsDeleteForm
          projectId={projectId}
          applicationId={applicationId}
          models={models}
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
          Models
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
    const { syncModels } = this
    const { projectId, applicationId } = this.props.match.params

    return (
      <React.Fragment>
        <Button
          color='primary'
          size='sm'
          onClick={() => { push(`/projects/${projectId}/applications/${applicationId}/models/add`) }}
        >
          <i className='fas fa-box fa-fw mr-2'></i>
          Add Model
        </Button>
        {` `}
        <Button
          color='success' size='sm'
          onClick={(event) => syncModels()}
        >
          <i className='fas fa-sync-alt fa-fw mr-2'></i>
          Sync
        </Button>
      </React.Fragment>
    )
  }

  renderConfirmDeleteHostModal(): JSX.Element {
    const { isDeleteModelsModalOpen } = this.state

    const cancel = () => {
      this.toggleDeleteModelsModal()
    }

    const executeDeletion = (event) => {
      this.deleteModels(this.state.selectedData)
      this.toggleDeleteModelsModal()
    }

    return (
      <Modal isOpen={isDeleteModelsModalOpen} toggle={cancel} size='sm'>
        <ModalHeader toggle={cancel}>Delete Models</ModalHeader>
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

  syncModels(): void {
    this.setState({ syncSubmitted: true, syncNotified: false })
    this.props.syncKubernetes(this.props.match.params)
  }

  // Event handing methods
  toggleDeleteModelsModal(): void {
    this.setState({
      isDeleteModelsModalOpen: !this.state.isDeleteModelsModalOpen
    })
  }

  onSubmitNothing(params): void {}

  /**
   * Handle submit and call API to delete models
   * Currently only supports to delete k8s models
   *
   * @param params
   */
  onSubmitDelete(params): void {
    this.setState({
      isDeleteModelsModalOpen: true,
      selectedData: params
    })
  }

  deleteModels(params): Promise<void> {
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

    return this.props.deleteModels(apiParams)
  }

  // Utils
  changeMode(mode: ControlMode) {
    this.setState({ controlMode: mode })
  }

  /**
   * Reload models status
   *
   * Fetch models through API again
   */
  complete(param) {
    this.props.addNotification(param)
    this.props.fetchAllModels(this.props.match.params)
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
  models: APIRequest<Model[]>
  deleteModelsStatus: APIRequest<boolean[]>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  const props = {
    syncKubernetesStatus: state.syncKubernetesReducer.syncKubernetes,
    kuberneteses: state.fetchAllKubernetesReducer.fetchAllKubernetes,
    application: state.fetchApplicationByIdReducer.fetchApplicationById,
    models: state.fetchAllModelsReducer.fetchAllModels,
    deleteModelsStatus: state.deleteModelsReducer.deleteModels,
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
  fetchAllModels: (params: FetchModelByIdParam) => Promise<void>
  deleteModels: (params: IdParam[]) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    syncKubernetes: (params: SyncKubernetesParam) => syncKubernetesDispatcher(dispatch, params),
    fetchAllKubernetes: (params: FetchKubernetesByIdParam) => fetchAllKubernetesDispatcher(dispatch, params),
    fetchApplicationById: (params: FetchApplicationByIdParam) => fetchApplicationByIdDispatcher(dispatch, params),
    fetchAllModels: (params: FetchModelByIdParam) => fetchAllModelsDispatcher(dispatch, params),
    deleteModels: (params: IdParam[]) => deleteModelsDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string}>>(
    mapStateToProps, mapDispatchToProps
  )(Models))
