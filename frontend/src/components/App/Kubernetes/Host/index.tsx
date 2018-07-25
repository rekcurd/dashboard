import * as React from 'react'
import { connect } from 'react-redux'
import { RouterProps } from 'react-router'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { InjectedFormProps } from 'redux-form'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { KubernetesHost, SaveKubernetesHostParam } from '@src/apis'
import { saveKubernetesHostDispatcher, fetchKubernetesHostByIdDispatcher, addNotification } from '@src/actions'
import { HostForm, CustomProps as FormCustomProps } from './HostForm'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

/**
 * Page for adding/editing Kubernetes host
 *
 */
class Host extends React.Component<HostProps, {submitting: boolean, notified: boolean}> {
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
    const { saveKubernetesHost, mode } = this.props
    const formParams: KubernetesHost = params[mode].kubernetes
    const extraParams =
      mode === 'edit'
      ? {id: Number(this.props.match.params.kubernetesId)}
      : {}

    this.setState({submitting: true, notified: false})
    return saveKubernetesHost({...formParams, ...extraParams, method: mode})
  }

  /**
   * Handle cancel button
   *
   * Reset form and move to hosts list page
   */
  onCancel() {
    const { push } = this.props.history
    push('/settings/kubernetes/hosts')
  }

  componentWillMount() {
    if (this.props.mode === 'edit') {
      const { kubernetesId } = this.props.match.params
      this.props.fetchKubernetesHostById({ id: kubernetesId })
    }
  }

  componentWillReceiveProps(nextProps) {
    const { saveKubernetesHostStatus } = nextProps
    const { push } = this.props.history
    const { submitting, notified } = this.state

    // Handling submitted API results
    if (submitting && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveKubernetesHostStatus) && saveKubernetesHostStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(saveKubernetesHostStatus) && !saveKubernetesHostStatus.result) ||
        isAPIFailed<boolean>(saveKubernetesHostStatus)
      if (succeeded) {
        this.setState({notified: true})
        push('/settings/kubernetes/hosts')
        nextProps.addNotification({ color: 'success', message: 'Successfully saved host' })
      } else if (failed) {
        this.setState({notified: true})
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
      }
    }
  }

  render() {
    const { mode } = this.props
    if (mode === 'edit') {
      return (
        <APIRequestResultsRenderer
          APIStatus={{ host: this.props.fetchKubernetesHostByIdStatus }}
          render={this.renderEditForm}
        />
      )
    }
    return (
      <HostForm
        onCancel={this.onCancel}
        onSubmit={this.onSubmit}
        mode={this.props.mode}
      />
    )
  }

  renderEditForm(result) {
    const properties = { ...result.host }
    return (
      <HostForm
        onCancel={this.onCancel}
        onSubmit={this.onSubmit}
        mode={this.props.mode}
        initialValues={{ edit: { kubernetes: { ...properties } } }}
      />
    )
  }
}

type HostProps =
  StateProps & DispatchProps
  & CustomProps
  & InjectedFormProps<{}, FormCustomProps>
  & RouterProps & RouteComponentProps<{ kubernetesId?: string }>

interface StateProps {
  saveKubernetesHostStatus: APIRequest<boolean>
  fetchKubernetesHostByIdStatus: APIRequest<any>
}

interface CustomProps {
  mode: string
}

const mapStateToProps = (state: any, extraProps: CustomProps) => (
  {
    saveKubernetesHostStatus: state.saveKubernetesHostReducer.saveKubernetesHost,
    fetchKubernetesHostByIdStatus: state.fetchKubernetesHostByIdReducer.kubernetesHostById,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  saveKubernetesHost: (params: SaveKubernetesHostParam) => Promise<void>
  fetchKubernetesHostById: (params) => Promise<void>
  addNotification: (params) => any
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    saveKubernetesHost: (params: SaveKubernetesHostParam) => saveKubernetesHostDispatcher(dispatch, params),
    fetchKubernetesHostById: (params) => fetchKubernetesHostByIdDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{ kubernetesId?: string }> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(Host)
)
