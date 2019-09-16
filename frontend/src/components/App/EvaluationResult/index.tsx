import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Breadcrumb, BreadcrumbItem, Button, Modal, ModalBody, ModalHeader, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  Application, UserInfo, Project, EvaluationResultDetail,
  FetchEvaluationResultByIdParam, IdParam
} from '@src/apis'
import {
  fetchEvaluationResultByIdDispatcher
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

type EvaluationResultProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string, evaluationResultId: number}>

class EvaluationResults extends React.Component<EvaluationResultProps> {
  constructor(props, context) {
    super(props, context)

    this.renderEvaluationResult = this.renderEvaluationResult.bind(this)
  }

  componentDidMount() {
    this.props.fetchEvaluationResultById(this.props.match.params)
  }

  render(): JSX.Element {
    const { project, application, evaluationResult, userInfoStatus, settings } = this.props
    const statuses: any = { project, application, evaluationResult }
    if (isAPISucceeded(settings) && settings.result.auth) {
      statuses.userInfoStatus = userInfoStatus
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={statuses}
        render={this.renderEvaluationResult}
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
  renderEvaluationResult(fetchedResults, canEdit) {

    const project: Project = fetchedResults.project
    const application = fetchedResults.application
    const { projectId, applicationId } = this.props.match.params
    const evaluationResult: EvaluationResultDetail = fetchedResults.evaluationResult

    return (
      this.renderContent(
        project,
        application,
        evaluationResult,
        canEdit
      )
    )
  }

  renderContent = (project: Project, application: Application, evaluationResult: EvaluationResultDetail, canEdit: boolean): JSX.Element => {
    return (
      <div className='pb-5'>
        <Breadcrumb tag="nav" listtag="div">
          <BreadcrumbItem tag="a" href="/">Projects</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}`}>{project.name}</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications`}>Applications</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications/${application.applicationId}`}>{application.name}</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications/${application.applicationId}/evaluation_results`}>Evaluation Result</BreadcrumbItem>
          <BreadcrumbItem active tag="span">Evaluation Result Detail</BreadcrumbItem>
        </Breadcrumb>
        <h3>
          Evaluation Result Detail
        </h3>
      </div>
    )
  }
}

export interface StateProps {
  project: APIRequest<Project>
  application: APIRequest<Application>
  evaluationResult: APIRequest<EvaluationResultDetail>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  const props = {
    project: state.fetchProjectByIdReducer.fetchProjectById,
    application: state.fetchApplicationByIdReducer.fetchApplicationById,
    evaluationResult: state.fetchEvaluationResultByIdReducer.fetchEvaluationResultById,
    deleteEvaluationResultsStatus: state.deleteEvaluationResultsReducer.deleteEvaluationResults,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings
  }
  return props
}

export interface DispatchProps {
  fetchEvaluationResultById: (params: FetchEvaluationResultByIdParam) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchEvaluationResultById: (params: FetchEvaluationResultByIdParam) => fetchEvaluationResultByIdDispatcher(dispatch, params)
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string, evaluationResultId: number}>>(
    mapStateToProps, mapDispatchToProps
  )(EvaluationResults))
