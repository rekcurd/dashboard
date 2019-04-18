import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { withRouter, Link } from 'react-router-dom'
import { Button } from 'reactstrap'

import { APIRequest, isAPIFailed, isAPISucceeded } from '@src/apis/Core'
import {
  Application, FetchApplicationByIdParam, FetchKubernetesByIdParam, SyncKubernetesParam, UserInfo
} from '@src/apis'
import {
  fetchAllApplicationsDispatcher,
  fetchIsKubernetesModeDispatcher,
  syncKubernetesDispatcher,
  addNotification
} from '@src/actions'
import { APIRequestResultsRenderer } from '@common/APIRequestResultsRenderer'


type ApplicationProps = StateProps & DispatchProps & RouteComponentProps<{projectId: number}>
interface ApplicationState {
  syncSubmitted: boolean
  syncNotified: boolean
}

/**
 * Show list of all applications
 *
 * Home page to move detaied page for each application
 */
class ApplicationList extends React.Component<ApplicationProps, ApplicationState> {
  constructor(props, context) {
    super(props, context)
    this.state = {
      syncSubmitted: false,
      syncNotified: false
    }

    this.renderApplications = this.renderApplications.bind(this)
  }

  componentDidMount() {
    this.props.fetchIsKubernetesMode(this.props.match.params)
    this.props.fetchApplications(this.props.match.params)
  }

  static getDerivedStateFromProps(nextProps: ApplicationProps, prevState: ApplicationState){
    const { syncKubernetes } = nextProps
    const { syncSubmitted, syncNotified } = prevState

    if (syncSubmitted && !syncNotified) {
      const succeeded: boolean = isAPISucceeded<boolean>(syncKubernetes) && syncKubernetes.result
      const failed: boolean = (isAPISucceeded<boolean>(syncKubernetes) && !syncKubernetes.result) || isAPIFailed<boolean>(syncKubernetes)

      if (succeeded) {
        nextProps.fetchApplications({projectId: nextProps.match.params.projectId})
        nextProps.addNotification({color: 'success', message: 'Successfully synced all hosts'})
        return {syncSubmitted: false, syncNotified: true}
      } else if (failed) {
        nextProps.addNotification({color: 'error', message: 'Something went wrong. Try again later'})
        return {syncSubmitted: false, syncNotified: true}
      }
    }
    return null
  }

  render() {
    const { kubernetesMode, applications, userInfoStatus, settings } = this.props
    const targetStatus: any = { kubernetesMode, applications }
    if (isAPISucceeded(settings) && settings.result.auth) {
      targetStatus.userInfoStatus = userInfoStatus
    }

    return (
      <APIRequestResultsRenderer
        APIStatus={targetStatus}
        render={this.renderApplications}
      />
    )

  }

  renderApplications(result) {
    const applications: Application[] = result.applications
    const kubernetesMode: boolean = result.kubernetesMode
    const { push } = this.props.history
    const submitSync = () => {
      this.props.syncKubernetes({projectId: this.props.match.params.projectId})
      this.setState({syncSubmitted: true, syncNotified: false})
    }

    const syncKubernetes = kubernetesMode ? (
      <React.Fragment>
        {` `}
        <Button color='success' size='sm' onClick={submitSync}>
          <i className='fas fa-sync-alt fa-fw mr-2'></i>
          Sync All
        </Button>
      </React.Fragment>
    ) : null

    const title = (
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h1>
          <i className='fas fa-plug fa-fw mr-3'></i>
          Applications
        </h1>
        <div>
          <Button color='primary' size='sm' onClick={(event) => push(`/projects/${this.props.match.params.projectId}/applications/add`)}>
            <i className='fas fa-plus fa-fw mr-2'></i>
            Add Application
          </Button>
          {syncKubernetes}
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
    const { projectId } = this.props.match.params
    const applicationListTableBody = (
      applications.map(
        (value: Application) => (
          <tr key={value.applicationId}>
            <td>
              <Link
                to={`/projects/${projectId}/applications/${value.applicationId}`}
                className='text-info'
              >
                {value.name}
              </Link>
            </td>
            <td>
              {value.description}
            </td>
            <td>
              {value.registerDate.toUTCString()}
            </td>
          </tr>
        )
      )
    )

    return (
      <table className='table table-hover' id='application-list'>
        <thead>
          <tr className='bg-light text-primary'>
            <th>Name</th><th>Description</th><th>Date</th>
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
  kubernetesMode: APIRequest<boolean>
  syncKubernetes: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state) => {
  return {
    applications: state.fetchAllApplicationsReducer.fetchAllApplications,
    kubernetesMode: state.fetchIsKubernetesModeReducer.fetchIsKubernetesMode,
    syncKubernetes: state.syncKubernetesReducer.syncKubernetes,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings,
  }
}

export interface DispatchProps {
  fetchApplications: (params: FetchApplicationByIdParam) => Promise<void>,
  fetchIsKubernetesMode: (params: FetchKubernetesByIdParam) => Promise<void>,
  syncKubernetes: (params: SyncKubernetesParam) => Promise<void>,
  addNotification
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    fetchApplications: (params: FetchApplicationByIdParam) => fetchAllApplicationsDispatcher(dispatch, params),
    fetchIsKubernetesMode: (params: FetchKubernetesByIdParam) => fetchIsKubernetesModeDispatcher(dispatch, params),
    syncKubernetes: (params: SyncKubernetesParam) => syncKubernetesDispatcher(dispatch, params),
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number}>>(
    mapStateToProps, mapDispatchToProps
  )(ApplicationList)
)
