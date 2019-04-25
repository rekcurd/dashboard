import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { APIRequestStatusList, isAPISucceeded } from '@src/apis/Core'
import { UserApplicationRole, UserProjectRole } from "@src/apis";
import { applicationRole, projectRole } from "@components/Common/Enum";
import { addNotification } from "@src/actions";


/**
 * Render component with API requests
 *
 *
 */
class APIRequestResults extends React.Component<APIRequestResultsProps, APIRequestResultsState> {
  componentDidUpdate() {
    const { location } = this.props
    const { push } = this.props.history
    const currentStatus: RequestResultsPair = this.checkAllRequestResults()
    if (location.pathname !== '/login' && currentStatus[0] === APIRequestStatusList.unauthorized) {
      push(`/login`)
    }
  }

  render() {
    const { render, renderFailed, addNotification } = this.props
    const { push } = this.props.history
    const { projectId, applicationId } = this.props.match.params
    const currentStatus: RequestResultsPair = this.checkAllRequestResults()

    if (currentStatus[0] === APIRequestStatusList.success) {
      const fetchedResults = currentStatus[1]
      if (fetchedResults.userInfoStatus && projectId) {
        const isProjectMember = fetchedResults.userInfoStatus.projectRoles.some((userRole: UserProjectRole) => {
          return Number(userRole.projectId) === Number(projectId)
        })
        if (!isProjectMember) {
          addNotification({ id: 'isProjectMember', color: 'error', message: "You don't have a permission. Contact your Project admin." })
          push(`/projects`)
          return null
        } else if (applicationId) {
          const canEdit = fetchedResults.userInfoStatus.applicationRoles.some((userRole: UserApplicationRole) => {
            return String(userRole.applicationId) === String(applicationId) &&
              (userRole.role === applicationRole.editor || userRole.role === applicationRole.admin)
          })
          return render(fetchedResults, canEdit)
        } else {
          const canEdit = fetchedResults.userInfoStatus.projectRoles.some((userRole: UserProjectRole) => {
            return Number(userRole.projectId) === Number(projectId) &&
              (userRole.role === projectRole.admin)
          })
          return render(fetchedResults, canEdit)
        }
      } else {
        return render(fetchedResults, true)
      }
    } else if (currentStatus[0] === APIRequestStatusList.fetching) {
      return (<div>Loading...</div>)
    } else if (currentStatus[0] === APIRequestStatusList.failure) {
      const fetchedResults = currentStatus[1]
      if (fetchedResults.userInfoStatus && projectId) {
        const isProjectMember = fetchedResults.userInfoStatus.projectRoles.some((userRole: UserProjectRole) => {
          return Number(userRole.projectId) === Number(projectId)
        })
        if (!isProjectMember) {
          addNotification({ id: 'isProjectMember', color: 'error', message: "You don't have a permission. Contact your Project admin." })
          push(`/projects`)
          return null
        }
      }
    }
    if (renderFailed) {
      return renderFailed()
    }
    return (<div>Something error happened. Please try again</div>)
  }

  checkAllRequestResults(): RequestResultsPair {
    const { APIStatus } = this.props

    return Object.keys(APIStatus)
              .map((key) => this.arrangeStatus(key, APIStatus[key]))
              .reduce(
                (accumerator, currentValue) =>
                  this.accumerate(accumerator, currentValue),
                [APIRequestStatusList.success, {}]
              )
  }

  arrangeStatus(key: string, status): RequestResultsPair {
    if (isAPISucceeded(status)) {
      return [APIRequestStatusList.success, {[key]: status.result}]
    }

    return [status.status, {}]
  }

  accumerate(accumerator: RequestResultsPair, currentValue: RequestResultsPair): RequestResultsPair {
    if (
      accumerator[0] === APIRequestStatusList.failure ||
      currentValue[0] === APIRequestStatusList.failure
    ) {
      return [APIRequestStatusList.failure, Object.assign(accumerator[1], currentValue[1])]
    }
    if (
      accumerator[0] === APIRequestStatusList.unauthorized ||
      currentValue[0] === APIRequestStatusList.unauthorized
    ) {
      return [APIRequestStatusList.unauthorized, {}]
    }

    const isLoading = (status: APIRequestStatusList) => (
      status === APIRequestStatusList.fetching
      || status === APIRequestStatusList.notStarted
    )
    if ( isLoading(accumerator[0]) || isLoading(currentValue[0]) ) {
      return [APIRequestStatusList.fetching, {}]
    }

    return [APIRequestStatusList.success, Object.assign(accumerator[1], currentValue[1])]
  }
}

type RequestResultsPair = [APIRequestStatusList, any]

type APIRequestResultsProps = StateProps & DispatchProps
  & RouteComponentProps<{projectId?: number, applicationId?: string}> & CustomProps

interface APIRequestResultsState {}

interface CustomProps {
  APIStatus: {}
  render: (result: any, canEdit: boolean) => JSX.Element
  renderFailed?: () => JSX.Element
}

export interface StateProps {}

const mapStateToProps = (state) => {
  return {}
}

export interface DispatchProps {
  addNotification: (params) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params))
  }
}

export const APIRequestResultsRenderer = withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId?: number, applicationId?: string}>>(
    mapStateToProps, mapDispatchToProps
  )(APIRequestResults)
)
