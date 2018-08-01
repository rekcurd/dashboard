import * as React from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { isAPISucceeded, APIRequestStatusList, APIRequest } from '@src/apis/Core'

/**
 * Render component with API requests
 *
 *
 */

interface Props {
  APIStatus: {}
  render: (result: any) => JSX.Element
  renderFailed?: () => JSX.Element
}

type RequestResultsPair = [APIRequestStatusList, any]

class APIRequestResults extends React.Component<Props & RouteComponentProps<{}>, {}> {
  componentDidUpdate() {
    const { location } = this.props
    const { push } = this.props.history
    const currentStatus: RequestResultsPair = this.checkAllRequestResults()
    if (location.pathname !== '/login' && currentStatus[0] === APIRequestStatusList.unauhorized) {
      push(`/login`)
    }
  }

  render() {
    const { render, renderFailed } = this.props
    const currentStatus: RequestResultsPair = this.checkAllRequestResults()

    if (currentStatus[0] === APIRequestStatusList.success) {
      return render(currentStatus[1])
    } else if (currentStatus[0] === APIRequestStatusList.fetching) {
      return (<div>Loading...</div>)
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
      accumerator[0] === APIRequestStatusList.failue ||
      currentValue[0] === APIRequestStatusList.failue
    ) {
      return [APIRequestStatusList.failue, {}]
    }
    if (
      accumerator[0] === APIRequestStatusList.unauhorized ||
      currentValue[0] === APIRequestStatusList.unauhorized
    ) {
      return [APIRequestStatusList.unauhorized, {}]
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

export const APIRequestResultsRenderer = withRouter(APIRequestResults)
