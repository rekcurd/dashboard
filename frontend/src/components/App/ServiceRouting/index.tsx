import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'

type ServiceRoutingStatusProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string}>

interface ServiceRoutingStatusState {}

class ServiceRouting extends React.Component<ServiceRoutingStatusProps, ServiceRoutingStatusState> {
  constructor(props, context) {
    super(props, context)
  }

  render(): JSX.Element {
    return (
      <div>hoge</div>
    )
  }
}

export interface StateProps {}

const mapStateToProps = (state): StateProps => {
  const props = {}
  return props
}

export interface DispatchProps {}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {}
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string}>>(
    mapStateToProps, mapDispatchToProps
  )(ServiceRouting))
