import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Breadcrumb, BreadcrumbItem, Button, Modal, ModalBody, ModalHeader, Table } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  Application, UserInfo, Project, EvaluationResultDetail,
  FetchEvaluationResultByIdParam, IdParam, evalIO, EvaluationDetail
} from '@src/apis'
import {
  fetchEvaluationResultByIdDispatcher
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

type EvaluationResultProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string, evaluationResultId: number}>

class EvaluationResults extends React.Component<EvaluationResultProps> {
  private readonly NUM_DIGITS: number = 2

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
        evaluationResult
      )
    )
  }

  renderContent = (project: Project, application: Application, evaluationResult: EvaluationResultDetail): JSX.Element => {
    return (
      <div className='pb-5'>
        <Breadcrumb tag='nav' listtag='div'>
          <BreadcrumbItem tag='a' href='/'>Projects</BreadcrumbItem>
          <BreadcrumbItem tag='a' href={`/projects/${project.projectId}`}>{project.name}</BreadcrumbItem>
          <BreadcrumbItem tag='a' href={`/projects/${project.projectId}/applications`}>Applications</BreadcrumbItem>
          <BreadcrumbItem tag='a' href={`/projects/${project.projectId}/applications/${application.applicationId}`}>{application.name}</BreadcrumbItem>
          <BreadcrumbItem tag='a' href={`/projects/${project.projectId}/applications/${application.applicationId}/evaluation_results`}>Evaluation Results</BreadcrumbItem>
          <BreadcrumbItem active tag='span'>Evaluation Result Detail</BreadcrumbItem>
        </Breadcrumb>
        <h1 className='mb-5'>
          <i className='fas fa-diagnoses fa-fw mr-2'></i>
          Evaluation Result
        </h1>
        {this.renderMetrics(evaluationResult)}
        {this.renderDetails(evaluationResult)}
      </div>
    )
  }
  renderMetrics = (evaluationResult: EvaluationResultDetail): JSX.Element => {
    const metrics = evaluationResult.metrics
    return (
      <div className='mb-4'>
        <h3>Metrics</h3>
        <Table>
          <tbody>
            <tr key='num'>
              <th scope='row'>Number of data</th>
              <td>{metrics.num}</td>
            </tr>
            <tr key='accuracy'>
              <th scope='row'>Accuracy</th>
              <td>{metrics.accuracy.toFixed(this.NUM_DIGITS)}</td>
            </tr>
          </tbody>
        </Table>
        <Table bordered>
          <thead>
            <tr>
              <th>Label</th>
              <th>Precision</th>
              <th>Recall</th>
              <th>F-measure</th>
            </tr>
          </thead>
          <tbody>
            {metrics.label.map((l: evalIO, i: number) => (
              <tr key={i}>
                <th scope='row'>{this.evalIOToStr(l)}</th>
                <td>{metrics.precision[i].toFixed(this.NUM_DIGITS)}</td>
                <td>{metrics.recall[i].toFixed(this.NUM_DIGITS)}</td>
                <td>{metrics.fvalue[i].toFixed(this.NUM_DIGITS)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  renderDetails = (evaluationResult: EvaluationResultDetail): JSX.Element => {
    return (
      <div className='mb-4'>
        <h4>Result of each data</h4>
        <Table bordered>
          <thead>
            <tr>
              <th>Input</th>
              <th>Output</th>
              <th>Label</th>
              <th>IsCorrect</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {evaluationResult.details.map((d: EvaluationDetail, i: number) => (
              <tr key={i}>
                <td>{this.evalIOToStr(d.input)}</td>
                <td>{this.evalIOToStr(d.output)}</td>
                <td>{this.evalIOToStr(d.label)}</td>
                <td>{String(d.isCorrect)}</td>
                <td>{this.evalIOToStr(d.score)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  evalIOToStr = (io: evalIO): string => {
    // cast io to array.(e.g. 1 -> [1], "foo" -> ["foo"], [1] -> [1], ["foo"] -> ["foo"])
    const ioArray = [].concat(io)
    let ioArrayStr
    if (ioArray.length > 0 && typeof ioArray[0] === 'number') {
      ioArrayStr = ioArray.map((i) => i.toFixed(this.NUM_DIGITS))
    } else {
      ioArrayStr = ioArray
    }
    return ioArrayStr.join(', ')
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
