import * as React from 'react'
import { isAPISucceeded, APIRequestStatusList } from '@src/apis/Core'

/**
 * Render component with API requests
 *
 *
 */

type RequestResultsPair = [APIRequestStatusList, any]

export class APIRequestResultsRenderer extends React.Component<any, any> {
  render() {
    const { render } = this.props
    const currentStatus: RequestResultsPair = this.checkAllRequestResults()

    if (currentStatus[0] === APIRequestStatusList.success) {
      return render(currentStatus[1])
    } else if (currentStatus[0] === APIRequestStatusList.fetching) {
      return (<div>Loading...</div>)
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
