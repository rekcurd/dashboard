import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Button, Modal, ModalBody, ModalHeader, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { Model, Application } from '@src/apis'
import {
  addNotification,
  fetchApplicationByIdDispatcher,
  fetchAllModelsDispatcher,
  deleteKubernetesModelsDispatcher,
} from '@src/actions'
import { AddModelFileModal } from '@components/App/Model/Modals/AddModelFileModal'
import ModelsDeleteForm from './ModelsDeleteForm'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

export enum ControlMode {
  VIEW_MODELS_STATUS,
  SELECT_TARGETS,
  UPLOAD_MODEL
}

type ModelsStatusProps = DispatchProps & StateProps & RouteComponentProps<{applicationId: string}>

class Models extends React.Component<ModelsStatusProps, any> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      controlMode: ControlMode.VIEW_MODELS_STATUS,
      isAddModelFileModalOpen: false,
      isDeleteModelsModalOpen: false,
      selectedData: { models: [] },
      submitted: false,
      syncSubmitted: false,
      syncNotified: false
    }

    this.onSubmitDelete = this.onSubmitDelete.bind(this)
    this.deleteKubernetesModels = this.deleteKubernetesModels.bind(this)
    this.toggleDeleteModelsModal = this.toggleDeleteModelsModal.bind(this)
    this.toggleAddModelFileModalOpen = this.toggleAddModelFileModalOpen.bind(this)
    this.renderModels = this.renderModels.bind(this)
    this.changeMode = this.changeMode.bind(this)
    this.complete = this.complete.bind(this)
  }

  componentWillMount() {
    const { applicationId } = this.props.match.params

    this.props.fetchApplicationById(applicationId)
    this.props.fetchAllModels(applicationId)
  }

  componentWillReceiveProps(nextProps: ModelsStatusProps) {
    const { deleteKubernetesModelsStatus } = nextProps
    const { controlMode, submitted } = this.state

    const checkAllApiResultStatus =
      (result: APIRequest<boolean[]>) =>
        isAPISucceeded<boolean[]>(result) &&
        result.result.reduce((p, c) => (p && c))

    if (submitted && controlMode === ControlMode.SELECT_TARGETS) {
      if (checkAllApiResultStatus(deleteKubernetesModelsStatus)) {
        this.complete({ color: 'success', message: 'Successfully changed deletion' })
      } else {
        this.complete({ color: 'error', message: 'Something went wrong, try again later' })
      }
    }
  }

  // Render methods

  render(): JSX.Element {
    const { application, models } = this.props
    if ( this.props.match.params.applicationId === 'add' ) {
      return null
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={{ application, models }}
        render={this.renderModels}
      />
    )
  }

  /**
   * Render models status / related form fields
   * with fetched API results
   *
   * @param fetchedResults Fetched data from APIs
   */
  renderModels(fetchedResults) {
    const { controlMode } = this.state
    const {
      onSubmitNothing,
      onSubmitDelete,
      changeMode
    } = this

    const { kubernetesId, name } = fetchedResults.application
    const { applicationId } = this.props.match.params

    const models: Model[] = fetchedResults.models
    const onSubmitMap = {
      [ControlMode.VIEW_MODELS_STATUS]: onSubmitNothing,
      [ControlMode.SELECT_TARGETS]: onSubmitDelete,
    }

    return (
      this.renderContent(
        <ModelsDeleteForm
          applicationType={!!kubernetesId ? 'kubernetes' : 'simple'}
          applicationId={applicationId}
          models={models}
          mode={controlMode}
          onSubmit={onSubmitMap[controlMode]}
          changeMode={changeMode}
        />,
        name,
        kubernetesId
      )
    )
  }

  renderContent = (content: JSX.Element, applicationName, kubernetesId): JSX.Element => {
    return (
      <div className='pb-5'>
        {this.renderTitle(applicationName, kubernetesId)}
        <AddModelFileModal
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
        {
          this.state.controlMode === ControlMode.SELECT_TARGETS
            ? this.renderConfirmDeleteHostModal()
            : null
        }
      </div>
    )
  }

  renderTitle = (applicationName, kubernetesId): JSX.Element => {
    return (
      <Row className='align-items-center mb-5'>
        <Col xs='7'>
          <h1>
            <i className='fas fa-ship fa-fw mr-2'></i>
            {applicationName}
          </h1>
        </Col>
        <Col xs='5' className='text-right'>
          <Button
            color='primary'
            size='sm'
            onClick={this.toggleAddModelFileModalOpen}
          >
            <i className='fas fa-robot fa-fw mr-2'></i>
            Add Model
          </Button>
        </Col>
      </Row>
    )
  }

  renderConfirmDeleteHostModal(): JSX.Element {
    const { isDeleteModelsModalOpen } = this.state

    const cancel = () => {
      this.toggleDeleteModelsModal()
    }

    const executeDeletion = (event) => {
      this.deleteKubernetesModels(this.state.selectedData.models)
      this.toggleDeleteModelsModal()
    }

    return (
      <Modal isOpen={isDeleteModelsModalOpen} toggle={cancel} size='sm'>
        <ModalHeader toggle={cancel}>Delete Kubernetes Models</ModalHeader>
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

  onSubmitNothing(params): void {
    this.setState({})
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
      selectedData: {
        models: params.delete.models,
      }
    })
  }

  deleteKubernetesModels(params): Promise<void> {
    const { deleteKubernetesModels } = this.props
    const { applicationId } = this.props.match.params

    const apiParams =
      Object.entries(params)
        .filter(([key, value]) => (value))
        .map(
          ([key, value]) => (
            {
              applicationId,
              modelId: key
            }))

    this.setState({ submitted: true })

    return deleteKubernetesModels(apiParams)
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
    const {
      fetchAllModels
    } = this.props
    const {
      applicationId
    } = this.props.match.params

    this.props.addNotification(param)
    fetchAllModels(applicationId)
    this.setState({
      controlMode: ControlMode.VIEW_MODELS_STATUS,
      submitted: false,
      selectedData: { models: [] }
    })
  }
}

export interface StateProps {
  application: APIRequest<Application>
  models: APIRequest<Model[]>
  deleteKubernetesModelsStatus: APIRequest<boolean[]>
}

const mapStateToProps = (state): StateProps => {
  const props = {
    application: state.fetchApplicationByIdReducer.applicationById,
    models: state.fetchAllModelsReducer.models,
    deleteKubernetesModelsStatus: state.deleteKubernetesModelsReducer.deleteKubernetesModels,
  }
  return props
}

export interface DispatchProps {
  addNotification
  fetchApplicationById: (id: string) => Promise<void>
  fetchAllModels: (application_id: string) => Promise<void>
  deleteKubernetesModels: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    fetchApplicationById: (id: string) => fetchApplicationByIdDispatcher(dispatch, { id }),
    fetchAllModels: (application_id: string) => fetchAllModelsDispatcher(dispatch, { application_id }),
    deleteKubernetesModels: (params) => deleteKubernetesModelsDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{applicationId: string}>>(
    mapStateToProps, mapDispatchToProps
  )(Models))
