import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Breadcrumb, BreadcrumbItem, Button, Modal, ModalBody, ModalHeader, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  EvaluationResult, Application, UserInfo, Project,
  FetchEvaluationResultByIdParam, IdParam, Model, Evaluation,
  FetchEvaluationByIdParam, FetchModelByIdParam
} from '@src/apis'
import {
  addNotification,
  fetchAllEvaluationResultsDispatcher,
  deleteEvaluationResultsDispatcher,
  fetchAllEvaluationsDispatcher,
  fetchAllModelsDispatcher,
} from '@src/actions'
import { EvaluateModal } from '@components/App/EvaluationResults/EvaluateModal'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import EvaluationResultsDeleteForm from './EvaluationResultsDeleteForm'

type EvaluationResultsStatusProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string}>

interface EvaluationResultsStatusState {
  isDeleteEvaluationResultsModalOpen: boolean
  isEvaluateModalOpen: boolean
  selectedData: IdParam[]
  submitted: boolean
  notified: boolean
}

class EvaluationResults extends React.Component<EvaluationResultsStatusProps, EvaluationResultsStatusState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      isDeleteEvaluationResultsModalOpen: false,
      isEvaluateModalOpen: false,
      selectedData: [],
      submitted: false,
      notified: false
    }

    this.onSubmitDelete = this.onSubmitDelete.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.toggleEvaluateModalOpen = this.toggleEvaluateModalOpen.bind(this)
    this.deleteEvaluationResults = this.deleteEvaluationResults.bind(this)
    this.toggleDeleteEvaluationResultsModal = this.toggleDeleteEvaluationResultsModal.bind(this)
    this.renderEvaluationResults = this.renderEvaluationResults.bind(this)
    this.complete = this.complete.bind(this)
  }

  componentDidMount() {
    this.props.fetchAllEvaluationResults(this.props.match.params)
    this.props.fetchAllModels(this.props.match.params)
    this.props.fetchAllEvaluations(this.props.match.params)
  }

  static getDerivedStateFromProps(nextProps: EvaluationResultsStatusProps, prevState: EvaluationResultsStatusState){
    const { deleteEvaluationResultsStatus } = nextProps
    const { submitted } = prevState

    const checkAllApiResultSucceeded =
      (result: APIRequest<boolean[]>) =>
        isAPISucceeded<boolean[]>(result) &&
        result.result.reduce((p, c) => (p && c))
    const checkAllApiResultFailed =
      (result: APIRequest<boolean[]>) =>
        (isAPISucceeded<boolean[]>(result) && !result.result.reduce((p, c) => (p && c))) || isAPIFailed<boolean[]>(result)

    if (submitted) {
      if (checkAllApiResultSucceeded(deleteEvaluationResultsStatus)) {
        nextProps.addNotification({ color: 'success', message: 'Successfully changed deletion' })
        nextProps.fetchAllEvaluationResults(nextProps.match.params)
        return {
          submitted: false,
          notified: true,
          selectedData: []
        }
      } else if (checkAllApiResultFailed(deleteEvaluationResultsStatus)) {
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
    const { project, application, evaluationResults, models, evaluations, userInfoStatus, settings } = this.props
    const statuses: any = { project, application, models, evaluations, evaluationResults }
    if (isAPISucceeded(settings) && settings.result.auth) {
      statuses.userInfoStatus = userInfoStatus
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={statuses}
        render={this.renderEvaluationResults}
      />
    )
  }

  /**
   * Render evaluationResults status / related form fields
   * with fetched API results
   *
   * @param fetchedResults Fetched data from APIs
   * @param canEdit Boolean value of user's editor permission
   */
  renderEvaluationResults(fetchedResults, canEdit) {
    const { onSubmitDelete, onCancel } = this

    const project: Project = fetchedResults.project
    const application = fetchedResults.application
    const models = fetchedResults.models
    const evaluations = fetchedResults.evaluations
    const { projectId, applicationId } = this.props.match.params
    const evaluationResults: EvaluationResult[] = fetchedResults.evaluationResults

    return (
      this.renderContent(
        <EvaluationResultsDeleteForm
          projectId={projectId}
          applicationId={applicationId}
          evaluationResults={evaluationResults}
          onSubmit={onSubmitDelete}
          onCancel={onCancel}
          canEdit={canEdit}
        />,
        project,
        application,
        models,
        evaluations,
        canEdit
      )
    )
  }

  renderContent = (content: JSX.Element, project: Project, application: Application, models: Model[], evaluations: Evaluation[], canEdit: boolean): JSX.Element => {
    return (
      <div className='pb-5'>
        <Breadcrumb tag="nav" listTag="div">
          <BreadcrumbItem tag="a" href="/">Projects</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}`}>{project.name}</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications`}>Applications</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications/${application.applicationId}`}>{application.name}</BreadcrumbItem>
          <BreadcrumbItem active tag="span">Evaluation Results</BreadcrumbItem>
        </Breadcrumb>
        {this.renderTitle(canEdit)}
        <EvaluateModal
          projectId={this.props.match.params.projectId}
          applicationId={this.props.match.params.applicationId}
          models={models}
          evaluations={evaluations}
          isModalOpen={this.state.isEvaluateModalOpen}
          toggle={this.toggleEvaluateModalOpen}
          reload={this.complete}
        />
        <h3>
          All Evaluation Results
        </h3>
        <hr />
        {content}
        {this.renderConfirmDeleteHostModal()}
      </div>
    )
  }

  renderTitle = (canEdit: boolean): JSX.Element => {
    const button = (
      <Col xs='5' className='text-right'>
        <Button
          color='primary'
          size='sm'
          onClick={this.toggleEvaluateModalOpen}>
          <i className='fas fa-robot fa-fw mr-2'></i>
          Evaluate Model
        </Button>
      </Col>
    )

    return (
      <Row className='align-items-center mb-5'>
        <Col xs='7'>
          <h1>
            <i className='fas fa-diagnoses fa-fw mr-2'></i>
            Evaluation Results
          </h1>
        </Col>
        {canEdit ? button : null}
      </Row>
    )
  }

  renderConfirmDeleteHostModal(): JSX.Element {
    const { isDeleteEvaluationResultsModalOpen } = this.state

    const executeDeletion = (event) => {
      if (this.state.selectedData.length > 0) {
        this.deleteEvaluationResults(this.state.selectedData)
      }
      this.toggleDeleteEvaluationResultsModal()
    }
    const cancelDeletion = (event) => {
      this.toggleDeleteEvaluationResultsModal()
      return Promise.resolve()
    }

    return (
      <Modal isOpen={isDeleteEvaluationResultsModalOpen} toggle={cancelDeletion} size='sm'>
        <ModalHeader toggle={cancelDeletion}>Delete EvaluationResults</ModalHeader>
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
  toggleDeleteEvaluationResultsModal(): void {
    this.setState({
      isDeleteEvaluationResultsModalOpen: !this.state.isDeleteEvaluationResultsModalOpen
    })
  }

  toggleEvaluateModalOpen(): void {
    this.setState({
      isEvaluateModalOpen: !this.state.isEvaluateModalOpen
    })
  }

  /**
   * Handle submit and call API to delete evaluationResults
   * Currently only supports to delete k8s evaluationResults
   *
   * @param params
   */
  onSubmitDelete(params): void {
    this.setState({
      isDeleteEvaluationResultsModalOpen: true,
      selectedData: params.delete_evaluationResults
    })
  }

  onCancel(): void {
    this.setState({
      selectedData: []
    })
  }

  deleteEvaluationResults(params): Promise<void> {
    const { projectId, applicationId } = this.props.match.params

    const apiParams =
      params.map((id) => (
        {
          projectId,
          applicationId,
          evaluationResultId: Number(id)
        }))

    this.setState({ submitted: true, notified: false })
    return this.props.deleteEvaluationResults(apiParams)
  }

  complete(param) {
    this.props.addNotification(param)
    this.setState({
      submitted: false,
      selectedData: []
    })
  }
}

export interface StateProps {
  project: APIRequest<Project>
  application: APIRequest<Application>
  models: APIRequest<Model[]>
  evaluations: APIRequest<Evaluation[]>
  evaluationResults: APIRequest<EvaluationResult[]>
  deleteEvaluationResultsStatus: APIRequest<boolean[]>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  const props = {
    project: state.fetchProjectByIdReducer.fetchProjectById,
    application: state.fetchApplicationByIdReducer.fetchApplicationById,
    models: state.fetchAllModelsReducer.fetchAllModels,
    evaluations: state.fetchAllEvaluationsReducer.fetchAllEvaluations,
    evaluationResults: state.fetchAllEvaluationResultsReducer.fetchAllEvaluationResults,
    deleteEvaluationResultsStatus: state.deleteEvaluationResultsReducer.deleteEvaluationResults,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings
  }
  return props
}

export interface DispatchProps {
  addNotification
  fetchAllEvaluationResults: (params: FetchEvaluationResultByIdParam) => Promise<void>
  fetchAllModels: (params: FetchModelByIdParam) => Promise<void>
  fetchAllEvaluations: (params: FetchEvaluationByIdParam) => Promise<void>
  deleteEvaluationResults: (params: IdParam[]) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    fetchAllEvaluationResults: (params: FetchEvaluationResultByIdParam) => fetchAllEvaluationResultsDispatcher(dispatch, params),
    fetchAllModels: (params: FetchModelByIdParam) => fetchAllModelsDispatcher(dispatch, params),
    fetchAllEvaluations: (params: FetchEvaluationByIdParam) => fetchAllEvaluationsDispatcher(dispatch, params),
    deleteEvaluationResults: (params: IdParam[]) => deleteEvaluationResultsDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string}>>(
    mapStateToProps, mapDispatchToProps
  )(EvaluationResults))
