import * as React from 'react'
import { connect } from 'react-redux'
import { RouterProps } from 'react-router'
import { withRouter, RouteComponentProps } from 'react-router-dom'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { Kubernetes, KubernetesParam, FetchKubernetesByIdParam, UserInfo, FetchProjectByIdParam } from '@src/apis'
import {
  fetchProjectByIdDispatcher,
  saveKubernetesDispatcher,
  fetchKubernetesByIdDispatcher,
  addNotification
} from '@src/actions'
import { HostForm } from './HostForm'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

/**
 * Page for adding/editing Kubernetes host
 *
 */
class Host extends React.Component<HostProps, HostState> {
  constructor(props, context) {
    super(props, context)

    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.renderEditForm = this.renderEditForm.bind(this)
    this.state = {
      submitting: false,
      notified: false
    }
  }

  /**
   * Handle submit
   *
   * @param params
   */
  onSubmit(params) {
    const { saveKubernetes, method } = this.props
    const formParams: Kubernetes = params
    const extraParams =
      method === 'patch'
      ? {kubernetesId: Number(this.props.match.params.kubernetesId)}
      : {}

    this.setState({submitting: true, notified: false})
    return saveKubernetes({
      projectId: this.props.match.params.projectId,
      ...formParams, ...extraParams, method: method
    })
  }

  /**
   * Handle cancel button
   *
   * Reset form and move to hosts list page
   */
  onCancel() {
    const { push } = this.props.history
    push(`/projects/${this.props.match.params.projectId}/kubernetes`)
  }

  componentDidMount() {
    if (this.props.method === 'patch') {
      this.props.fetchKubernetesById({
        projectId: this.props.match.params.projectId,
        kubernetesId: this.props.match.params.kubernetesId
      })
    }
  }

  static getDerivedStateFromProps(nextProps: HostProps, prevState: HostState){
    const { saveKubernetesStatus } = nextProps
    const { push } = nextProps.history
    const { submitting, notified } = prevState

    // Handling submitted API results
    if (submitting && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveKubernetesStatus) && saveKubernetesStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(saveKubernetesStatus) && !saveKubernetesStatus.result) || isAPIFailed<boolean>(saveKubernetesStatus)
      if (succeeded) {
        push(`/projects/${nextProps.match.params.projectId}/kubernetes`)
        nextProps.addNotification({ color: 'success', message: 'Successfully saved host' })
        nextProps.fetchProjectById(nextProps.match.params)
        return { submitting: false, notified: true }
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return { submitting: false, notified: true }
      }
    }
    return null
  }

  render() {
    const { method, userInfoStatus, settings } = this.props
    const targetStatus: any = {}

    if (isAPISucceeded(settings) && settings.result.auth) {
      targetStatus.userInfoStatus = userInfoStatus
    }
    if (method === 'patch') {
      targetStatus.host = this.props.fetchKubernetesByIdStatus
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={targetStatus}
        render={this.renderEditForm}
      />
    )
  }

  renderEditForm(result, canEdit) {
    if (!canEdit) {
      this.props.history.push(`/projects/${this.props.match.params.projectId}/kubernetes`)
      this.props.addNotification({ color: 'error', message: "You don't have a permission. Contact your Project admin." })
    }

    if (this.props.method === 'patch') {
      const properties = { ...result.host }
      return (
        <HostForm
          onCancel={this.onCancel}
          onSubmit={this.onSubmit}
          method={this.props.method}
          initialValues={...properties}
        />
      )
    } else {
      return (
        <HostForm
          onCancel={this.onCancel}
          onSubmit={this.onSubmit}
          method={this.props.method}
        />
      )
    }
  }
}

type HostProps =
  StateProps & DispatchProps
  & CustomProps
  & RouterProps & RouteComponentProps<{ projectId: number, kubernetesId?: number }>

interface HostState {
  submitting: boolean,
  notified: boolean
}

interface StateProps {
  saveKubernetesStatus: APIRequest<boolean>
  fetchKubernetesByIdStatus: APIRequest<any>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

interface CustomProps {
  method: string
}

const mapStateToProps = (state: any, extraProps: CustomProps) => (
  {
    saveKubernetesStatus: state.saveKubernetesReducer.saveKubernetes,
    fetchKubernetesByIdStatus: state.fetchKubernetesByIdReducer.fetchKubernetesById,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  fetchProjectById: (params: FetchProjectByIdParam) => Promise<void>
  saveKubernetes: (params: KubernetesParam) => Promise<void>
  fetchKubernetesById: (params: FetchKubernetesByIdParam) => Promise<void>
  addNotification: (params) => any
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchProjectById: (params: FetchProjectByIdParam) => fetchProjectByIdDispatcher(dispatch, params),
    saveKubernetes: (params: KubernetesParam) => saveKubernetesDispatcher(dispatch, params),
    fetchKubernetesById: (params: FetchKubernetesByIdParam) => fetchKubernetesByIdDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{ projectId: number, kubernetesId?: number }> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(Host)
)
