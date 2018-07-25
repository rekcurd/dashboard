import * as React from 'react'
import { connect } from 'react-redux'
import { RouterProps, RouteComponentProps } from 'react-router'
import { withRouter, Link } from 'react-router-dom'
import { Button } from 'reactstrap'

import {APIRequest, isAPIFailed, isAPISucceeded} from '@src/apis/Core'
import { Application } from '@src/apis'
import {
  fetchAllApplicationsDispatcher,
  syncKubernetesStatusDispatcher,
  addNotification
 } from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'

/**
 * Show list of all applications
 *
 * Home page to move detaied page for each application
 */
class ApplicationList extends React.Component<StateProps & DispatchProps & RouterProps> {
  constructor(props, context) {
    super(props, context)
    this.state = {
      syncSubmitted: false,
      syncNotified: false
    }

    this.renderApplications = this.renderApplications.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    const {
      syncAllKubernetesStatusStatus
    } = nextProps

    this.checkAndNotifyAPIResult(
      syncAllKubernetesStatusStatus,
      'syncSubmitted', 'syncNotified',
      'Successfully synced all hosts'
    )
  }

  checkAndNotifyAPIResult(status, submitted: string, notified: string, notificationText) {
    const submittedFlag: boolean = this.state[submitted]
    const notifiedFlag: boolean = this.state[notified]
    const { push } = this.props.history

    if (submittedFlag && !notifiedFlag) {
      const succeeded: boolean = isAPISucceeded<boolean>(status) && status.result
      const failed: boolean = (isAPISucceeded<boolean>(status) && !status.result) || isAPIFailed<boolean>(status)

      if (succeeded) {
        this.setState({[submitted]: false, [notified]: true})
        push('/applications')
        this.props.fetchApplications()
        this.props.addNotification({color: 'success', message: notificationText})
      } else if (failed) {
        this.setState({[submitted]: false, [notified]: true})
        this.props.addNotification({color: 'error', message: 'Something went wrong. Try again later'})
      }
    }
  }

  componentWillMount() {
    this.props.fetchApplications()
  }

  render() {
    const status = this.props.applications

    return (
      <APIRequestResultsRenderer
        APIStatus={{ applications: status }}
        render={this.renderApplications}
      />
    )

  }

  renderApplications(result) {
    const applications: Application[] = result.applications
    const { push } = this.props.history
    const submitSync = () => {
      this.setState({syncSubmitted: true, syncNotified: false})
      this.props.syncAllKubernetesStatus({})
    }

    const title = (
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h1>
          <i className='fas fa-plug fa-fw mr-3'></i>
          Applications
        </h1>
        <div>
          <Button color='primary' size='sm' onClick={(event) => push('/applications/add')}>
            <i className='fas fa-plus fa-fw mr-2'></i>
            Add Application
          </Button>
          {` `}
          <Button color='success' size='sm' onClick={submitSync}>
            <i className='fas fa-sync-alt fa-fw mr-2'></i>
            Sync All
          </Button>
        </div>
      </div>
    )

    return (
      <div className='row justify-content-center'>
        <div className='col-10 pt-5'>
          {title}
          {this.renderApplicationListTable(applications)}
        </div>
      </div>
    )
  }

  /**
   * Render table to show application
   * each cell has link to move detailed application page
   *
   * @param applications {Application[]} List of applications
   */
  renderApplicationListTable(applications: Application[]) {
    const applicationListTableBody = (
      applications.map(
        (value: Application) => (
          <tr key={value.id}>
            <td>
              <Link
                to={`/applications/${value.id}`}
                className='text-info'
              >
                {value.name}
              </Link>
            </td>
            <td>
              {value.description}
            </td>
            <td>
              {value.kubernetesId ? 'Yes' : 'No'}
            </td>
            <td>
              {value.date.toUTCString()}
            </td>
          </tr>
        )
      )
    )

    return (
      <table className='table table-hover' id='application-list'>
        <thead>
          <tr className='bg-light text-primary'>
            <th>Name</th><th>Description</th><th>Kubernetes</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          {applicationListTableBody}
        </tbody>
      </table>
    )
  }
}

export interface StateProps {
  applications: APIRequest<Application[]>
  syncAllKubernetesStatusStatus: APIRequest<boolean>
}

const mapStateToProps = (state) => {
  return {
    ...state.fetchAllApplicationsReducer,
    syncAllKubernetesStatusStatus: state.syncKubernetesStatusReducer.syncKubernetesStatus
  }
}

export interface DispatchProps {
  fetchApplications: () => Promise<void>,
  syncAllKubernetesStatus: (params) => Promise<void>,
  addNotification
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchApplications: () => fetchAllApplicationsDispatcher(dispatch),
    syncAllKubernetesStatus: () => syncKubernetesStatusDispatcher(dispatch, {}),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{}>>(
    mapStateToProps, mapDispatchToProps
  )(ApplicationList)
)
