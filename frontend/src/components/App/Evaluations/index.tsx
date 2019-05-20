import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Breadcrumb, BreadcrumbItem, Button, Modal, ModalBody, ModalHeader, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  Evaluation, Application, UserInfo, Project,
  FetchEvaluationByIdParam, IdParam
} from '@src/apis'
import {
  addNotification,
  fetchAllEvaluationsDispatcher,
  deleteEvaluationsDispatcher
} from '@src/actions'
import { AddEvaluationFileModal } from '@components/App/Evaluations/AddEvaluationFileModal'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'
import EvaluationsDeleteForm from './EvaluationsDeleteForm'

type EvaluationsStatusProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string}>

interface EvaluationsStatusState {
  isDeleteEvaluationsModalOpen: boolean
  isAddEvaluationFileModalOpen: boolean
  selectedData: IdParam[]
  submitted: boolean
  notified: boolean
}

class Evaluations extends React.Component<EvaluationsStatusProps, EvaluationsStatusState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      isDeleteEvaluationsModalOpen: false,
      isAddEvaluationFileModalOpen: false,
      selectedData: [],
      submitted: false,
      notified: false
    }

    this.onSubmitDelete = this.onSubmitDelete.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.toggleAddEvaluationFileModalOpen = this.toggleAddEvaluationFileModalOpen.bind(this)
    this.deleteEvaluations = this.deleteEvaluations.bind(this)
    this.toggleDeleteEvaluationsModal = this.toggleDeleteEvaluationsModal.bind(this)
    this.renderEvaluations = this.renderEvaluations.bind(this)
    this.complete = this.complete.bind(this)
  }

  componentDidMount() {
    this.props.fetchAllEvaluations(this.props.match.params)
  }

  static getDerivedStateFromProps(nextProps: EvaluationsStatusProps, prevState: EvaluationsStatusState){
    const { deleteEvaluationsStatus } = nextProps
    const { submitted } = prevState

    const checkAllApiResultSucceeded =
      (result: APIRequest<boolean[]>) =>
        isAPISucceeded<boolean[]>(result) &&
        result.result.reduce((p, c) => (p && c))
    const checkAllApiResultFailed =
      (result: APIRequest<boolean[]>) =>
        (isAPISucceeded<boolean[]>(result) && !result.result.reduce((p, c) => (p && c))) || isAPIFailed<boolean[]>(result)

    if (submitted) {
      if (checkAllApiResultSucceeded(deleteEvaluationsStatus)) {
        nextProps.addNotification({ color: 'success', message: 'Successfully changed deletion' })
        nextProps.fetchAllEvaluations(nextProps.match.params)
        return {
          submitted: false,
          notified: true,
          selectedData: []
        }
      } else if (checkAllApiResultFailed(deleteEvaluationsStatus)) {
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
    const { project, application, evaluations, userInfoStatus, settings } = this.props
    const statuses: any = { project, application, evaluations }
    if (isAPISucceeded(settings) && settings.result.auth) {
      statuses.userInfoStatus = userInfoStatus
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={statuses}
        render={this.renderEvaluations}
      />
    )
  }

  /**
   * Render evaluations status / related form fields
   * with fetched API results
   *
   * @param fetchedResults Fetched data from APIs
   * @param canEdit Boolean value of user's editor permission
   */
  renderEvaluations(fetchedResults, canEdit) {
    const { onSubmitDelete, onCancel } = this

    const project: Project = fetchedResults.project
    const application = fetchedResults.application
    const { projectId, applicationId } = this.props.match.params
    const evaluations: Evaluation[] = fetchedResults.evaluations

    return (
      this.renderContent(
        <EvaluationsDeleteForm
          projectId={projectId}
          applicationId={applicationId}
          evaluations={evaluations}
          onSubmit={onSubmitDelete}
          onCancel={onCancel}
          canEdit={canEdit}
        />,
        project,
        application,
        canEdit
      )
    )
  }

  renderContent = (content: JSX.Element, project: Project, application: Application, canEdit: boolean): JSX.Element => {
    return (
      <div className='pb-5'>
        <Breadcrumb tag="nav" listTag="div">
          <BreadcrumbItem tag="a" href="/">Projects</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}`}>{project.name}</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications`}>Applications</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications/${application.applicationId}`}>{application.name}</BreadcrumbItem>
          <BreadcrumbItem active tag="span">Evaluations</BreadcrumbItem>
        </Breadcrumb>
        {this.renderTitle(canEdit)}
        <AddEvaluationFileModal
          projectId={this.props.match.params.projectId}
          applicationId={this.props.match.params.applicationId}
          isModalOpen={this.state.isAddEvaluationFileModalOpen}
          toggle={this.toggleAddEvaluationFileModalOpen}
          reload={this.complete}
        />
        <h3>
          All Evaluations
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
          onClick={this.toggleAddEvaluationFileModalOpen}>
          <i className='fas fa-robot fa-fw mr-2'></i>
          Add Evaluation Data
        </Button>
      </Col>
    )

    return (
      <Row className='align-items-center mb-5'>
        <Col xs='7'>
          <h1>
            <i className='fas fa-file fa-fw mr-2'></i>
            Evaluations
          </h1>
        </Col>
        {canEdit ? button : null}
      </Row>
    )
  }

  renderConfirmDeleteHostModal(): JSX.Element {
    const { isDeleteEvaluationsModalOpen } = this.state

    const executeDeletion = (event) => {
      if (this.state.selectedData.length > 0) {
        this.deleteEvaluations(this.state.selectedData)
      }
      this.toggleDeleteEvaluationsModal()
    }
    const cancelDeletion = (event) => {
      this.toggleDeleteEvaluationsModal()
      return Promise.resolve()
    }

    return (
      <Modal isOpen={isDeleteEvaluationsModalOpen} toggle={cancelDeletion} size='sm'>
        <ModalHeader toggle={cancelDeletion}>Delete Evaluations</ModalHeader>
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
  toggleDeleteEvaluationsModal(): void {
    this.setState({
      isDeleteEvaluationsModalOpen: !this.state.isDeleteEvaluationsModalOpen
    })
  }

  toggleAddEvaluationFileModalOpen(): void {
    this.setState({
      isAddEvaluationFileModalOpen: !this.state.isAddEvaluationFileModalOpen
    })
  }

  /**
   * Handle submit and call API to delete evaluations
   * Currently only supports to delete k8s evaluations
   *
   * @param params
   */
  onSubmitDelete(params): void {
    this.setState({
      isDeleteEvaluationsModalOpen: true,
      selectedData: params.delete_evaluations
    })
  }

  onCancel(): void {
    this.setState({
      selectedData: []
    })
  }

  deleteEvaluations(params): Promise<void> {
    const { projectId, applicationId } = this.props.match.params

    const apiParams =
      params.map((id) => (
        {
          projectId,
          applicationId,
          evaluationId: Number(id)
        }))

    this.setState({ submitted: true, notified: false })
    return this.props.deleteEvaluations(apiParams)
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
  evaluations: APIRequest<Evaluation[]>
  deleteEvaluationsStatus: APIRequest<boolean[]>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  const props = {
    project: state.fetchProjectByIdReducer.fetchProjectById,
    application: state.fetchApplicationByIdReducer.fetchApplicationById,
    evaluations: state.fetchAllEvaluationsReducer.fetchAllEvaluations,
    deleteEvaluationsStatus: state.deleteEvaluationsReducer.deleteEvaluations,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings
  }
  return props
}

export interface DispatchProps {
  addNotification
  fetchAllEvaluations: (params: FetchEvaluationByIdParam) => Promise<void>
  deleteEvaluations: (params: IdParam[]) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    fetchAllEvaluations: (params: FetchEvaluationByIdParam) => fetchAllEvaluationsDispatcher(dispatch, params),
    deleteEvaluations: (params: IdParam[]) => deleteEvaluationsDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string}>>(
    mapStateToProps, mapDispatchToProps
  )(Evaluations))
