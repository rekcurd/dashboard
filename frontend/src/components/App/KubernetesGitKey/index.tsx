import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  UserInfo, KubernetesGitKey,
  FetchKubernetesGitKeyParam, KubernetesGitKeyParam, Application
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

  static getDerivedStateFromProps(nextProps: KubernetesGitKeyProps, prevState: KubernetesGitKeyState){
    const { saveKubernetesGitKeyStatus, kubernetesGitKey } = nextProps
    const { submitted, notified } = prevState

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
      } else if (prevState.method !== 'patch') {
        return { method: 'patch' }
      }
    }
    if (prevState.serviceLevel != nextProps.match.params.serviceLevel) {
      nextProps.fetchKubernetesGitKey(nextProps.match.params)
      return { serviceLevel: nextProps.match.params.serviceLevel, notified: false }
    }
    return null
  }

  render(): JSX.Element {
    const { application, kubernetesGitKey, userInfoStatus, settings } = this.props
    const statuses: any = { application }
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
    const applicationName = fetchedResults.application.name
    const kubernetesGitKey = fetchedResults.kubernetesGitKey

    return (
      <React.Fragment>
        <Row className='align-items-center mb-5'>
          <Col xs='7'>
            <h1>
              <i className='fas fa-ship fa-fw mr-2'></i>
              {applicationName}
            </h1>
          </Col>
        </Row>
        <h3>
          <i className='fas fa-key fa-fw mr-2'></i>
          Git SSH Key ({serviceLevel})
        </h3>
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

    this.setState({ submitted: true, notified: false })
    return this.props.saveKubernetesGitKey(apiParams)
  }

  onCancel() {}
}

export interface StateProps {
  application: APIRequest<Application>
  kubernetesGitKey: APIRequest<KubernetesGitKey>
  saveKubernetesGitKeyStatus: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  const props = {
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
