import * as React from 'react'
import { connect } from 'react-redux'
import { RouterProps } from 'react-router'
import { withRouter, RouteComponentProps } from 'react-router-dom'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { Kubernetes, KubernetesParam, FetchKubernetesByIdParam } from '@src/apis'
import { saveKubernetesDispatcher, fetchKubernetesByIdDispatcher, addNotification } from '@src/actions'
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
      const failed: boolean = (isAPISucceeded<boolean>(saveKubernetesStatus) && !saveKubernetesStatus.result) ||
        isAPIFailed<boolean>(saveKubernetesStatus)
      if (succeeded) {
        push(`/projects/${nextProps.match.params.projectId}/kubernetes`)
        nextProps.addNotification({ color: 'success', message: 'Successfully saved host' })
        return {notified: true}
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return {notified: true}
      }
    }
  }

  render() {
    const { method } = this.props
    if (method === 'patch') {
      return (
        <APIRequestResultsRenderer
          APIStatus={{ host: this.props.fetchKubernetesByIdStatus }}
          render={this.renderEditForm}
        />
      )
    }
    return (
      <HostForm
        onCancel={this.onCancel}
        onSubmit={this.onSubmit}
        method={this.props.method}
      />
    )
  }

  renderEditForm(result) {
    const properties = { ...result.host }
    return (
      <HostForm
        onCancel={this.onCancel}
        onSubmit={this.onSubmit}
        method={this.props.method}
        initialValues={...properties}
      />
    )
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
}

interface CustomProps {
  method: string
}

const mapStateToProps = (state: any, extraProps: CustomProps) => (
  {
    saveKubernetesStatus: state.saveKubernetesReducer.saveKubernetes,
    fetchKubernetesByIdStatus: state.fetchKubernetesByIdReducer.fetchKubernetesById,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  saveKubernetes: (params: KubernetesParam) => Promise<void>
  fetchKubernetesById: (params: FetchKubernetesByIdParam) => Promise<void>
  addNotification: (params) => any
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
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
