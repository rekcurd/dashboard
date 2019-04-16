import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { Row, Col } from 'reactstrap'

import { APIRequest, isAPISucceeded, isAPIFailed } from '@src/apis/Core'
import {
  UserInfo, ServiceRouting,
  FetchServiceRoutingParam, ServiceRoutingParam, FetchKubernetesByIdParam
} from '@src/apis'
import {
  addNotification,
  fetchIsKubernetesModeDispatcher,
  fetchServiceRoutingDispatcher,
  updateServiceRoutingDispatcher
} from '@src/actions'
import {APIRequestResultsRenderer} from "@common/APIRequestResultsRenderer";

import ServiceRoutingForm from "./ServiceRoutingForm"


type ServiceRoutingProps = DispatchProps & StateProps & RouteComponentProps<{projectId: number, applicationId: string, serviceLevel: string}>

interface ServiceRoutingState {
  serviceLevel: string
  submitted: boolean
  notified: boolean
}

class ServiceRoutingImpl extends React.Component<ServiceRoutingProps, ServiceRoutingState> {
  constructor(props, context) {
    super(props, context)

    this.state = {
      serviceLevel: this.props.match.params.serviceLevel,
      submitted: false,
      notified: false
    }

    this.renderContent = this.renderContent.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)
  }

  componentDidMount(): void {
    this.props.fetchIsKubernetesMode(this.props.match.params)
    this.props.fetchServiceRouting(this.props.match.params)
  }

  static getDerivedStateFromProps(nextProps: ServiceRoutingProps, prevState: ServiceRoutingState){
    const { updateServiceRoutingStatus } = nextProps
    const { submitted, notified } = prevState

    if (submitted && !notified) {
      const succeeded: boolean = isAPISucceeded<boolean>(updateServiceRoutingStatus) && updateServiceRoutingStatus.result
      const failed: boolean = (isAPISucceeded<boolean>(updateServiceRoutingStatus) && !updateServiceRoutingStatus.result) || isAPIFailed<boolean>(updateServiceRoutingStatus)
      if (succeeded) {
        nextProps.addNotification({ color: 'success', message: 'Successfully saved host' })
        return { submitted: false, notified: true }
      } else if (failed) {
        nextProps.addNotification({ color: 'error', message: updateServiceRoutingStatus['error']['message'] })
        return { submitted: false, notified: true }
      }
    }
    if (prevState.serviceLevel != nextProps.match.params.serviceLevel) {
      nextProps.fetchServiceRouting(nextProps.match.params)
      return { serviceLevel: nextProps.match.params.serviceLevel }
    }
    return null
  }

  render(): JSX.Element {
    const { projectId, applicationId } = this.props.match.params
    const { kubernetesMode, routings, userInfoStatus, settings } = this.props
    const statuses: any = { kubernetesMode, routings }
    if (isAPISucceeded(settings) && settings.result.auth) {
      statuses.userInfoStatus = userInfoStatus
    }
    return (
      <APIRequestResultsRenderer
        APIStatus={statuses}
        render={this.renderContent}
        projectId={projectId}
        applicationId={applicationId}
      />
    )
  }

  renderContent(fetchedResults, canEdit) {
    const {projectId, applicationId, serviceLevel} = this.props.match.params
    const applicationName = fetchedResults.routings.applicationName

    return (
      <React.Fragment>
        <Row className='align-items-center mb-5'>
          <Col xs='7'>
            <h1>
              <i className='fas fa-ship fa-fw mr-2'></i>
              {applicationName}
            </h1>
          </Col>
        </Row>
        <h3>
          <i className='fas fa-route fa-fw mr-2'></i>
          Routing Weight ({serviceLevel})
        </h3>
        <hr />
        <ServiceRoutingForm
          projectId={projectId}
          applicationId={applicationId}
          canEdit={canEdit}
          routings={fetchedResults.routings}
          onSubmit={this.onSubmit}
          onCancel={this.onCancel} />
      </React.Fragment>
    )
  }

  onSubmit(params) {
    const serviceWeights = params.serviceWeights.map((serviceWeight) => {
      return {
        serviceId: serviceWeight.serviceId,
        serviceWeight: Number(serviceWeight.serviceWeight)
      }
    })
    const apiParams = {
      ...this.props.match.params,
      serviceWeights: serviceWeights
    }

    this.setState({ submitted: true, notified: false })
    return this.props.updateServiceRouting(apiParams)
  }

  onCancel() {}
}

export interface StateProps {
  kubernetesMode: APIRequest<boolean>
  routings: APIRequest<ServiceRouting>
  updateServiceRoutingStatus: APIRequest<boolean>
  userInfoStatus: APIRequest<UserInfo>
  settings: APIRequest<any>
}

const mapStateToProps = (state): StateProps => {
  const props = {
    kubernetesMode: state.fetchIsKubernetesModeReducer.fetchIsKubernetesMode,
    routings: state.fetchServiceRoutingReducer.fetchServiceRouting,
    updateServiceRoutingStatus: state.updateServiceRoutingReducer.updateServiceRouting,
    userInfoStatus: state.userInfoReducer.userInfo,
    settings: state.settingsReducer.settings
  }
  return props
}

export interface DispatchProps {
  addNotification
  fetchIsKubernetesMode: (params: FetchKubernetesByIdParam) => Promise<void>
  fetchServiceRouting: (params: FetchServiceRoutingParam) => Promise<void>
  updateServiceRouting: (params: ServiceRoutingParam) => Promise<void>
}

const mapDispatchToProps = (dispatch): DispatchProps => {
  return {
    addNotification: (params) => dispatch(addNotification(params)),
    fetchIsKubernetesMode: (params: FetchKubernetesByIdParam) => fetchIsKubernetesModeDispatcher(dispatch, params),
    fetchServiceRouting: (params: FetchServiceRoutingParam) => fetchServiceRoutingDispatcher(dispatch, params),
    updateServiceRouting: (params: ServiceRoutingParam) => updateServiceRoutingDispatcher(dispatch, params),
  }
}

export default withRouter(
  connect<StateProps, DispatchProps, RouteComponentProps<{projectId: number, applicationId: string, serviceLevel: string}>>(
    mapStateToProps, mapDispatchToProps
  )(ServiceRoutingImpl))
