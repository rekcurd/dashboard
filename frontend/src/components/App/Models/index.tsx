import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Button, Modal, ModalBody, ModalHeader, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  Model, Application, UserInfo, Project,
  FetchApplicationByIdParam, FetchModelByIdParam, IdParam
} from '@src/apis'
import {
  addNotification,
  fetchApplicationByIdDispatcher,
  fetchAllModelsDispatcher,
  deleteModelsDispatcher
} from '@src/actions'
import { AddModelFileModal } from '@components/App/Model/Modals/AddModelFileModal'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import ModelsDeleteForm from './ModelsDeleteForm'


type ModelsStatusProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string}>

interface ModelsStatusState {
  isDeleteModelsModalOpen: boolean
  isAddModelFileModalOpen: boolean
  selectedData: IdParam[]
  submitted: boolean
  notified: boolean
}

class Models extends React.Component<ModelsStatusProps, ModelsStatusState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      isDeleteModelsModalOpen: false,
      isAddModelFileModalOpen: false,
      selectedData: [],
      submitted: false,
      notified: false
    }

    this.onSubmitDelete = this.onSubmitDelete.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.toggleAddModelFileModalOpen = this.toggleAddModelFileModalOpen.bind(this)
    this.deleteModels = this.deleteModels.bind(this)
    this.toggleDeleteModelsModal = this.toggleDeleteModelsModal.bind(this)
    this.renderModels = this.renderModels.bind(this)
    this.complete = this.complete.bind(this)
  }

  componentDidMount() {
    this.props.fetchApplicationById(this.props.match.params)
    this.props.fetchAllModels(this.props.match.params)
  }

  static getDerivedStateFromProps(nextProps: ModelsStatusProps, prevState: ModelsStatusState){
    const { deleteModelsStatus } = nextProps
    const { submitted } = prevState

    const checkAllApiResultSucceeded =
      (result: APIRequest<boolean[]>) =>
        isAPISucceeded<boolean[]>(result) &&
        result.result.reduce((p, c) => (p && c))
    const checkAllApiResultFailed =
      (result: APIRequest<boolean[]>) =>
        (isAPISucceeded<boolean[]>(result) && !result.result.reduce((p, c) => (p && c))) || isAPIFailed<boolean[]>(result)

    if (submitted) {
      if (checkAllApiResultSucceeded(deleteModelsStatus)) {
        nextProps.addNotification({ color: 'success', message: 'Successfully changed deletion' })
        nextProps.fetchAllModels(nextProps.match.params)
        return {
          submitted: false,
          notified: true,
          selectedData: []
        }
      } else if (checkAllApiResultFailed(deleteModelsStatus)) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong, try again later' })
        return {
          submitted: false,
          notified: true,
          selectedData: []
        }
      }
    }
    return null
  }

  // Render methods

  render(): JSX.Element {
    const { fetchProjectByIdStatus, application, models, userInfoStatus, settings } = this.props
    const statuses: any = { fetchProjectByIdStatus, application, models }
    if (isAPISucceeded(settings) && settings.result.auth) {
      statuses.userInfoStatus = userInfoStatus
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={statuses}
        render={this.renderModels}
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
    const { onSubmitDelete, onCancel } = this

    const project: Project = fetchedResults.fetchProjectByIdStatus
    const applicationName = fetchedResults.application.name
    const { projectId, applicationId } = this.props.match.params
    const models: Model[] = fetchedResults.models

    return (
      this.renderContent(
        <ModelsDeleteForm
          projectId={projectId}
          applicationId={applicationId}
          models={models}
          onSubmit={onSubmitDelete}
          onCancel={onCancel}
          canEdit={canEdit}
        />,
        applicationName,
        project.useKubernetes,
        canEdit
      )
    )
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
          <i className='fas fa-database fa-fw mr-2'></i>
          Models
        </h3>
        <hr />
        {content}
        {this.renderConfirmDeleteHostModal()}
      </div>
    )
  }

  renderTitle = (applicationName, kubernetesMode, canEdit: boolean): JSX.Element => {
    const button = (
      <Col xs='5' className='text-right'>
        <Button
          color='primary'
          size='sm'
          onClick={this.toggleAddModelFileModalOpen}>
          <i className='fas fa-robot fa-fw mr-2'></i>
          Add Model
        </Button>
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
        {canEdit ? button : null}
      </Row>
    )
  }

  renderConfirmDeleteHostModal(): JSX.Element {
    const { isDeleteModelsModalOpen } = this.state

    const executeDeletion = (event) => {
      if (this.state.selectedData.length > 0) {
        this.deleteModels(this.state.selectedData)
      }
      this.toggleDeleteModelsModal()
    }
    const cancelDeletion = (event) => {
      this.toggleDeleteModelsModal()
      return Promise.resolve()
    }

    return (
      <Modal isOpen={isDeleteModelsModalOpen} toggle={cancelDeletion} size='sm'>
        <ModalHeader toggle={cancelDeletion}>Delete Models</ModalHeader>
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
            onClick={cancelDeletion}
          >
            <i className='fas fa-ban mr-3' />
            Cancel
          </Button>
        </div>
      </Modal>
    )
  }

  // Event handing methods
  toggleDeleteModelsModal(): void {
    this.setState({
      isDeleteModelsModalOpen: !this.state.isDeleteModelsModalOpen
    })
  }

  toggleAddModelFileModalOpen(): void {
    this.setState({
      isAddModelFileModalOpen: !this.state.isAddModelFileModalOpen
    })
  }

  /**
   * Handle submit and call API to delete models
   * Currently only supports to delete k8s models
   *
   * @param params
   */
  onSubmitDelete(params): void {
    this.setState({
      isDeleteModelsModalOpen: true,
      selectedData: params.delete_models
    })
  }

  onCancel(): void {
    this.setState({
      selectedData: []
    })
  }

  deleteModels(params): Promise<void> {
    const { projectId, applicationId } = this.props.match.params

    const apiParams =
      params.map((id) => (
        {
          projectId,
          applicationId,
          modelId: Number(id)
        }))

    this.setState({ submitted: true, notified: false })
    return this.props.deleteModels(apiParams)
  }

  complete(param) {
    this.props.addNotification(param)
    this.props.fetchAllModels(this.props.match.params)
    this.setState({
      submitted: false,
      selectedData: []
    })
  }
}

export interface StateProps {
  fetchProjectByIdStatus: APIRequest<Project>
  application: APIRequest<Application>
  models: APIRequest<Model[]>
  deleteModelsStatus: APIRequest<boolean[]>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  const props = {
    fetchProjectByIdStatus: state.fetchProjectByIdReducer.fetchProjectById,
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
  fetchApplicationById: (params: FetchApplicationByIdParam) => Promise<void>
  fetchAllModels: (params: FetchModelByIdParam) => Promise<void>
  deleteModels: (params: IdParam[]) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    fetchApplicationById: (params: FetchApplicationByIdParam) => fetchApplicationByIdDispatcher(dispatch, params),
    fetchAllModels: (params: FetchModelByIdParam) => fetchAllModelsDispatcher(dispatch, params),
    deleteModels: (params: IdParam[]) => deleteModelsDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string}>>(
    mapStateToProps, mapDispatchToProps
  )(Models))
