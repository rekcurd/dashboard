import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Breadcrumb, BreadcrumbItem, Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  UserInfo, KubernetesGitKey,
  FetchKubernetesGitKeyParam, KubernetesGitKeyParam, Application, Project
} from '@src/apis'
import {
  addNotification,
  fetchKubernetesGitKeyDispatcher,
  saveKubernetesGitKeyDispatcher
} from '@src/actions'
import {APIRequestResultsRenderer} from "@common/APIRequestResultsRenderer";

import KubernetesGitKeyForm from "./KubernetesGitKeyForm"


type KubernetesGitKeyProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string, serviceLevel: string}>

interface KubernetesGitKeyState {
  serviceLevel: string
  method: string
  submitted: boolean
  notified: boolean
}

class KubernetesGitKeyImpl extends React.Component<KubernetesGitKeyProps, KubernetesGitKeyState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      serviceLevel: this.props.match.params.serviceLevel,
      method: 'post',
      submitted: false,
      notified: false
    }

    this.renderContent = this.renderContent.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
  }

  componentDidMount(): void {
    this.props.fetchKubernetesGitKey(this.props.match.params)
  }

  static getDerivedStateFromProps(nextProps: KubernetesGitKeyProps, nextState: KubernetesGitKeyState){
    const { saveKubernetesGitKeyStatus, kubernetesGitKey } = nextProps
    const { submitted, notified } = nextState

    if (submitted && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveKubernetesGitKeyStatus) && saveKubernetesGitKeyStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(saveKubernetesGitKeyStatus) && !saveKubernetesGitKeyStatus.result) || isAPIFailed<boolean>(saveKubernetesGitKeyStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully saved host' })
        nextProps.fetchKubernetesGitKey(nextProps.match.params)
        return { submitted: false, notified: true }
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: saveKubernetesGitKeyStatus['error']['message'] })
        return { submitted: false, notified: true }
      }
    } else {
      if (isAPIFailed(kubernetesGitKey) && !notified) {
        nextProps.addNotification({ color: 'success', message: 'No git key are registered.' })
        return { method: 'post', notified: true }
      } else if (isAPIFailed(kubernetesGitKey)) {
        return { method: 'post' }
      } else if (nextState.method !== 'patch') {
        return { method: 'patch' }
      }
    }
    if (nextState.serviceLevel != nextProps.match.params.serviceLevel) {
      nextProps.fetchKubernetesGitKey(nextProps.match.params)
      return { serviceLevel: nextProps.match.params.serviceLevel, notified: false }
    }
    return null
  }

  render(): JSX.Element {
    const { project, application, kubernetesGitKey, userInfoStatus, settings } = this.props
    const statuses: any = { project, application }
    if (isAPISucceeded(settings) && settings.result.auth) {
      statuses.userInfoStatus = userInfoStatus
    }
    if (this.state.method === 'patch') {
      statuses.kubernetesGitKey = kubernetesGitKey
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={statuses}
        render={this.renderContent}
      />
    )
  }

  renderContent(fetchedResults, canEdit) {
    const {projectId, applicationId, serviceLevel} = this.props.match.params
    const project: Project = fetchedResults.project
    const application = fetchedResults.application
    const kubernetesGitKey = fetchedResults.kubernetesGitKey

    return (
      <React.Fragment>
        <Breadcrumb tag="nav" listTag="div">
          <BreadcrumbItem tag="a" href="/">Projects</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}`}>{project.name}</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications`}>Applications</BreadcrumbItem>
          <BreadcrumbItem tag="a" href={`/projects/${project.projectId}/applications/${application.applicationId}`}>{application.name}</BreadcrumbItem>
          <BreadcrumbItem active tag="span">Git Key</BreadcrumbItem>
        </Breadcrumb>
        <Row className='align-items-center mb-5'>
          <Col xs='7'>
            <h1>
              <i className='fas fa-key fa-fw mr-2'></i>
              Git Key
            </h1>
          </Col>
        </Row>
        <h3>{serviceLevel}</h3>
        <hr />
        <KubernetesGitKeyForm
          projectId={projectId}
          applicationId={applicationId}
          canEdit={canEdit}
          initialValues={kubernetesGitKey}
          onSubmit={this.onSubmit}
          onCancel={this.onCancel} />
      </React.Fragment>
    )
  }

  onSubmit(params) {
    const apiParams = {
      ...this.props.match.params,
      ...params,
      method: this.state.method
    }

    this.props.saveKubernetesGitKey(apiParams)
    this.setState({ submitted: true, notified: false })
  }

  onCancel() {}
}

export interface StateProps {
  project: APIRequest<Project>
  application: APIRequest<Application>
  kubernetesGitKey: APIRequest<KubernetesGitKey>
  saveKubernetesGitKeyStatus: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  const props = {
    project: state.fetchProjectByIdReducer.fetchProjectById,
    application: state.fetchApplicationByIdReducer.fetchApplicationById,
    kubernetesGitKey: state.fetchKubernetesGitKeyReducer.fetchKubernetesGitKey,
    saveKubernetesGitKeyStatus: state.saveKubernetesGitKeyReducer.saveKubernetesGitKey,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings
  }
  return props
}

export interface DispatchProps {
  addNotification
  fetchKubernetesGitKey: (params: FetchKubernetesGitKeyParam) => Promise<void>
  saveKubernetesGitKey: (params: KubernetesGitKeyParam) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    fetchKubernetesGitKey: (params: FetchKubernetesGitKeyParam) => fetchKubernetesGitKeyDispatcher(dispatch, params),
    saveKubernetesGitKey: (params: KubernetesGitKeyParam) => saveKubernetesGitKeyDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string, serviceLevel: string}>>(
    mapStateToProps, mapDispatchToProps
  )(KubernetesGitKeyImpl))
