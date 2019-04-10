import * as React from 'react'
import { connect } from 'react-redux'
import { RouterProps } from 'react-router'
import { withRouter, RouteComponentProps } from 'react-router-dom'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import { DataServerParam, FetchDataServerByIdParam } from '@src/apis'
import { saveDataServerDispatcher, fetchDataServerDispatcher, addNotification } from '@src/actions'
import { DataServerForm } from './DataServerForm'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

/**
 * Page for adding/editing DataServer
 *
 */
class DataServerComponent extends React.Component<DataServerProps, DataServerState> {
  constructor(props, context) {
    super(props, context)

    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.renderEditForm = this.renderEditForm.bind(this)
    this.state = {
      method: 'post',
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
    const { saveDataServer } = this.props

    this.setState({submitting: true, notified: false})
    return saveDataServer({
      projectId: this.props.match.params.projectId,
      ...params,
      method: this.state.method
    })
  }

  /**
   * Handle cancel button
   *
   * Reset form and move to hosts list page
   */
  onCancel() {
    const { push } = this.props.history
    push(`/projects/${this.props.match.params.projectId}`)
  }

  componentDidMount() {
    this.props.fetchDataServer({
      projectId: this.props.match.params.projectId
    })
  }

  static getDerivedStateFromProps(nextProps: DataServerProps, prevState: DataServerState){
    const { saveDataServerStatus, fetchDataServerStatus } = nextProps
    const { submitting, notified } = prevState

    // Handling submitted API results
    if (submitting && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(saveDataServerStatus) && saveDataServerStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(saveDataServerStatus) && !saveDataServerStatus.result) || isAPIFailed<boolean>(saveDataServerStatus)
      if (succeeded) {
        nextProps.fetchDataServer({
          projectId: nextProps.match.params.projectId
        })
        nextProps.addNotification({ color: 'success', message: 'Successfully saved host' })
        return {submitting: false, notified: true}
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: 'Something went wrong. Try again later' })
        return {submitting: false, notified: true}
      }
    } else {
      const failed: boolean = (isAPISucceeded<boolean>(fetchDataServerStatus) && !fetchDataServerStatus.result) || isAPIFailed<boolean>(fetchDataServerStatus)
      if (failed) {
        return {method: 'post'}
      } else {
        return {method: 'patch'}
      }
    }
    return null
  }

  render() {
    const { method } = this.state
    if (method === 'patch') {
      return (
        <APIRequestResultsRenderer
          APIStatus={{ data_servers: this.props.fetchDataServerStatus }}
          render={this.renderEditForm}
        />
      )
    }
    return (
      <DataServerForm
        onCancel={this.onCancel}
        onSubmit={this.onSubmit}
        method={this.state.method}
      />
    )
  }

  renderEditForm(result) {
    return (
      <DataServerForm
        onCancel={this.onCancel}
        onSubmit={this.onSubmit}
        method={this.state.method}
        initialValues={...result.data_servers}
      />
    )
  }
}

type DataServerProps =
  StateProps & DispatchProps
  & CustomProps
  & RouterProps & RouteComponentProps<{ projectId: number }>

interface DataServerState {
  method: string,
  submitting: boolean,
  notified: boolean
}

interface StateProps {
  saveDataServerStatus: APIRequest<boolean>
  fetchDataServerStatus: APIRequest<any>
}

interface CustomProps {}

const mapStateToProps = (state: any, extraProps: CustomProps) => (
  {
    saveDataServerStatus: state.saveDataServerReducer.saveDataServer,
    fetchDataServerStatus: state.fetchDataServerReducer.fetchDataServer,
    ...state.form,
    ...extraProps
  }
)

export interface DispatchProps {
  saveDataServer: (params: DataServerParam) => Promise<void>
  fetchDataServer: (params: FetchDataServerByIdParam) => Promise<void>
  addNotification: (params) => any
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    saveDataServer: (params: DataServerParam) => saveDataServerDispatcher(dispatch, params),
    fetchDataServer: (params: FetchDataServerByIdParam) => fetchDataServerDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{ projectId: number }> & CustomProps>(
    mapStateToProps, mapDispatchToProps
  )(DataServerComponent)
)
